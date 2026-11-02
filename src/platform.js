const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const CATEGORIES = [
  'Software Engineering',
  'Web Development',
  'Mobile Development',
  'Data Science & AI',
  'Cybersecurity',
  'Cloud & DevOps',
  'Databases',
  'Networking & Systems',
];
function initSchema(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users(user_id TEXT PRIMARY KEY REFERENCES users(user_id));
  CREATE TABLE IF NOT EXISTS courses(course_id TEXT PRIMARY KEY,teacher_id TEXT NOT NULL REFERENCES users(user_id),title TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published')),created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS enrollments(enrollment_id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(user_id),course_id TEXT NOT NULL REFERENCES courses(course_id),enrolled_at TEXT NOT NULL,UNIQUE(user_id,course_id));
  CREATE TABLE IF NOT EXISTS lessons(lesson_id TEXT PRIMARY KEY,course_id TEXT NOT NULL REFERENCES courses(course_id),title TEXT NOT NULL,content TEXT NOT NULL DEFAULT '',position INTEGER NOT NULL,video_file TEXT,archived INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS progress(user_id TEXT NOT NULL REFERENCES users(user_id),lesson_id TEXT NOT NULL REFERENCES lessons(lesson_id),completed INTEGER NOT NULL DEFAULT 0,position REAL NOT NULL DEFAULT 0,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,lesson_id));
  CREATE TABLE IF NOT EXISTS notes(user_id TEXT NOT NULL REFERENCES users(user_id),lesson_id TEXT NOT NULL REFERENCES lessons(lesson_id),body TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(user_id,lesson_id));
  CREATE TABLE IF NOT EXISTS saved_courses(user_id TEXT NOT NULL REFERENCES users(user_id),course_id TEXT NOT NULL REFERENCES courses(course_id),PRIMARY KEY(user_id,course_id));
  CREATE TABLE IF NOT EXISTS assignments(assignment_id TEXT PRIMARY KEY,course_id TEXT NOT NULL REFERENCES courses(course_id),title TEXT NOT NULL,instructions TEXT NOT NULL,due_at TEXT);
  CREATE TABLE IF NOT EXISTS submissions(submission_id TEXT PRIMARY KEY,assignment_id TEXT NOT NULL REFERENCES assignments(assignment_id),user_id TEXT NOT NULL REFERENCES users(user_id),body TEXT NOT NULL,submitted_at TEXT NOT NULL,score INTEGER,feedback TEXT NOT NULL DEFAULT '',UNIQUE(assignment_id,user_id));
  CREATE TABLE IF NOT EXISTS questions(question_id TEXT PRIMARY KEY,course_id TEXT NOT NULL REFERENCES courses(course_id),user_id TEXT NOT NULL REFERENCES users(user_id),body TEXT NOT NULL,answer TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS promotions(promotion_id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,discount_percent INTEGER NOT NULL,course_id TEXT REFERENCES courses(course_id),enabled INTEGER NOT NULL,starts_at TEXT,ends_at TEXT,created_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id,archived,position);
  CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
  CREATE INDEX IF NOT EXISTS idx_questions_course ON questions(course_id);
  `);
}
function createPlatform({ db, readJson, sendJson, getUser, sign, dataDir, failure }) {
  const videoDir = path.join(dataDir, 'videos');
  fs.mkdirSync(videoDir, { recursive: true });
  const q = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const text = (value, max, optional = false) => {
    if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max)
      throw failure(`Enter valid text (up to ${max} characters).`);
    return value.trim();
  };
  const date = (value) => {
    if (!value) return null;
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))
      throw failure('Enter a valid date.');
    return new Date(value).toISOString();
  };
  function canManage(user, course) {
    return user.role === 'admin' || (user.role === 'teacher' && course.teacher_id === user.user_id);
  }
  function courseAccess(user, id, edit = false, preview = false) {
    const course = q(
      "SELECT c.*,u.first_name || ' ' || u.last_name AS teacher_name FROM courses c JOIN users u ON u.user_id=c.teacher_id WHERE course_id=?",
      id,
    );
    if (!course) throw failure('Course not found.', 404);
    if (canManage(user, course)) return course;
    if (
      !edit &&
      preview &&
      user.role === 'student' &&
      course.status !== 'published' &&
      !q('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', user.user_id, id)
    )
      throw failure('Course unavailable.', 404);
    if (
      !edit &&
      user.role === 'student' &&
      (q('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', user.user_id, id) ||
        (preview && course.status === 'published'))
    )
      return course;
    throw failure('You do not have access to this course.', 403);
  }
  function lessonAccess(user, id, edit = false) {
    const lesson = q('SELECT * FROM lessons WHERE lesson_id=? AND archived=0', id);
    if (!lesson) throw failure('Lesson not found.', 404);
    courseAccess(user, lesson.course_id, edit);
    return lesson;
  }
  const summary = (course, user) => {
    const counts = q(
      `SELECT COUNT(*) AS total,SUM(CASE WHEN p.completed=1 THEN 1 ELSE 0 END) AS done FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.lesson_id AND p.user_id=? WHERE l.course_id=? AND l.archived=0`,
      user.user_id,
      course.course_id,
    );
    return {
      ...course,
      lesson_count: counts.total,
      completed_count: counts.done || 0,
      progress_percent: counts.total ? Math.round((100 * (counts.done || 0)) / counts.total) : 0,
      enrolled: !!q(
        'SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?',
        user.user_id,
        course.course_id,
      ),
      saved: !!q(
        'SELECT 1 FROM saved_courses WHERE user_id=? AND course_id=?',
        user.user_id,
        course.course_id,
      ),
      student_count: q('SELECT COUNT(*) AS n FROM enrollments WHERE course_id=?', course.course_id)
        .n,
    };
  };
  return async function platform(req, res, url) {
    const route = url.pathname,
      method = req.method;
    const json = (status, value) => {
      sendJson(res, status, value);
      return true;
    };
    if (route === '/api/categories' && method === 'GET')
      return json(200, { categories: CATEGORIES });
    const media = route.match(/^\/api\/media\/([^/]+)$/);
    if (media && ['GET', 'HEAD'].includes(method)) {
      const userId = url.searchParams.get('user'),
        expires = Number(url.searchParams.get('expires')),
        signature = url.searchParams.get('signature') || '';
      const expected = sign(`media:${media[1]}:${userId}:${expires}`);
      if (
        !Number.isInteger(expires) ||
        expires < Date.now() / 1000 ||
        expires > Date.now() / 1000 + 43201 ||
        signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      )
        throw failure('Video link expired. Reopen the lesson.', 401);
      const user = q(
        `SELECT u.*,CASE WHEN a.user_id IS NOT NULL THEN 'admin' ELSE u.role END AS role FROM users u LEFT JOIN admin_users a ON a.user_id=u.user_id WHERE u.user_id=? AND u.disabled=0`,
        userId,
      );
      if (!user) throw failure('Account unavailable.', 401);
      const lesson = lessonAccess(user, media[1]);
      if (!lesson.video_file) throw failure('No video uploaded.', 404);
      const file = path.join(videoDir, path.basename(lesson.video_file));
      const stat = await fs.promises.stat(file);
      let start = 0,
        end = stat.size - 1,
        status = 200;
      if (req.headers.range) {
        const match = req.headers.range.match(/^bytes=(\d*)-(\d*)$/);
        if (!match || (!match[1] && !match[2])) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          res.end();
          return true;
        }
        if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
        else {
          start = Number(match[1]);
          if (match[2]) end = Math.min(end, Number(match[2]));
        }
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start < 0 ||
          start > end ||
          start >= stat.size
        ) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          res.end();
          return true;
        }
        status = 206;
      }
      res.writeHead(status, {
        'Content-Type': file.endsWith('.webm') ? 'video/webm' : 'video/mp4',
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store',
        ...(status === 206 ? { 'Content-Range': `bytes ${start}-${end}/${stat.size}` } : {}),
      });
      if (method === 'HEAD') res.end();
      else {
        const stream = fs.createReadStream(file, { start, end });
        stream.on('error', () => res.destroy());
        res.on('close', () => stream.destroy());
        stream.pipe(res);
      }
      return true;
    }
    if (!route.startsWith('/api/')) return false;
    const user = getUser(req);
    if (!user) throw failure('Please sign in to continue.', 401);
    if (route === '/api/courses' && method === 'GET') {
      const rows = all(
        `SELECT c.*,u.first_name || ' ' || u.last_name AS teacher_name FROM courses c JOIN users u ON u.user_id=c.teacher_id WHERE (?='admin') OR (?='teacher' AND c.teacher_id=?) OR (?='student' AND c.status='published' AND u.disabled=0) ORDER BY created_at DESC`,
        user.role,
        user.role,
        user.user_id,
        user.role,
      );
      return json(200, { courses: rows.map((course) => summary(course, user)) });
    }
    if (['/api/enrollments', '/api/saved'].includes(route) && method === 'GET') {
      const table = route === '/api/saved' ? 'saved_courses' : 'enrollments';
      const rows = all(
        `SELECT c.*,u.first_name || ' ' || u.last_name AS teacher_name FROM ${table} e JOIN courses c ON c.course_id=e.course_id JOIN users u ON u.user_id=c.teacher_id WHERE e.user_id=? ORDER BY c.created_at DESC`,
        user.user_id,
      );
      return json(200, { courses: rows.map((course) => summary(course, user)) });
    }
    if (route === '/api/courses' && method === 'POST') {
      if (user.role !== 'teacher') throw failure('Only teachers can create courses.', 403);
      const input = await readJson(req);
      const title = text(input.title, 120),
        description = text(input.description, 2000),
        category = text(input.category, 60);
      if (!CATEGORIES.includes(category)) throw failure('Choose a technical course category.');
      const id = crypto.randomUUID();
      run(
        'INSERT INTO courses VALUES (?,?,?,?,?,?,?)',
        id,
        user.user_id,
        title,
        description,
        category,
        'draft',
        new Date().toISOString(),
      );
      return json(201, { course: q('SELECT * FROM courses WHERE course_id=?', id) });
    }
    let match = route.match(
      /^\/api\/courses\/([^/]+)(?:\/(enroll|save|lessons|assignments|questions|students))?$/,
    );
    if (match) {
      const id = match[1],
        action = match[2];
      const course = courseAccess(
        user,
        id,
        method === 'PATCH' ||
          (method === 'POST' && !['enroll', 'save', 'questions'].includes(action)) ||
          action === 'students',
        !action || ['enroll', 'save'].includes(action),
      );
      if (!action && method === 'GET') {
        const enrolled = !!q(
          'SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?',
          user.user_id,
          id,
        );
        const access = canManage(user, course) || enrolled;
        const lessons = all(
          'SELECT lesson_id,title,position,video_file IS NOT NULL AS has_video FROM lessons WHERE course_id=? AND archived=0 ORDER BY position,lesson_id',
          id,
        );
        const progress = access
          ? all(
              'SELECT p.* FROM progress p JOIN lessons l ON l.lesson_id=p.lesson_id WHERE l.course_id=? AND p.user_id=?',
              id,
              user.user_id,
            )
          : [];
        return json(200, {
          course: summary(course, user),
          lessons,
          progress,
          can_manage: canManage(user, course),
          can_learn: access,
        });
      }
      if (!action && method === 'PATCH') {
        const input = await readJson(req);
        const next = { ...course };
        if ('status' in input) {
          if (!['draft', 'published'].includes(input.status))
            throw failure('Choose draft or published.');
          next.status = input.status;
        }
        if ('title' in input) next.title = text(input.title, 120);
        if ('description' in input) next.description = text(input.description, 2000);
        if ('category' in input) {
          if (!CATEGORIES.includes(input.category)) throw failure('Choose a technical category.');
          next.category = input.category;
        }
        run(
          'UPDATE courses SET title=?,description=?,category=?,status=? WHERE course_id=?',
          next.title,
          next.description,
          next.category,
          next.status,
          id,
        );
        return json(200, { course: next });
      }
      if (action === 'enroll' && method === 'POST') {
        if (user.role !== 'student') throw failure('Only students can enroll.', 403);
        if (course.status !== 'published') throw failure('Course unavailable.', 404);
        if (q('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', user.user_id, id))
          throw failure('Already enrolled.', 409);
        const enrollment_id = crypto.randomUUID(),
          enrolled_at = new Date().toISOString();
        run(
          'INSERT INTO enrollments VALUES (?,?,?,?)',
          enrollment_id,
          user.user_id,
          id,
          enrolled_at,
        );
        return json(201, { enrollment_id, course_id: id, enrolled_at });
      }
      if (action === 'save' && ['PUT', 'DELETE'].includes(method)) {
        if (user.role !== 'student') throw failure('Only students can save courses.', 403);
        if (method === 'PUT')
          run('INSERT OR IGNORE INTO saved_courses VALUES (?,?)', user.user_id, id);
        else run('DELETE FROM saved_courses WHERE user_id=? AND course_id=?', user.user_id, id);
        return json(200, { saved: method === 'PUT' });
      }
      if (action === 'lessons' && method === 'POST') {
        const input = await readJson(req);
        const lesson_id = crypto.randomUUID();
        const position = q(
          'SELECT COALESCE(MAX(position),0)+1 AS n FROM lessons WHERE course_id=?',
          id,
        ).n;
        run(
          'INSERT INTO lessons (lesson_id,course_id,title,content,position) VALUES (?,?,?,?,?)',
          lesson_id,
          id,
          text(input.title, 160),
          text(input.content || '', 30000, true),
          position,
        );
        return json(201, { lesson: q('SELECT * FROM lessons WHERE lesson_id=?', lesson_id) });
      }
      if (action === 'assignments' && method === 'GET') {
        const rows = all('SELECT * FROM assignments WHERE course_id=?', id).map((a) => ({
          ...a,
          submission:
            user.role === 'student'
              ? q(
                  'SELECT * FROM submissions WHERE assignment_id=? AND user_id=?',
                  a.assignment_id,
                  user.user_id,
                ) || null
              : null,
        }));
        return json(200, { assignments: rows });
      }
      if (action === 'assignments' && method === 'POST') {
        const input = await readJson(req),
          assignment_id = crypto.randomUUID();
        run(
          'INSERT INTO assignments VALUES (?,?,?,?,?)',
          assignment_id,
          id,
          text(input.title, 160),
          text(input.instructions, 12000),
          date(input.due_at),
        );
        return json(201, { assignment_id });
      }
      if (action === 'students' && method === 'GET')
        return json(200, {
          students: all(
            `SELECT u.user_id,u.first_name,u.last_name,e.enrolled_at,(SELECT COUNT(*) FROM lessons l WHERE l.course_id=e.course_id AND l.archived=0) AS lesson_count,(SELECT COUNT(*) FROM progress p JOIN lessons l ON l.lesson_id=p.lesson_id WHERE p.user_id=u.user_id AND p.completed=1 AND l.course_id=e.course_id AND l.archived=0) AS completed_count FROM enrollments e JOIN users u ON u.user_id=e.user_id WHERE e.course_id=? ORDER BY e.enrolled_at DESC`,
            id,
          ),
        });
      if (action === 'questions' && method === 'GET')
        return json(200, {
          questions: all(
            `SELECT q.*,u.first_name || ' ' || u.last_name AS author FROM questions q JOIN users u ON u.user_id=q.user_id WHERE q.course_id=? ORDER BY created_at DESC`,
            id,
          ),
        });
      if (action === 'questions' && method === 'POST') {
        if (user.role !== 'student')
          throw failure('Only enrolled students can ask questions.', 403);
        const input = await readJson(req);
        run(
          'INSERT INTO questions VALUES (?,?,?,?,?,?)',
          crypto.randomUUID(),
          id,
          user.user_id,
          text(input.body, 3000),
          '',
          new Date().toISOString(),
        );
        return json(201, { ok: true });
      }
    }
    match = route.match(/^\/api\/lessons\/([^/]+)(?:\/(progress|note|video))?$/);
    if (match) {
      const id = match[1],
        action = match[2];
      const lesson = lessonAccess(
        user,
        id,
        method === 'PATCH' || method === 'DELETE' || action === 'video',
      );
      if (!action && method === 'GET') {
        const expires = Math.floor(Date.now() / 1000) + 43200;
        const video_url = lesson.video_file
          ? `/api/media/${id}?user=${user.user_id}&expires=${expires}&signature=${sign(`media:${id}:${user.user_id}:${expires}`)}`
          : null;
        return json(200, {
          lesson: {
            lesson_id: id,
            course_id: lesson.course_id,
            title: lesson.title,
            content: lesson.content,
            position: lesson.position,
            video_url,
          },
          progress: q(
            'SELECT * FROM progress WHERE user_id=? AND lesson_id=?',
            user.user_id,
            id,
          ) || { completed: 0, position: 0 },
          note:
            q('SELECT body FROM notes WHERE user_id=? AND lesson_id=?', user.user_id, id)?.body ||
            '',
        });
      }
      if (!action && method === 'PATCH') {
        const input = await readJson(req);
        const title = 'title' in input ? text(input.title, 160) : lesson.title;
        const content = 'content' in input ? text(input.content, 30000, true) : lesson.content;
        const position = 'position' in input ? input.position : lesson.position;
        if (!Number.isInteger(position) || position < 1 || position > 10000)
          throw failure('Lesson position must be 1–10,000.');
        run(
          'UPDATE lessons SET title=?,content=?,position=? WHERE lesson_id=?',
          title,
          content,
          position,
          id,
        );
        return json(200, { ok: true });
      }
      if (!action && method === 'DELETE') {
        if (courseAccess(user, lesson.course_id, true).status !== 'draft')
          throw failure('Unpublish the course before archiving a lesson.');
        run('UPDATE lessons SET archived=1 WHERE lesson_id=?', id);
        return json(200, { ok: true });
      }
      if (action === 'progress' && method === 'PUT') {
        if (user.role !== 'student') throw failure('Only students track learning progress.', 403);
        const input = await readJson(req);
        const existing = q(
          'SELECT * FROM progress WHERE user_id=? AND lesson_id=?',
          user.user_id,
          id,
        );
        if ('completed' in input && typeof input.completed !== 'boolean')
          throw failure('Completion must be true or false.');
        const completed = 'completed' in input ? Number(input.completed) : existing?.completed || 0;
        const position = 'position' in input ? input.position : existing?.position || 0;
        if (!Number.isFinite(position) || position < 0 || position > 604800)
          throw failure('Invalid playback position.');
        run(
          'INSERT INTO progress VALUES (?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed=excluded.completed,position=excluded.position,updated_at=excluded.updated_at',
          user.user_id,
          id,
          completed,
          position,
          new Date().toISOString(),
        );
        return json(200, { ok: true });
      }
      if (action === 'note' && method === 'PUT') {
        const input = await readJson(req);
        run(
          'INSERT INTO notes VALUES (?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET body=excluded.body,updated_at=excluded.updated_at',
          user.user_id,
          id,
          text(input.body, 12000, true),
          new Date().toISOString(),
        );
        return json(200, { ok: true });
      }
      if (action === 'video' && method === 'PUT') {
        const type = req.headers['content-type'];
        if (!['video/mp4', 'video/webm'].includes(type))
          throw failure('Upload an MP4 or WebM video.', 415);
        if (Number(req.headers['content-length']) > 100 * 1024 * 1024)
          throw failure('Video limit is 100 MB.', 413);
        const filename = crypto.randomUUID() + (type === 'video/mp4' ? '.mp4' : '.webm'),
          target = path.join(videoDir, filename),
          temp = target + '.part';
        let handle;
        let size = 0,
          first = Buffer.alloc(0);
        try {
          handle = await fs.promises.open(temp, 'wx');
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 100 * 1024 * 1024) throw failure('Video limit is 100 MB.', 413);
            if (first.length < 32)
              first = Buffer.concat([first, chunk.subarray(0, 32 - first.length)]);
            await handle.writeFile(chunk);
          }
          await handle.close();
          handle = null;
          if (
            size < 12 ||
            (type === 'video/mp4'
              ? first.subarray(4, 8).toString() !== 'ftyp'
              : first.subarray(0, 4).toString('hex') !== '1a45dfa3')
          )
            throw failure('This file is not a supported video.');
          await fs.promises.rename(temp, target);
          run('UPDATE lessons SET video_file=? WHERE lesson_id=?', filename, id);
          if (lesson.video_file)
            await fs.promises
              .unlink(path.join(videoDir, path.basename(lesson.video_file)))
              .catch(() => {});
        } catch (error) {
          if (handle) await handle.close();
          await fs.promises.unlink(temp).catch(() => {});
          throw error;
        }
        return json(200, { ok: true });
      }
    }
    match = route.match(/^\/api\/assignments\/([^/]+)(?:\/(submit|submissions))?$/);
    if (match) {
      const assignment = q('SELECT * FROM assignments WHERE assignment_id=?', match[1]);
      if (!assignment) throw failure('Assignment not found.', 404);
      courseAccess(user, assignment.course_id, match[2] === 'submissions' || method === 'PATCH');
      if (match[2] === 'submit' && method === 'PUT') {
        if (user.role !== 'student') throw failure('Only students submit assignments.', 403);
        if (assignment.due_at && Date.parse(assignment.due_at) < Date.now())
          throw failure('The deadline has passed.');
        const existing = q(
          'SELECT * FROM submissions WHERE assignment_id=? AND user_id=?',
          assignment.assignment_id,
          user.user_id,
        );
        if (existing?.score !== null && existing?.score !== undefined)
          throw failure('This submission has already been graded.');
        const input = await readJson(req);
        run(
          'INSERT INTO submissions VALUES (?,?,?,?,?,?,?) ON CONFLICT(assignment_id,user_id) DO UPDATE SET body=excluded.body,submitted_at=excluded.submitted_at',
          crypto.randomUUID(),
          assignment.assignment_id,
          user.user_id,
          text(input.body, 20000),
          new Date().toISOString(),
          null,
          '',
        );
        return json(200, { ok: true });
      }
      if (match[2] === 'submissions' && method === 'GET')
        return json(200, {
          submissions: all(
            `SELECT s.*,u.first_name || ' ' || u.last_name AS student_name FROM submissions s JOIN users u ON u.user_id=s.user_id WHERE assignment_id=? ORDER BY submitted_at DESC`,
            assignment.assignment_id,
          ),
        });
      if (!match[2] && method === 'PATCH') {
        const input = await readJson(req);
        run(
          'UPDATE assignments SET title=?,instructions=?,due_at=? WHERE assignment_id=?',
          text(input.title, 160),
          text(input.instructions, 12000),
          date(input.due_at),
          assignment.assignment_id,
        );
        return json(200, { ok: true });
      }
    }
    match = route.match(/^\/api\/submissions\/([^/]+)$/);
    if (match && method === 'PATCH') {
      const submission = q(
        'SELECT s.*,a.course_id FROM submissions s JOIN assignments a ON a.assignment_id=s.assignment_id WHERE submission_id=?',
        match[1],
      );
      if (!submission) throw failure('Submission not found.', 404);
      courseAccess(user, submission.course_id, true);
      const input = await readJson(req);
      if (!Number.isInteger(input.score) || input.score < 0 || input.score > 100)
        throw failure('Score must be 0–100.');
      run(
        'UPDATE submissions SET score=?,feedback=? WHERE submission_id=?',
        input.score,
        text(input.feedback || '', 5000, true),
        match[1],
      );
      return json(200, { ok: true });
    }
    match = route.match(/^\/api\/questions\/([^/]+)$/);
    if (match && method === 'PATCH') {
      const question = q('SELECT * FROM questions WHERE question_id=?', match[1]);
      if (!question) throw failure('Question not found.', 404);
      courseAccess(user, question.course_id, true);
      const input = await readJson(req);
      run('UPDATE questions SET answer=? WHERE question_id=?', text(input.answer, 6000), match[1]);
      return json(200, { ok: true });
    }
    if (route === '/api/promotions' && method === 'GET') {
      if (user.role !== 'student') throw failure('Student offers only.', 403);
      const now = new Date().toISOString();
      return json(200, {
        promotions: all(
          `SELECT p.*,c.title AS course_title FROM promotions p LEFT JOIN courses c ON c.course_id=p.course_id WHERE enabled=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>?) AND (p.course_id IS NULL OR c.status='published') ORDER BY created_at DESC`,
          now,
          now,
        ),
      });
    }
    if (route.startsWith('/api/admin/')) {
      if (user.role !== 'admin') throw failure('Administrator access required.', 403);
      if (route === '/api/admin/users' && method === 'GET')
        return json(200, {
          users: all(
            `SELECT u.user_id,u.first_name,u.last_name,u.email,u.disabled,u.created_at,CASE WHEN a.user_id IS NOT NULL THEN 'admin' ELSE u.role END AS role FROM users u LEFT JOIN admin_users a ON a.user_id=u.user_id ORDER BY created_at DESC`,
          ),
        });
      match = route.match(/^\/api\/admin\/users\/([^/]+)$/);
      if (match && method === 'PATCH') {
        const input = await readJson(req);
        if (typeof input.disabled !== 'boolean')
          throw failure('Choose an enabled or disabled state.');
        if (match[1] === user.user_id) throw failure('You cannot disable your own account.');
        if (!q('SELECT 1 FROM users WHERE user_id=?', match[1]))
          throw failure('Account not found.', 404);
        if (q('SELECT 1 FROM admin_users WHERE user_id=?', match[1]))
          throw failure('Admin access is managed locally.');
        run(
          'UPDATE users SET disabled=?,auth_version=auth_version+1 WHERE user_id=?',
          Number(input.disabled),
          match[1],
        );
        return json(200, { ok: true });
      }
      if (route === '/api/admin/promotions' && method === 'GET')
        return json(200, {
          promotions: all(
            'SELECT p.*,c.title AS course_title FROM promotions p LEFT JOIN courses c ON c.course_id=p.course_id ORDER BY created_at DESC',
          ),
        });
      match = route.match(/^\/api\/admin\/promotions(?:\/([^/]+))?$/);
      if (match && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const id = match[1];
        if (method === 'POST' && id) throw failure('Invalid route.', 404);
        const existing = id ? q('SELECT * FROM promotions WHERE promotion_id=?', id) : null;
        if (id && !existing) throw failure('Offer not found.', 404);
        const input = await readJson(req);
        if (method === 'PATCH') {
          if (!id || typeof input.enabled !== 'boolean') throw failure('Choose an active state.');
          run('UPDATE promotions SET enabled=? WHERE promotion_id=?', Number(input.enabled), id);
          return json(200, { ok: true });
        }
        if (method === 'PUT' && !id) throw failure('Choose an offer.');
        const title = text(input.title, 100),
          body = text(input.body || '', 240, true),
          percent = input.discount_percent;
        if (
          !Number.isInteger(percent) ||
          percent < 0 ||
          percent > 90 ||
          typeof input.enabled !== 'boolean'
        )
          throw failure('Discount must be 0–90%, with a valid active state.');
        const course_id = input.course_id || null;
        if (course_id && !q('SELECT 1 FROM courses WHERE course_id=?', course_id))
          throw failure('Choose an existing course.');
        const starts = date(input.starts_at),
          ends = date(input.ends_at);
        if (starts && ends && starts >= ends) throw failure('End date must follow start date.');
        const promotion_id = id || crypto.randomUUID();
        if (id)
          run(
            'UPDATE promotions SET title=?,body=?,discount_percent=?,course_id=?,enabled=?,starts_at=?,ends_at=? WHERE promotion_id=?',
            title,
            body,
            percent,
            course_id,
            Number(input.enabled),
            starts,
            ends,
            id,
          );
        else
          run(
            'INSERT INTO promotions VALUES (?,?,?,?,?,?,?,?,?)',
            promotion_id,
            title,
            body,
            percent,
            course_id,
            Number(input.enabled),
            starts,
            ends,
            new Date().toISOString(),
          );
        return json(id ? 200 : 201, { promotion_id });
      }
    }
    return false;
  };
}
module.exports = { initSchema, createPlatform, CATEGORIES };
