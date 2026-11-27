# SkillStream

A learning platform prototype for technical courses with student, teacher and administrator workspaces. This repository contains the source and local-development documentation; private runtime data remains excluded.

## Run locally

Use Node.js 22.5 or later. No package installation is needed.

```powershell
npm start
```

Open http://localhost:3000. Register a student or teacher account. To create an administrator:

```powershell
npm run admin
```

The admin email defaults to `admin@skillstream.local`. Its generated password is saved privately in `data/admin-access.txt`; no password is committed to Git. Re-running setup preserves the existing account. Name/password settings are available after login.

## What works

- Students: technical catalog, enrollment, saved courses, lesson text/video, saved playback position, completion progress, private notes, written assignments and grades, course questions/replies, and rotating offers.
- Teachers: course/lesson editing, publication, MP4/WebM uploads (100 MB), assignment deadlines, submission review and grading, replies and student progress.
- Admins: course moderation, account enable/disable, and scheduled/paused percentage offers or announcements.
- All accounts: persisted data, profile/password updates, access controls and session revocation.

The interface uses the same restrained visual identity on desktop and mobile. Course activity and progress are derived from stored records. The current local demo includes three clearly labelled technical courses, nine lessons, three assignment prompts and an original 56-second code video. It does not seed fake learner progress, scores or reviews.

## Graduation demo

On a fresh clone, generate the demo video before seeding courses. Follow [the installation guide](docs/installation.md) for the complete command order. Credentials for its separate teacher/student accounts are in ignored `data/demo-access.txt`. Admin credentials remain in `data/admin-access.txt`.

`npm run demo` restores missing demonstration records without resetting existing edits, progress or passwords. To regenerate the video, use `python scripts/create-demo-media.py` (Pillow and FFmpeg are authoring tools only; running the platform itself does not require them).

The workspace uses an authenticated live stream for grades, replies, enrollment, course changes and offer schedules. Unsaved fields and active video playback are preserved when background updates arrive. The header shows Live or Reconnecting.

See the [presentation walkthrough](docs/graduation-demo.md) and [local development report](docs/local-development-report.md). The university assignment submission is a separate PDF deliverable.

## Week 5 report material

The current requirement status, separate Stage 2 and Stage 3 records, evidence limits, and prioritized follow-up are in [Week 5 progress](docs/weekly-progress/week05.md). A report-ready implementation and architecture update is in [the Week 5 report section](docs/project-report-week5.md). The Week 3 proposal and the current local architecture comparison are in [the architecture record](docs/design/architecture-diagram.md). Stages 2 and 3 map to the existing 2 November platform commit `88e9c6e`; the record does not imply those features were newly written on the report update date.

## Verification

```powershell
npm run verify:week4
npm run verify:courses
npm run verify:platform
npm run verify:realtime
npm run verify:demo
npm run verify:week5
```

The full platform check uses an isolated temporary database and real HTTP, including permission failures, media transport, coursework, promotions, and persistence. See [local verification](evidence/local-platform-verification.md).

`npm run verify:week5` reruns the existing verification suites and saves their command output in `evidence/week-05/verification.md` for the weekly record. It verifies API and persistence behavior; it does not perform interactive browser acceptance.

With the local app and demo accounts running, `npm run measure:catalog` records 30 warm authenticated localhost catalog API timings after five warm-up requests. It reports API response time only; it does not measure browser rendering or certify the full-page two-second requirement. Results are saved to `evidence/week-04/catalog-performance.json`.

## Storage and limits

SQLite, local uploads, signing key and initial admin credentials live inside ignored `data/`. Offers are informational: checkout and payments are not implemented, and enrollment is free. Assignment answers are text submissions. Email verification/reset delivery, cloud storage/transcoding, certificates, deployment and the planned PostgreSQL/React/Express migration remain future work. This is a local application and still needs manual browser/video playback review and production hardening.

## Documentation

- [Current local platform guide](docs/local-platform.md) — roles, demo steps, technical limits and remaining work.
- [Historical Week 4 development record](docs/weekly-progress/week04.md) — initial authentication prototype at its referenced commit.
- [Project report](docs/project-report.md) — original requirements and initial Week 4 implementation.
- [Week 3 architecture](docs/design/architecture-decisions.md) and [diagram](docs/design/architecture-diagram.md).

The older submission reports describe their original scope; the full local extension has not been submitted as Week 4 evidence.

## Week 7 reproducibility

Follow [installation and configuration](docs/installation.md). Recorded clean-clone outcomes are in [Week 7 progress](docs/weekly-progress/week07.md).

