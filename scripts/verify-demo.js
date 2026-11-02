const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourceVideo = path.join(root, 'data/demo-media/javascript-functions.webm');
if (!fs.existsSync(sourceVideo)) throw new Error('Generate demo media first.');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'skillstream-demo-'));
process.env.SKILLSTREAM_DATA_DIR = temp;
process.env.SKILLSTREAM_DB_PATH = path.join(temp, 'demo.sqlite');
process.env.JWT_SECRET = 'isolated-demo-workflow-key';
fs.mkdirSync(path.join(temp, 'demo-media'));
fs.copyFileSync(sourceVideo, path.join(temp, 'demo-media/javascript-functions.webm'));
execFileSync(process.execPath, [path.join(__dirname, 'seed-demo.js')], {
  env: process.env,
  stdio: 'pipe',
});
execFileSync(process.execPath, [path.join(__dirname, 'seed-demo.js')], {
  env: process.env,
  stdio: 'pipe',
});
const { db, handleRequest } = require('../src/server');
const server = http.createServer(handleRequest);

async function main() {
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM courses').get().n, 3);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM lessons').get().n, 9);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM enrollments').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM submissions').get().n, 0);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const credentials = fs.readFileSync(path.join(temp, 'demo-access.txt'), 'utf8');
  async function call(route, method, body, token, status = 200) {
    const response = await fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify(result));
    return result;
  }
  async function login(role) {
    const block = credentials.match(
      new RegExp(`${role} DEMONSTRATION ACCOUNT\\nEmail: ([^\\n]+)\\nPassword: ([^\\n]+)`),
    );
    assert.ok(block, 'Missing demonstration credentials');
    return call('/api/auth/login', 'POST', { email: block[1], password: block[2] });
  }
  const teacher = await login('TEACHER');
  const student = await login('STUDENT');
  const course = '/api/courses/demo-course-javascript';
  await call(course + '/enroll', 'POST', undefined, student.token, 201);
  const lesson = '/api/lessons/demo-course-javascript-lesson-1';
  const data = await call(lesson, 'GET', undefined, student.token);
  assert.ok(data.lesson.content.includes('```'));
  const response = await fetch(base + data.lesson.video_url);
  assert.equal(response.status, 200);
  const video = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(video, fs.readFileSync(sourceVideo));
  const downloaded = path.join(temp, 'downloaded.webm');
  fs.writeFileSync(downloaded, video);
  execFileSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-i', downloaded, '-f', 'null', '-'],
    { stdio: 'pipe' },
  );
  await call(lesson + '/progress', 'PUT', { completed: true, position: 18 }, student.token);
  await call(
    lesson + '/note',
    'PUT',
    { body: 'return provides a result to the caller.' },
    student.token,
  );
  const saved = await call(lesson, 'GET', undefined, student.token);
  assert.equal(saved.progress.position, 18);
  assert.equal(saved.progress.completed, 1);
  assert.match(saved.note, /return/);
  await call(
    '/api/assignments/demo-course-javascript-assignment/submit',
    'PUT',
    {
      body: 'function orderTotal(items) { return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0); }\nI would add validation and test empty arrays and invalid quantities.',
    },
    student.token,
  );
  const submissions = await call(
    '/api/assignments/demo-course-javascript-assignment/submissions',
    'GET',
    undefined,
    teacher.token,
  );
  await call(
    `/api/submissions/${submissions.submissions[0].submission_id}`,
    'PATCH',
    {
      score: 78,
      feedback:
        'The main calculation works. Implement the validation described in your explanation.',
    },
    teacher.token,
  );
  const assignments = await call(course + '/assignments', 'GET', undefined, student.token);
  assert.equal(assignments.assignments[0].submission.score, 78);
  await call(course + '/questions', 'POST', { body: 'Why use integer cents?' }, student.token, 201);
  const questions = await call(course + '/questions', 'GET', undefined, teacher.token);
  await call(
    `/api/questions/${questions.questions[0].question_id}`,
    'PATCH',
    {
      answer: 'They avoid binary decimal rounding during addition within the safe-integer range.',
    },
    teacher.token,
  );
  assert.match(
    (await call(course + '/questions', 'GET', undefined, student.token)).questions[0].answer,
    /rounding/,
  );
  assert.equal(
    (await call('/api/enrollments', 'GET', undefined, student.token)).courses[0].progress_percent,
    33,
  );
  console.log(
    'PASS: idempotent demo setup; real video HTTP download and FFmpeg decode; student enrollment, playback/completion/notes, assignment submission, teacher grading, reply, and progress.',
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
      fs.rmSync(temp, { recursive: true, force: true });
    });
  });
