const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const TOKEN_TTL_SECONDS = 60 * 60;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using a temporary development key; tokens stop working after restart.');
}

const dataDir = path.join(ROOT, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const databasePath = process.env.SKILLSTREAM_DB_PATH || path.join(dataDir, 'skillstream.sqlite');
const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const insertUser = db.prepare(`
  INSERT INTO users (user_id, email, password_hash, role, first_name, last_name, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const findUserByEmail = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
const findUserById = db.prepare('SELECT user_id, email, role, first_name, last_name, created_at FROM users WHERE user_id = ?');

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body) > 16 * 1024) {
        reject(Object.assign(new Error('Request body is too large'), { statusCode: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, keyHex] = String(storedHash).split('$');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: user.user_id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

function authenticate(req) {
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split('.');
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(unsigned).digest();
  let actual;
  try {
    actual = Buffer.from(parts[2], 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!claims.sub || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

function publicUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    created_at: user.created_at,
  };
}

async function handleApi(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    const input = await readJson(req);
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const role = input.role;
    const firstName = typeof input.first_name === 'string' ? input.first_name.trim() : '';
    const lastName = typeof input.last_name === 'string' ? input.last_name.trim() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return sendJson(res, 400, { error: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 128) {
      return sendJson(res, 400, { error: 'Password must be between 8 and 128 characters.' });
    }
    if (!['teacher', 'student'].includes(role)) {
      return sendJson(res, 400, { error: 'Choose student or teacher. Admin accounts are provisioned separately.' });
    }
    if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100) {
      return sendJson(res, 400, { error: 'First and last name are required (100 characters maximum).' });
    }
    if (findUserByEmail.get(email)) {
      return sendJson(res, 409, { error: 'An account with this email already exists.' });
    }

    const user = {
      user_id: crypto.randomUUID(),
      email,
      role,
      first_name: firstName,
      last_name: lastName,
      created_at: new Date().toISOString(),
    };
    try {
      insertUser.run(user.user_id, email, hashPassword(password), role, firstName, lastName, user.created_at);
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) {
        return sendJson(res, 409, { error: 'An account with this email already exists.' });
      }
      throw error;
    }
    return sendJson(res, 201, { user: publicUser(user), token: createToken(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const input = await readJson(req);
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const user = findUserByEmail.get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return sendJson(res, 401, { error: 'Email or password is incorrect.' });
    }
    return sendJson(res, 200, { user: publicUser(user), token: createToken(user) });
  }

  if (req.method === 'GET' && url.pathname === '/api/me') {
    const claims = authenticate(req);
    if (!claims) return sendJson(res, 401, { error: 'A valid Bearer token is required.' });
    const user = findUserById.get(claims.sub);
    if (!user) return sendJson(res, 401, { error: 'Account no longer exists.' });
    return sendJson(res, 200, { user: publicUser(user) });
  }

  return sendJson(res, 404, { error: 'API route not found.' });
}

const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    const relativePath = url.pathname === '/' ? 'public/index.html' : `public${url.pathname}`;
    const targetPath = path.resolve(ROOT, relativePath);
    if (!targetPath.startsWith(path.join(ROOT, 'public') + path.sep)) {
      return sendJson(res, 400, { error: 'Invalid path.' });
    }
    const contents = await fs.promises.readFile(targetPath);
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(targetPath)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(contents);
  } catch (error) {
    if (error.statusCode) return sendJson(res, error.statusCode, { error: error.message });
    if (error.code === 'ENOENT') return sendJson(res, 404, { error: 'Page not found.' });
    console.error(error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Unexpected server error.' });
  }
}

if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => console.log(`SkillStream prototype ready at http://localhost:${PORT}`));
  function shutdown() {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { db, handleApi, handleRequest };
