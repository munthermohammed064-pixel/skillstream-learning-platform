const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { initSchema, createPlatform } = require('./platform');
const { createRealtime } = require('./realtime');
const ROOT = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.SKILLSTREAM_DATA_DIR || path.join(ROOT, 'data'));
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(
  process.env.SKILLSTREAM_DB_PATH || path.join(dataDir, 'skillstream.sqlite'),
);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (user_id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE UNIQUE,
password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('student','teacher')),
first_name TEXT NOT NULL, last_name TEXT NOT NULL, created_at TEXT NOT NULL);`);
const columns = db
  .prepare('PRAGMA table_info(users)')
  .all()
  .map((row) => row.name);
if (!columns.includes('disabled'))
  db.exec('ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0');
if (!columns.includes('auth_version'))
  db.exec('ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0');
initSchema(db);
const userSelect = `SELECT u.*, CASE WHEN EXISTS(SELECT 1 FROM admin_users a WHERE a.user_id=u.user_id) THEN 'admin' ELSE u.role END AS role FROM users u`;
const byId = db.prepare(userSelect + ' WHERE u.user_id=?');
const byEmail = db.prepare(userSelect + ' WHERE u.email=? COLLATE NOCASE');
let secret = process.env.JWT_SECRET;
if (!secret) {
  const keyPath = path.join(dataDir, 'session.key');
  if (!fs.existsSync(keyPath))
    fs.writeFileSync(keyPath, crypto.randomBytes(48).toString('hex'), { flag: 'wx' });
  secret = fs.readFileSync(keyPath, 'utf8').trim();
}
function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}
function failure(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw failure('Request is too large.', 413);
    chunks.push(buffer);
  }
  const data = Buffer.concat(chunks).toString('utf8');
  try {
    const result = JSON.parse(data || '{}');
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result;
  } catch {
    throw failure('Send a valid JSON object.');
  }
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex')}`;
}
function verifyPassword(password, hash) {
  const [algorithm, salt, value] = hash.split('$');
  if (algorithm !== 'scrypt') return false;
  const expected = Buffer.from(value, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(salt, 'hex'), expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
function publicUser(user) {
  const { user_id, email, role, first_name, last_name, created_at } = user;
  return { user_id, email, role, first_name, last_name, created_at };
}
function sign(value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}
function createToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.user_id,
      role: user.role,
      ver: user.auth_version || 0,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url');
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}
function getUser(req) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /i, '').split('.');
    if (token.length !== 3) return null;
    const expected = Buffer.from(sign(`${token[0]}.${token[1]}`));
    const actual = Buffer.from(token[2]);
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
    const claims = JSON.parse(Buffer.from(token[1], 'base64url').toString());
    if (!Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    const user = byId.get(claims.sub);
    return user && !user.disabled && user.auth_version === (claims.ver || 0) ? user : null;
  } catch {
    return null;
  }
}
const platform = createPlatform({ db, readJson, sendJson, getUser, sign, dataDir, failure });
const realtime = createRealtime({ db, getUser });
const attempts = new Map();
async function handleApi(req, res, url) {
  const route = url.pathname;
  if (route === '/api/events' && req.method === 'GET') {
    if (!realtime.attach(req, res)) sendJson(res, 401, { error: 'Please sign in to continue.' });
    return;
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const actor = getUser(req);
    res.once?.('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) realtime.changed(req, url, actor);
    });
  }
  if (req.method === 'POST' && ['/api/auth/register', '/api/auth/login'].includes(route)) {
    const input = await readJson(req);
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || password.length > 128)
      return sendJson(res, 400, { error: 'Enter a valid email and password.' });
    if (route.endsWith('/register')) {
      const first_name = typeof input.first_name === 'string' ? input.first_name.trim() : '';
      const last_name = typeof input.last_name === 'string' ? input.last_name.trim() : '';
      if (
        !first_name ||
        !last_name ||
        first_name.length > 100 ||
        last_name.length > 100 ||
        password.length < 8 ||
        !['teacher', 'student'].includes(input.role)
      )
        return sendJson(res, 400, {
          error: 'Enter your name, a password of 8–128 characters, and a student or teacher role.',
        });
      if (byEmail.get(email))
        return sendJson(res, 409, { error: 'An account with this email already exists.' });
      const id = crypto.randomUUID();
      db.prepare(
        'INSERT INTO users (user_id,email,password_hash,role,first_name,last_name,created_at) VALUES (?,?,?,?,?,?,?)',
      ).run(
        id,
        email,
        hashPassword(password),
        input.role,
        first_name,
        last_name,
        new Date().toISOString(),
      );
      const user = byId.get(id);
      return sendJson(res, 201, { user: publicUser(user), token: createToken(user) });
    }
    const key = `${req.socket?.remoteAddress || 'local'}:${email}`;
    const now = Date.now();
    if (attempts.size > 2000) for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    const record = attempts.get(key);
    if (record && record.until > now && record.count >= 10)
      return sendJson(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const user = byEmail.get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      attempts.set(key, {
        count: record && record.until > now ? record.count + 1 : 1,
        until: record && record.until > now ? record.until : now + 900000,
      });
      return sendJson(res, 401, { error: 'Email or password is incorrect.' });
    }
    if (user.disabled)
      return sendJson(res, 403, { error: 'This account is disabled. Contact the administrator.' });
    attempts.delete(key);
    return sendJson(res, 200, { user: publicUser(user), token: createToken(user) });
  }
  if (route === '/api/me') {
    const user = getUser(req);
    if (!user) return sendJson(res, 401, { error: 'Please sign in to continue.' });
    if (req.method === 'GET') return sendJson(res, 200, { user: publicUser(user) });
    if (req.method === 'PATCH') {
      const input = await readJson(req);
      const first = typeof input.first_name === 'string' ? input.first_name.trim() : '';
      const last = typeof input.last_name === 'string' ? input.last_name.trim() : '';
      if (!first || !last || first.length > 100 || last.length > 100)
        throw failure('Enter your first and last name (up to 100 characters each).');
      db.prepare('UPDATE users SET first_name=?, last_name=? WHERE user_id=?').run(
        first,
        last,
        user.user_id,
      );
      return sendJson(res, 200, { user: publicUser(byId.get(user.user_id)) });
    }
  }
  if (route === '/api/me/password' && req.method === 'PUT') {
    const user = getUser(req);
    if (!user) return sendJson(res, 401, { error: 'Please sign in.' });
    const input = await readJson(req);
    if (
      typeof input.current_password !== 'string' ||
      input.current_password.length > 128 ||
      !verifyPassword(input.current_password, user.password_hash)
    )
      throw failure('Current password is incorrect.');
    if (
      typeof input.password !== 'string' ||
      input.password.length < 8 ||
      input.password.length > 128
    )
      throw failure('New password must contain 8–128 characters.');
    db.prepare('UPDATE users SET password_hash=?, auth_version=auth_version+1 WHERE user_id=?').run(
      hashPassword(input.password),
      user.user_id,
    );
    return sendJson(res, 200, { token: createToken(byId.get(user.user_id)) });
  }
  if (await platform(req, res, url)) return;
  sendJson(res, 404, { error: 'API route not found.' });
}
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD')
      return sendJson(res, 405, { error: 'Method not allowed.' });
    const target = path.resolve(
      ROOT,
      'public' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)),
    );
    if (!target.startsWith(path.join(ROOT, 'public') + path.sep))
      return sendJson(res, 400, { error: 'Invalid path.' });
    const contents = await fs.promises.readFile(target);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    sendJson(res, error.statusCode || (error.code === 'ENOENT' ? 404 : 500), {
      error: error.statusCode
        ? error.message
        : error.code === 'ENOENT'
          ? 'Not found.'
          : 'Unexpected server error.',
    });
    if (!error.statusCode && error.code !== 'ENOENT') console.error(error);
  }
}
if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () =>
    console.log(`SkillStream ready at http://localhost:${process.env.PORT || 3000}`),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
      realtime.close();
      server.close(() => {
        db.close();
        process.exit(0);
      });
      server.closeAllConnections();
    });
}
module.exports = { db, handleApi, handleRequest, hashPassword };
