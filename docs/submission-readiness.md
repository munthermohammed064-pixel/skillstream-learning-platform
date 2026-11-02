# Week 4 submission preparation

Revision: 2 November 2026. University submission and deployment have not been performed.

## Verified locally

- `npm run verify:week4`: all seven authentication cases pass; one account record and a salted password hash confirmed.
- `npm run verify:courses`: real HTTP registration, publishing, ownership, enrollment and duplicate prevention pass.
- `npm run verify:platform`: 90 HTTP checks pass; records persist after reopening SQLite.
- `npm run verify:realtime`: authenticated streams, recipient isolation, offer expiry and session revocation pass.
- `npm run verify:demo`: idempotent setup, protected video download and FFmpeg decoding, enrollment, progress, notes, submission, grading and reply pass.

## Performance evidence and limit

On 2 November 2026, 30 measured warm localhost requests to authenticated `GET /api/courses` returned the three-course demo catalog with p50 15.47 ms, p95 16.88 ms and maximum 17.48 ms. This is an API-only loopback measurement. It excludes browser rendering, static files and normal network conditions; it does not establish the full-page two-second NFR-01. The method and output are saved in `evidence/week-04/catalog-performance.md` and `catalog-performance.json`; repeat it with `npm run measure:catalog` while the app is running.

## Review report

Local review copy: `output/pdf/SkillStream_Week4_Combined_Review.pdf` (21 pages). It combines the Week 4 assignment and cumulative project report, numbered figures and tables, four student-supplied interface screenshots, technical verification output and references. Appendices contain the architecture, role workflows, data relationships, authentication sequence, and a requirement-to-evidence map. The copy still needs transfer into the official university template.

## Browser evidence

The student supplied four captures showing the student workspace/profile and teacher course/account screens. Interactive browser acceptance by the agent, native browser video playback, enrolled lesson progress, teacher assignment grading and admin offers are not claimed. Capture any of these only if an authentic browser demonstration is available; do not present API tests as browser evidence.

## Repository record

The platform source is pushed to `docs/week3-architecture` in commit `88e9c6e` at [the project repository](https://github.com/munthermohammed064-pixel/skillstream-learning-platform). The existing branch name predates the Week 4 update. GitHub Issue [#4](https://github.com/munthermohammed064-pixel/skillstream-learning-platform/issues/4) records the Week 4 prototype scope; it was created retrospectively on 2 November 2026, after implementation. The combined report PDF and report output folder were not added to or pushed to GitHub.

## Remaining before final university submission

- Transfer the prepared report material into the official university template and preserve its headings and required front matter.
- Confirm the student identity fields against the official template.
- If the instructor expects browser-level evidence, capture authentic course, lesson, teacher-grading and admin screens and add accurate captions.
- Measure the complete catalog page under the stated normal-network condition if claiming the two-second NFR-01.
- Upload the final combined PDF to the university assignment portal and confirm its receipt/status.
