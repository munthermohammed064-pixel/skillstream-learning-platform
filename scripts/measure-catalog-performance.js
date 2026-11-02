const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const baseUrl = process.env.SKILLSTREAM_BASE_URL || 'http://127.0.0.1:3000';
const accountFile = path.join(root, 'data', 'demo-access.txt');
const outputFile = path.join(root, 'evidence', 'week-04', 'catalog-performance.json');
const warmupCount = 5;
const measuredCount = 30;

function readStudentCredentials() {
  const text = fs.readFileSync(accountFile, 'utf8');
  const block = text.split(/\n(?=[A-Z]+ DEMONSTRATION ACCOUNT)/)
    .find((section) => section.startsWith('STUDENT DEMONSTRATION ACCOUNT'));
  const email = block?.match(/^Email: (.+)$/m)?.[1];
  const password = block?.match(/^Password: (.+)$/m)?.[1];
  if (!email || !password) throw new Error('Student demo credentials are incomplete.');
  return { email, password };
}

async function main() {
  const { email, password } = readStudentCredentials();
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await login.json();
  if (!login.ok || !session.token) throw new Error(`Local student sign-in failed (HTTP ${login.status}).`);

  const durations = [];
  let courseCount = 0;
  for (let i = 0; i < warmupCount + measuredCount; i += 1) {
    const start = process.hrtime.bigint();
    const response = await fetch(`${baseUrl}/api/courses`, {
      headers: { authorization: `Bearer ${session.token}` },
    });
    const payload = await response.json();
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (!response.ok || !Array.isArray(payload.courses)) {
      throw new Error(`Catalog request failed (HTTP ${response.status}).`);
    }
    if (i >= warmupCount) {
      durations.push(elapsedMs);
      courseCount = payload.courses.length;
    }
  }

  durations.sort((a, b) => a - b);
  const percentile = (p) => durations[Math.ceil(p * durations.length) - 1];
  const result = {
    measuredAtUtc: new Date().toISOString(),
    nodeVersion: process.version,
    environment: 'localhost loopback, authenticated student, warm server and SQLite process',
    endpoint: 'GET /api/courses',
    warmupRequests: warmupCount,
    measuredRequests: measuredCount,
    courseCount,
    p50Ms: Number(percentile(0.5).toFixed(2)),
    p95Ms: Number(percentile(0.95).toFixed(2)),
    maxMs: Number(durations.at(-1).toFixed(2)),
    limitation: 'API response including JSON parsing only; excludes browser rendering, static resources, and normal network conditions. Does not verify the full-page two-second NFR-01 target.',
  };

  fs.writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
