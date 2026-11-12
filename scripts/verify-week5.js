const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const evidencePath = path.join(root, 'evidence', 'week-05', 'verification.md');
const suites = [
  ['verify:week4', 'scripts/verify-week4.js'],
  ['verify:courses', 'scripts/verify-courses.js'],
  ['verify:platform', 'scripts/verify-platform.js'],
  ['verify:realtime', 'scripts/verify-realtime.js'],
  ['verify:demo', 'scripts/verify-demo.js'],
];

function main() {
  const sections = [
    '# Week 5 verification run',
    '',
    `Run date: ${new Date().toISOString()}`,
    `Node.js: ${process.version}`,
    'Scope: rerun of the existing isolated authentication, course, platform, realtime, and demo verification scripts.',
    '',
    'These commands exercise request handlers over local HTTP or isolated handlers as implemented by each script. They are not a full interactive browser acceptance test.',
    '',
  ];
  let failed = false;

  for (const [command, script] of suites) {
    const result = spawnSync(process.execPath, [path.join(root, script)], {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    });
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    const passed = result.status === 0;
    failed ||= !passed;
    sections.push(`## ${command}: ${passed ? 'PASS' : 'FAIL'}`, '', '```text', output || '(no output)', '```', '');
  }

  sections.push(
    '## Interpretation',
    '',
    '- Authentication: seven cases, including valid registration/login, duplicate registration, short password, wrong password and unauthorized profile access.',
    '- Courses: real HTTP checks for validation, ownership, publishing, enrollment and duplicate prevention.',
    '- Platform: role and learning workflows, invalid values, protected media/ranges and database persistence after reopening.',
    '- Realtime: authenticated event delivery, recipient filtering and session/offer behavior.',
    '- Demo: authored WebM download and FFmpeg decode plus student/teacher coursework workflow.',
    '- These results do not verify browser rendering, native browser playback or the full-page two-second catalog target.',
    '',
  );

  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, sections.join('\n'), 'utf8');
  process.stdout.write(sections.join('\n'));
  if (failed) process.exitCode = 1;
}

main();
