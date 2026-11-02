const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, hashPassword } = require('../src/server');
const root = path.resolve(__dirname, '..'),
  dataDir = path.resolve(process.env.SKILLSTREAM_DATA_DIR || path.join(root, 'data'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content/demo-courses.json'), 'utf8'));
const accountFile = path.join(dataDir, 'demo-access.txt');
function demoUser(email, role, first, last) {
  const existing = db.prepare('SELECT user_id FROM users WHERE email=?').get(email);
  if (existing) return existing.user_id;
  const id = crypto.randomUUID(),
    password = 'Demo9!' + crypto.randomBytes(8).toString('base64url');
  db.prepare(
    'INSERT INTO users (user_id,email,password_hash,role,first_name,last_name,created_at) VALUES (?,?,?,?,?,?,?)',
  ).run(id, email, hashPassword(password), role, first, last, new Date().toISOString());
  fs.appendFileSync(
    accountFile,
    `\n${role.toUpperCase()} DEMONSTRATION ACCOUNT\nEmail: ${email}\nPassword: ${password}\n`,
  );
  return id;
}
try {
  const videoSource = path.join(dataDir, 'demo-media/javascript-functions.webm');
  if (!fs.existsSync(videoSource))
    throw new Error('First generate the demo video: python scripts/create-demo-media.py');
  const teacher = demoUser('teacher.demo@skillstream.local', 'teacher', 'Demo', 'Instructor');
  demoUser('student.demo@skillstream.local', 'student', 'Demo', 'Learner');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const course of catalog) {
      const id = `demo-course-${course.key}`;
      const existing = db.prepare('SELECT teacher_id FROM courses WHERE course_id=?').get(id);
      if (existing && existing.teacher_id !== teacher)
        throw new Error('Demo course ID is already owned by another account.');
      db.prepare('INSERT OR IGNORE INTO courses VALUES (?,?,?,?,?,?,?)').run(
        id,
        teacher,
        course.title,
        course.description,
        course.category,
        'published',
        new Date().toISOString(),
      );
      course.lessons.forEach((lesson, index) =>
        db
          .prepare(
            'INSERT OR IGNORE INTO lessons (lesson_id,course_id,title,content,position) VALUES (?,?,?,?,?)',
          )
          .run(`${id}-lesson-${index + 1}`, id, lesson.title, lesson.content, index + 1),
      );
      db.prepare('INSERT OR IGNORE INTO assignments VALUES (?,?,?,?,?)').run(
        `${id}-assignment`,
        id,
        course.assignment.title,
        course.assignment.instructions,
        null,
      );
    }
    db.prepare('INSERT OR IGNORE INTO promotions VALUES (?,?,?,?,?,?,?,?,?)').run(
      'demo-offer-javascript',
      'A practical place to start',
      'Start the JavaScript demonstration course: video, notes, a project, and teacher feedback.',
      0,
      'demo-course-javascript',
      1,
      null,
      null,
      new Date().toISOString(),
    );
    db.prepare('INSERT OR IGNORE INTO promotions VALUES (?,?,?,?,?,?,?,?,?)').run(
      'demo-offer-sql',
      'Graduation demonstration offer',
      'Example discount announcement for the project demo. Enrollment remains free; no payment is collected.',
      25,
      'demo-course-sql',
      1,
      null,
      null,
      new Date().toISOString(),
    );
    const lesson = db
      .prepare('SELECT video_file FROM lessons WHERE lesson_id=?')
      .get('demo-course-javascript-lesson-1');
    if (!lesson.video_file) {
      const filename = 'demo-javascript-functions.webm';
      fs.copyFileSync(videoSource, path.join(dataDir, 'videos', filename));
      db.prepare('UPDATE lessons SET video_file=? WHERE lesson_id=?').run(
        filename,
        'demo-course-javascript-lesson-1',
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  console.log(
    'Three labelled demo courses, nine written lessons, three assignments, two announcements, and one real video are ready.',
  );
  console.log(`Private demo credentials: ${accountFile}`);
  console.log(
    'Existing course edits, account passwords, enrollments, and progress were preserved.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
