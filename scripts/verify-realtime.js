const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'skillstream-live-'));
process.env.SKILLSTREAM_DATA_DIR = temp;
process.env.SKILLSTREAM_DB_PATH = ':memory:';
process.env.JWT_SECRET = 'isolated-realtime-check-key';
const { db, handleRequest } = require('../src/server');
const server = http.createServer(handleRequest),
  streams = [];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(predicate, message) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 3000) throw new Error(message);
    await pause(10);
  }
}
async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(route, method = 'GET', body, token, origin = 'test-mutation', status = 200) {
    const response = await fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': origin,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify(result));
    return result;
  }
  const register = (name, role) =>
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
      'fixture',
      201,
    );
  const teacher = await register('teacher', 'teacher'),
    student = await register('student', 'student'),
    outsider = await register('outsider', 'student'),
    admin = await register('admin', 'teacher');
  db.prepare('INSERT INTO admin_users VALUES (?)').run(admin.user.user_id);
  async function connect(token, origin) {
    const controller = new AbortController();
    const response = await fetch(base + '/api/events', {
      headers: { Authorization: `Bearer ${token}`, 'X-Client-ID': origin },
      signal: controller.signal,
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    const stream = { controller, events: [], ended: false };
    streams.push(stream);
    stream.done = (async () => {
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          let end;
          while ((end = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const type = frame
              .split('\n')
              .find((line) => line.startsWith('event:'))
              ?.slice(6)
              .trim();
            const data = frame
              .split('\n')
              .find((line) => line.startsWith('data:'))
              ?.slice(5)
              .trim();
            if (type) stream.events.push({ type, data: data ? JSON.parse(data) : {} });
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) throw error;
      } finally {
        stream.ended = true;
        reader.releaseLock();
      }
    })();
    await until(
      () => stream.events.some((event) => event.type === 'ready'),
      'Missing stream ready event',
    );
    return stream;
  }
  const t = await connect(teacher.token, 'teacher-tab'),
    s = await connect(student.token, 'student-tab'),
    o = await connect(outsider.token, 'outsider-tab');
  await call('/api/events', 'GET', undefined, undefined, 'unauth', 401);
  const course = (
    await call(
      '/api/courses',
      'POST',
      { title: 'Realtime course', description: 'Fixture', category: 'Web Development' },
      teacher.token,
      'teacher-tab',
      201,
    )
  ).course;
  await call(`/api/courses/${course.course_id}`, 'PATCH', { status: 'published' }, teacher.token);
  await until(
    () => s.events.some((event) => event.data.topic === 'courses'),
    'Course publication not delivered',
  );
  await call(
    `/api/courses/${course.course_id}/enroll`,
    'POST',
    undefined,
    student.token,
    'student-tab',
    201,
  );
  await until(
    () => t.events.some((event) => event.data.topic === 'enrollments'),
    'Teacher enrollment event missing',
  );
  const lesson = (
    await call(
      `/api/courses/${course.course_id}/lessons`,
      'POST',
      { title: 'Live lesson', content: 'Lesson text' },
      teacher.token,
      'teacher-tab',
      201,
    )
  ).lesson;
  await until(
    () => s.events.some((event) => event.data.topic === 'lessons'),
    'Enrolled student lesson event missing',
  );
  assert.ok(
    !o.events.some((event) => event.data.topic === 'lessons'),
    'Private course event reached unrelated student',
  );
  await call(
    `/api/lessons/${lesson.lesson_id}/note`,
    'PUT',
    { body: 'PRIVATE NOTE' },
    student.token,
    'student-tab',
  );
  await until(
    () => s.events.some((event) => event.data.topic === 'notes'),
    'Own note event missing',
  );
  assert.ok(
    !t.events.some((event) => event.data.topic === 'notes'),
    'Private note event reached teacher',
  );
  const note = s.events.find((event) => event.data.topic === 'notes');
  assert.equal(note.data.origin, 'student-tab');
  assert.ok(!JSON.stringify(note).includes('PRIVATE NOTE'));
  await call(
    `/api/lessons/${lesson.lesson_id}/progress`,
    'PUT',
    { completed: true },
    student.token,
  );
  await until(
    () => t.events.some((event) => event.data.topic === 'progress'),
    'Teacher progress event missing',
  );
  const peer = await register('peer', 'student');
  await call(
    `/api/courses/${course.course_id}/enroll`,
    'POST',
    undefined,
    peer.token,
    'peer-tab',
    201,
  );
  const peerStream = await connect(peer.token, 'peer-tab');
  const assignment = await call(
    `/api/courses/${course.course_id}/assignments`,
    'POST',
    {
      title: 'Live assignment',
      instructions: 'Fixture',
    },
    teacher.token,
    'teacher-tab',
    201,
  );
  await until(
    () => peerStream.events.some((event) => event.data.topic === 'assignments'),
    'New assignment event missing',
  );
  const peerAssignmentEvents = peerStream.events.filter(
    (event) => event.data.topic === 'assignments',
  ).length;
  await call(
    `/api/assignments/${assignment.assignment_id}/submit`,
    'PUT',
    { body: 'Private answer' },
    student.token,
  );
  const submission = (
    await call(
      `/api/assignments/${assignment.assignment_id}/submissions`,
      'GET',
      undefined,
      teacher.token,
    )
  ).submissions[0];
  const previous = s.events.filter((event) => event.data.topic === 'assignments').length;
  await call(
    `/api/submissions/${submission.submission_id}`,
    'PATCH',
    { score: 88, feedback: 'Private feedback' },
    teacher.token,
  );
  await until(
    () => s.events.filter((event) => event.data.topic === 'assignments').length > previous,
    'Graded student did not receive an assignment update',
  );
  await pause(30);
  assert.equal(
    peerStream.events.filter((event) => event.data.topic === 'assignments').length,
    peerAssignmentEvents,
    'Another student received private submission/grade activity',
  );
  assert.ok(!JSON.stringify(s.events).includes('Private feedback'));
  const before = s.events.filter((event) => event.data.topic === 'promotions').length;
  await call(
    '/api/admin/promotions',
    'POST',
    {
      title: 'Timed offer',
      body: 'Fixture',
      discount_percent: 10,
      enabled: true,
      course_id: course.course_id,
      ends_at: new Date(Date.now() + 650).toISOString(),
    },
    admin.token,
    'admin-tab',
    201,
  );
  await until(
    () => s.events.filter((event) => event.data.topic === 'promotions').length > before,
    'Offer creation event missing',
  );
  await until(
    () => s.events.filter((event) => event.data.topic === 'promotions').length > before + 1,
    'Offer expiry boundary was not delivered',
  );
  assert.equal(
    (await call('/api/promotions', 'GET', undefined, student.token)).promotions.length,
    0,
  );
  const second = await connect(student.token, 'second-student-tab');
  const updated = await call(
    '/api/me/password',
    'PUT',
    { current_password: 'StudyPass2026', password: 'NewPass2026!' },
    student.token,
    'student-tab',
  );
  await until(() => s.ended && second.ended, 'Password change did not close old streams');
  assert.ok(
    !s.events.some((event) => event.type === 'session-ended'),
    'Originating password-change tab should renew rather than sign out',
  );
  assert.ok(
    second.events.some((event) => event.type === 'session-ended'),
    'Other session should be signed out',
  );
  const renewed = await connect(updated.token, 'renewed-tab');
  await call(`/api/admin/users/${student.user.user_id}`, 'PATCH', { disabled: true }, admin.token);
  await until(
    () => renewed.events.some((event) => event.type === 'session-ended'),
    'Disabled account stream was not revoked',
  );
  console.log(
    'PASS: authenticated live streams, course/enrollment/progress updates, recipient isolation, private-note hints, origin IDs, automatic offer expiry, password renewal, and account revocation.',
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    for (const stream of streams) stream.controller.abort();
    await Promise.allSettled(streams.map((stream) => stream.done));
    server.closeAllConnections();
    server.close(() => {
      db.close();
      fs.rmSync(temp, { recursive: true, force: true });
    });
  });
