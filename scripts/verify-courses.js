const assert = require('node:assert/strict');
const http = require('node:http');
process.env.SKILLSTREAM_DB_PATH = ':memory:';
process.env.JWT_SECRET = 'isolated-course-verification-key';
const { db, handleRequest } = require('../src/server');
const server = http.createServer(handleRequest);

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(path, method = 'GET', body, token, expected = 200) {
    const response = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
    return result;
  }
  async function register(email, role) {
    return call('/api/auth/register', 'POST', { first_name: 'Test', last_name: role, email, role, password: 'TestPass2026' }, undefined, 201);
  }
  const teacher = await register('teacher@example.test', 'teacher');
  const other = await register('other@example.test', 'teacher');
  const student = await register('student@example.test', 'student');
  const draft = { title: 'Software Design', category: 'Engineering', description: 'Design a clear system.' };
  await call('/api/courses', 'GET', undefined, undefined, 401);
  await call('/api/courses', 'POST', draft, student.token, 403);
  await call('/api/courses', 'POST', { ...draft, title: '' }, teacher.token, 400);
  await call('/api/courses', 'POST', null, teacher.token, 400);
  const { course } = await call('/api/courses', 'POST', draft, teacher.token, 201);
  assert.equal(course.status, 'draft');
  assert.equal((await call('/api/courses', 'GET', undefined, teacher.token)).courses.length, 1);
  assert.equal((await call('/api/courses', 'GET', undefined, other.token)).courses.length, 0);
  assert.equal((await call('/api/courses', 'GET', undefined, student.token)).courses.length, 0);
  await call(`/api/courses/${course.course_id}/enroll`, 'POST', undefined, student.token, 404);
  await call(`/api/courses/${course.course_id}`, 'PATCH', { status: 'published' }, other.token, 403);
  await call(`/api/courses/${course.course_id}`, 'PATCH', { status: 'published' }, student.token, 403);
  await call(`/api/courses/${course.course_id}`, 'PATCH', { status: 'published' }, teacher.token);
  assert.equal((await call('/api/courses', 'GET', undefined, student.token)).courses.length, 1);
  await call(`/api/courses/${course.course_id}/enroll`, 'POST', undefined, teacher.token, 403);
  await call(`/api/courses/${course.course_id}/enroll`, 'POST', undefined, student.token, 201);
  await call(`/api/courses/${course.course_id}/enroll`, 'POST', undefined, student.token, 409);
  const library = await call('/api/enrollments', 'GET', undefined, student.token);
  assert.equal(library.courses[0].course_id, course.course_id);
  assert.equal((await call('/api/courses', 'GET', undefined, teacher.token)).courses[0].student_count, 1);
  await call(`/api/courses/${course.course_id}`, 'PATCH', { status: 'draft' }, teacher.token);
  assert.equal((await call('/api/courses', 'GET', undefined, student.token)).courses.length, 0);
  assert.equal((await call('/api/enrollments', 'GET', undefined, student.token)).courses.length, 1);
  console.log('PASS: real HTTP registration, course creation, validation, draft visibility, owner permissions, publishing, enrollment, duplicate prevention, student library, real student count, and unpublishing.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  server.closeAllConnections();
  server.close(() => db.close());
});
