const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'skillstream-check-'));
process.env.SKILLSTREAM_DATA_DIR = temp;
process.env.SKILLSTREAM_DB_PATH = path.join(temp, 'test.sqlite');
process.env.JWT_SECRET = 'isolated-platform-test-key';
const { db, handleRequest } = require('../src/server');
const server = http.createServer(handleRequest);
let checks = 0,
  courseId;
async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(route, method = 'GET', body, token, status = 200) {
    const response = await fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    assert.equal(response.status, status, `${method} ${route}: ${JSON.stringify(result)}`);
    checks++;
    return result;
  }
  const signup = (name, role) =>
    call(
      '/api/auth/register',
      'POST',
      {
        first_name: name,
        last_name: 'Test',
        email: `${name}@example.test`,
        role,
        password: 'StudyPass2026',
      },
      undefined,
      201,
    );
  const teacher = await signup('teacher', 'teacher'),
    other = await signup('other', 'teacher'),
    student = await signup('student', 'student'),
    second = await signup('second', 'student'),
    admin = await signup('admin', 'teacher');
  db.prepare('INSERT INTO admin_users VALUES (?)').run(admin.user.user_id);
  assert.equal((await call('/api/me', 'GET', undefined, admin.token)).user.role, 'admin');
  await call(
    '/api/auth/register',
    'POST',
    {
      first_name: 'Unsafe',
      last_name: 'Role',
      email: 'unsafe@example.test',
      role: 'admin',
      password: 'StudyPass2026',
    },
    undefined,
    400,
  );
  assert.ok((await call('/api/categories')).categories.includes('Software Engineering'));
  const payload = {
    title: 'Algorithms',
    description: 'Technical course description.',
    category: 'Software Engineering',
  };
  await call('/api/courses', 'POST', { ...payload, category: 'Cooking' }, teacher.token, 400);
  const course = (await call('/api/courses', 'POST', payload, teacher.token, 201)).course;
  courseId = course.course_id;
  const coursePath = `/api/courses/${courseId}`;
  const lesson = (
    await call(
      `${coursePath}/lessons`,
      'POST',
      { title: 'Lesson one', content: 'شرح تقني محفوظ كما هو' },
      teacher.token,
      201,
    )
  ).lesson;
  const lesson2 = (
    await call(
      `${coursePath}/lessons`,
      'POST',
      { title: 'Lesson two', content: 'More material' },
      teacher.token,
      201,
    )
  ).lesson;
  const lessonPath = `/api/lessons/${lesson.lesson_id}`;
  await call(lessonPath, 'GET', undefined, undefined, 401);
  await call(lessonPath, 'GET', undefined, student.token, 403);
  await call(lessonPath, 'PATCH', { title: 'Stolen change' }, other.token, 403);
  await call(`${coursePath}/lessons`, 'POST', { title: 'Bad access' }, student.token, 403);
  await call(coursePath, 'PATCH', { status: 'published' }, teacher.token);
  const preview = await call(coursePath, 'GET', undefined, student.token);
  assert.equal(preview.can_learn, false);
  assert.equal(preview.lessons.length, 2);
  await call(`${coursePath}/enroll`, 'POST', undefined, student.token, 201);
  await call(`${coursePath}/enroll`, 'POST', undefined, second.token, 201);
  assert.equal(
    (await call(lessonPath, 'GET', undefined, student.token)).lesson.content,
    'شرح تقني محفوظ كما هو',
  );
  await call(`${lessonPath}/progress`, 'PUT', { completed: true, position: 25 }, student.token);
  await call(`${lessonPath}/progress`, 'PUT', { position: -2 }, student.token, 400);
  await call(`${lessonPath}/progress`, 'PUT', { completed: 'true' }, student.token, 400);
  await call(`${lessonPath}/progress`, 'PUT', { completed: true }, teacher.token, 403);
  assert.equal(
    (await call('/api/enrollments', 'GET', undefined, student.token)).courses[0].progress_percent,
    50,
  );
  assert.equal(
    (await call(`${coursePath}/students`, 'GET', undefined, teacher.token)).students.find(
      (row) => row.user_id === student.user.user_id,
    ).completed_count,
    1,
  );
  await call(`${coursePath}/students`, 'GET', undefined, student.token, 403);
  await call(`${lessonPath}/note`, 'PUT', { body: 'Private note' }, student.token);
  assert.equal((await call(lessonPath, 'GET', undefined, student.token)).note, 'Private note');
  assert.equal((await call(lessonPath, 'GET', undefined, second.token)).note, '');
  assert.equal((await call(lessonPath, 'GET', undefined, teacher.token)).note, '');
  await call(`${coursePath}/save`, 'PUT', undefined, student.token);
  assert.equal((await call('/api/saved', 'GET', undefined, student.token)).courses.length, 1);
  await call(`${coursePath}/save`, 'DELETE', undefined, student.token);
  assert.equal((await call('/api/saved', 'GET', undefined, student.token)).courses.length, 0);
  const video = Buffer.concat([
    Buffer.from([0, 0, 0, 24]),
    Buffer.from('ftypisom'),
    Buffer.alloc(40),
  ]);
  const upload = await fetch(base + lessonPath + '/video', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${teacher.token}`, 'Content-Type': 'video/mp4' },
    body: video,
  });
  assert.equal(upload.status, 200);
  checks++;
  const videoURL = (await call(lessonPath, 'GET', undefined, student.token)).lesson.video_url;
  const range = await fetch(base + videoURL, { headers: { Range: 'bytes=4-11' } });
  assert.equal(range.status, 206);
  assert.equal(Buffer.from(await range.arrayBuffer()).toString(), 'ftypisom');
  checks++;
  const invalidRange = await fetch(base + videoURL, { headers: { Range: 'bytes=999-1000' } });
  assert.equal(invalidRange.status, 416);
  await invalidRange.text();
  checks++;
  await call(
    videoURL.replace(/signature=[^&]+/, 'signature=invalid'),
    'GET',
    undefined,
    undefined,
    401,
  );
  const assignmentId = (
    await call(
      `${coursePath}/assignments`,
      'POST',
      { title: 'Build a function', instructions: 'Submit your reasoning.' },
      teacher.token,
      201,
    )
  ).assignment_id;
  await call(
    `/api/assignments/${assignmentId}/submit`,
    'PUT',
    { body: 'My answer' },
    student.token,
  );
  await call(`/api/assignments/${assignmentId}/submissions`, 'GET', undefined, student.token, 403);
  await call(`/api/assignments/${assignmentId}/submissions`, 'GET', undefined, other.token, 403);
  const submission = (
    await call(`/api/assignments/${assignmentId}/submissions`, 'GET', undefined, teacher.token)
  ).submissions[0];
  await call(
    `/api/submissions/${submission.submission_id}`,
    'PATCH',
    { score: 105 },
    teacher.token,
    400,
  );
  await call(
    `/api/submissions/${submission.submission_id}`,
    'PATCH',
    { score: 92, feedback: 'Clear reasoning.' },
    teacher.token,
  );
  await call(
    `/api/assignments/${assignmentId}/submit`,
    'PUT',
    { body: 'Changed after grading' },
    student.token,
    400,
  );
  const assignments = await call(`${coursePath}/assignments`, 'GET', undefined, student.token);
  assert.equal(assignments.assignments[0].submission.score, 92);
  assert.equal(
    (await call(`${coursePath}/assignments`, 'GET', undefined, second.token)).assignments[0]
      .submission,
    null,
  );
  const pastId = (
    await call(
      `${coursePath}/assignments`,
      'POST',
      { title: 'Past deadline', instructions: 'Expired fixture', due_at: '2000-01-01T00:00:00Z' },
      teacher.token,
      201,
    )
  ).assignment_id;
  await call(
    `/api/assignments/${pastId}/submit`,
    'PUT',
    { body: 'Late answer' },
    student.token,
    400,
  );
  await call(
    `${coursePath}/questions`,
    'POST',
    { body: 'Can you explain this step?' },
    student.token,
    201,
  );
  const question = (await call(`${coursePath}/questions`, 'GET', undefined, teacher.token))
    .questions[0];
  await call(
    `/api/questions/${question.question_id}`,
    'PATCH',
    { answer: 'Unauthorized' },
    other.token,
    403,
  );
  await call(
    `/api/questions/${question.question_id}`,
    'PATCH',
    { answer: 'Here is the explanation.' },
    teacher.token,
  );
  assert.equal(
    (await call(`${coursePath}/questions`, 'GET', undefined, student.token)).questions[0].answer,
    'Here is the explanation.',
  );
  await call('/api/admin/promotions', 'GET', undefined, student.token, 403);
  await call('/api/admin/users', 'GET', undefined, teacher.token, 403);
  const offer = {
    title: 'Technical offer',
    body: 'A local announcement.',
    discount_percent: 20,
    course_id: courseId,
    enabled: true,
  };
  await call('/api/admin/promotions', 'POST', offer, student.token, 403);
  await call(
    '/api/admin/promotions',
    'POST',
    { ...offer, discount_percent: 120 },
    admin.token,
    400,
  );
  await call(
    '/api/admin/promotions',
    'POST',
    { ...offer, starts_at: '2030-01-02', ends_at: '2030-01-01' },
    admin.token,
    400,
  );
  const promotion = (await call('/api/admin/promotions', 'POST', offer, admin.token, 201))
    .promotion_id;
  await call(
    '/api/admin/promotions',
    'POST',
    { ...offer, title: 'Scheduled', starts_at: '2099-01-01' },
    admin.token,
    201,
  );
  await call(
    '/api/admin/promotions',
    'POST',
    { ...offer, title: 'Expired', ends_at: '2000-01-01' },
    admin.token,
    201,
  );
  assert.equal(
    (await call('/api/promotions', 'GET', undefined, student.token)).promotions.length,
    1,
  );
  await call(
    `/api/admin/promotions/${promotion}`,
    'PUT',
    { ...offer, title: 'Updated offer' },
    admin.token,
  );
  assert.equal(
    (await call('/api/promotions', 'GET', undefined, student.token)).promotions[0].title,
    'Updated offer',
  );
  await call(`/api/admin/promotions/${promotion}`, 'PATCH', { enabled: false }, admin.token);
  assert.equal(
    (await call('/api/promotions', 'GET', undefined, student.token)).promotions.length,
    0,
  );
  await call(`/api/admin/promotions/${promotion}`, 'PATCH', { enabled: true }, admin.token);
  await call(
    '/api/me',
    'PATCH',
    { first_name: 'Updated', last_name: 'Learner', role: 'admin' },
    student.token,
  );
  assert.equal((await call('/api/me', 'GET', undefined, student.token)).user.role, 'student');
  const changed = await call(
    '/api/me/password',
    'PUT',
    { current_password: 'StudyPass2026', password: 'NewPass2026!' },
    student.token,
  );
  await call('/api/me', 'GET', undefined, student.token, 401);
  student.token = changed.token;
  await call('/api/me', 'GET', undefined, student.token);
  await call(
    `/api/admin/users/${admin.user.user_id}`,
    'PATCH',
    { disabled: true },
    admin.token,
    400,
  );
  await call(`/api/admin/users/${second.user.user_id}`, 'PATCH', { disabled: true }, admin.token);
  await call('/api/me', 'GET', undefined, second.token, 401);
  await call(
    '/api/auth/login',
    'POST',
    { email: 'second@example.test', password: 'StudyPass2026' },
    undefined,
    403,
  );
  await call(`/api/admin/users/${second.user.user_id}`, 'PATCH', { disabled: false }, admin.token);
  await call('/api/me', 'GET', undefined, second.token, 401);
  await call(lessonPath, 'DELETE', undefined, teacher.token, 400);
  await call(coursePath, 'PATCH', { status: 'draft' }, teacher.token);
  assert.equal(
    (await call('/api/promotions', 'GET', undefined, student.token)).promotions.length,
    0,
  );
  await call(lessonPath, 'DELETE', undefined, teacher.token);
  await call(lessonPath, 'GET', undefined, student.token, 404);
  assert.equal(
    (await call('/api/enrollments', 'GET', undefined, student.token)).courses[0].lesson_count,
    1,
  );
  await call(`/api/lessons/${lesson2.lesson_id}`, 'PATCH', { position: 0 }, teacher.token, 400);
  console.log(
    `PASS: ${checks} real HTTP checks; roles, technical categories, lessons, private notes, progress, saved courses, protected media/ranges, assignments/grading/deadlines, Q&A, offers/schedules, account updates, session revocation, and moderation.`,
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    server.closeAllConnections();
    server.close(() => {
      db.close();
      try {
        if (!process.exitCode) {
          const { DatabaseSync } = require('node:sqlite');
          const persisted = new DatabaseSync(process.env.SKILLSTREAM_DB_PATH);
          assert.ok(persisted.prepare('SELECT * FROM courses WHERE course_id=?').get(courseId));
          persisted.close();
          console.log('PASS: records survive closing and reopening the SQLite database.');
        }
      } catch (error) {
        console.error(error);
        process.exitCode = 1;
      }
      fs.rmSync(temp, { recursive: true, force: true });
    });
  });
