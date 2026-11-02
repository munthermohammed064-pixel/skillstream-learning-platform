const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, hashPassword } = require('../src/server');
try {
  const email = (process.argv[2] || 'admin@skillstream.local').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
  const existing = db.prepare('SELECT user_id FROM users WHERE email=?').get(email);
  if (existing) {
    if (!db.prepare('SELECT 1 FROM admin_users WHERE user_id=?').get(existing.user_id))
      throw new Error('Email already belongs to a regular account. Choose another email.');
    console.log('Admin already exists. The existing password is unchanged.');
  } else {
    const id = crypto.randomUUID(),
      password = 'Ss9!' + crypto.randomBytes(10).toString('base64url');
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(
        'INSERT INTO users (user_id,email,password_hash,role,first_name,last_name,created_at) VALUES (?,?,?,?,?,?,?)',
      ).run(
        id,
        email,
        hashPassword(password),
        'teacher',
        'Platform',
        'Admin',
        new Date().toISOString(),
      );
      db.prepare('INSERT INTO admin_users VALUES (?)').run(id);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    const accessPath = path.resolve(
      process.env.SKILLSTREAM_DATA_DIR || path.join(__dirname, '../data'),
      'admin-access.txt',
    );
    fs.writeFileSync(
      accessPath,
      `SkillStream local administrator\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. You can change the password in Account.\n`,
    );
    console.log(`Local admin created. Credentials saved privately in ${accessPath}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
