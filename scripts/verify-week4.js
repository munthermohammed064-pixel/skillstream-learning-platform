const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');

process.env.SKILLSTREAM_DB_PATH = ':memory:';
process.env.JWT_SECRET = 'week4-local-verification-key';
const { handleApi, db } = require('../src/server');

function callApi(method, pathname, body, token) {
  const req = new PassThrough();
  req.method = method;
  req.headers = token ? { authorization: `Bearer ${token}` } : {};
  const response = { statusCode: 0, headers: {}, body: '' };
  response.writeHead = (statusCode, headers) => {
    response.statusCode = statusCode;
    response.headers = headers;
  };
  response.end = value => { response.body = value || ''; };
  const request = handleApi(req, response, new URL(pathname, 'http://localhost'));
  if (body !== undefined) req.end(JSON.stringify(body));
  else req.end();
  return request.then(() => ({ ...response, json: response.body ? JSON.parse(response.body) : null }));
}

async function main() {
  const email = 'week4.student@example.test';
  const password = 'StudyPass2026';

  const registration = await callApi('POST', '/api/auth/register', {
    first_name: 'Sara', last_name: 'Ahmed', email, password, role: 'student',
  });
  assert.equal(registration.statusCode, 201);
  assert.equal(registration.json.user.role, 'student');
  assert.ok(registration.json.token);
  assert.ok(!JSON.stringify(registration.json).includes('password_hash'));

  const login = await callApi('POST', '/api/auth/login', { email, password });
  assert.equal(login.statusCode, 200);
  assert.equal(login.json.user.user_id, registration.json.user.user_id);

  const profile = await callApi('GET', '/api/me', undefined, registration.json.token);
  assert.equal(profile.statusCode, 200);
  assert.equal(profile.json.user.email, email);

  const duplicate = await callApi('POST', '/api/auth/register', {
    first_name: 'Sara', last_name: 'Ahmed', email, password, role: 'student',
  });
  assert.equal(duplicate.statusCode, 409);

  const weakPassword = await callApi('POST', '/api/auth/register', {
    first_name: 'Weak', last_name: 'Password', email: 'weak@example.test', password: 'short', role: 'student',
  });
  assert.equal(weakPassword.statusCode, 400);

  const wrongPassword = await callApi('POST', '/api/auth/login', { email, password: 'incorrect-password' });
  assert.equal(wrongPassword.statusCode, 401);

  const missingToken = await callApi('GET', '/api/me');
  assert.equal(missingToken.statusCode, 401);

  const rows = db.prepare('SELECT user_id, email, password_hash, role FROM users').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, email);
  assert.equal(rows[0].role, 'student');
  assert.notEqual(rows[0].password_hash, password);
  assert.ok(rows[0].password_hash.startsWith('scrypt$'));

  console.log(JSON.stringify({
    runtime: process.version,
    database: 'SQLite :memory:',
    results: [
      { id: 'P01', check: 'Register valid student', status: registration.statusCode, pass: true },
      { id: 'P02', check: 'Login with registered password', status: login.statusCode, pass: true },
      { id: 'P03', check: 'Read protected profile with JWT', status: profile.statusCode, pass: true },
      { id: 'P04', check: 'Reject duplicate email', status: duplicate.statusCode, pass: true },
      { id: 'P05', check: 'Reject short password', status: weakPassword.statusCode, pass: true },
      { id: 'P06', check: 'Reject incorrect password', status: wrongPassword.statusCode, pass: true },
      { id: 'P07', check: 'Reject protected request without JWT', status: missingToken.statusCode, pass: true },
    ],
    databaseRecordCount: rows.length,
    storedPasswordIsHash: true,
  }, null, 2));
}

main().then(() => db.close()).catch(error => {
  console.error(error);
  db.close();
  process.exitCode = 1;
});
