# SkillStream local platform

The project report distinguishes the original Week 4 authentication acceptance scope from the later local platform extension. The repository source documents the current implementation; the university report remains a separate deliverable to be aligned with the official template.

## Start and accounts

Use Node.js 22.5 or later, then `npm start` and open http://localhost:3000. No npm dependencies are required. Register student/teacher accounts through the interface. `npm run admin` creates the local administrator (default email: admin@skillstream.local) and saves a generated password in `data/admin-access.txt`. Running it again does not replace that password. An optional email can be passed as `npm run admin -- another@example.com` for a new administrator account.

Account settings allow name/password changes. Password changes end the account's other sessions. Admin accounts cannot be self-registered. Administrator status is assigned through a separate privileged local database record, preserving existing student/teacher account storage without rebuilding the users table.

SQLite, the session-signing key, local videos, and admin credentials are inside ignored `data/`. The development server binds to 127.0.0.1. An environment JWT_SECRET can override the persisted local signing key. Treat local data as private; back up the whole data directory with the application stopped.

## Implemented features

### Student

- Technical-course search/category filters, preview curriculum, enrollment, saved courses and personal course library.
- Lesson text and uploaded MP4/WebM video player. Playback position saves approximately every ten seconds and when paused.
- Explicit mark-complete / mark-incomplete controls, real per-course completion, and next-lesson navigation.
- Private per-lesson notes, persisted separately for each user.
- Written assignment submissions, editable until graded or the deadline passes; scores and teacher feedback.
- Course questions and teacher replies.
- Administrator-managed promotional announcements. Cards rotate every seven seconds, with previous/next and pause controls. Rotation pauses for pointer hover, keyboard focus, hidden tabs, and reduced-motion preferences. Offer mutations and scheduled start/end boundaries are pushed over the authenticated live channel. A 30-second refresh remains as a fallback; expired and paused offers are filtered server-side.

### Teacher

- Create technical courses, edit metadata, publish/unpublish, and see enrollment counts.
- Create/edit/order lessons and upload MP4/WebM files up to 100 MB per lesson. Replacing a video removes the old local file after the new one saves.
- Archive a lesson after unpublishing its course. Archived lessons retain their old data but no longer count toward completion.
- Add/edit assignments and deadlines, review written submissions, assign scores from 0 to 100, and leave feedback.
- Answer course questions; inspect enrolled students and lesson-completion counts.

### Administrator

- Course moderation, including course metadata, lesson content, publication and assignments.
- Account listing/search and enable/disable controls. Disabling ends sessions. Admins cannot disable themselves or modify other admin privileges through the web UI.
- Create/edit/pause announcements and percentage offers (0 for news, 1–90 for a discount message), optionally linked to a course and scheduled with start/end dates.
- Offers are informational. No checkout, payment, or actual purchase-price calculation is implemented; enrollment remains free.

## Local demonstration

1. Sign in as a teacher, create a course using one of the technical categories, then select Manage course.
2. Add lesson text and optionally upload a real MP4/WebM. Add an assignment if needed, then return to the course library and publish.
3. Use a student account to enroll, open the course, complete a lesson, save notes, submit an assignment and ask a question.
4. Return as the teacher to review/grade the submission and answer the question.
5. Sign in as admin to moderate accounts/courses and create an active offer. Return as the student to see it in Explore courses. Multiple active offers rotate.

An optional, clearly labelled graduation demonstration now supplies three authored technical courses, nine lessons, three assignments, two example announcements and a real 56-second silent code video. `npm run demo` preserves existing edits and does not invent enrollments, scores or completion. Demo credentials stay in ignored `data/demo-access.txt`. The authored text is in `content/demo-courses.json`.

## Verification

- `npm run verify:week4`: original authentication handler checks.
- `npm run verify:courses`: HTTP course/enrollment/ownership checks.
- `npm run verify:platform`: isolated temporary SQLite database, 90 HTTP checks, protected media byte-range tests, and database reopen/persistence checks.
- `npm run verify:realtime`: authenticated streams, recipient filtering, grade/submission privacy, scheduled offer expiry, token renewal and account revocation.
- `npm run verify:demo`: idempotent setup, actual video download/FFmpeg decoding, and the student-to-teacher assignment/Q&A workflow.

The video test uses a synthetic MP4 header fixture to verify access/storage/range handling; it does not prove codec playback. A separate demonstration check downloads and decodes the actual encoded WebM with FFmpeg. Four student-supplied screenshots document rendered account and catalog screens. Agent-performed interactive browser review and native browser playback remain unverified. A 30-sample localhost API timing run measured `GET /api/courses` at p50 15.47 ms and p95 16.88 ms; it excludes page rendering and network conditions, so the complete two-second catalog target remains unverified. See `evidence/local-platform-verification.md` and `evidence/week-04/catalog-performance.md`.

## Remaining work before a public launch

This is a local application, not a completed production deployment. There is no payment processing, email verification/reset delivery, notification service, file attachments for assignment submissions, automatic video transcoding, cloud/CDN delivery, multi-server operation, or certificate generation. PostgreSQL/React/Express from the original architecture proposal are still not used. A production migration, security review, backups, operational monitoring, and accessibility/browser testing remain necessary.

Uploaded videos are local and checked for supported MIME/signature, not fully decoded or scanned. Signed local video URLs now last 12 hours; reopening a lesson renews the URL. The browser receives a clear recovery message if a link/file becomes unavailable. Future/expired promotional content is invalidated at its scheduled boundary, with periodic refresh as a fallback. Account suspension does not erase enrolled learners' previously stored coursework.

## Live updates

The browser uses an authenticated fetch stream to `/api/events`. Events contain invalidation hints rather than private answers or grades. The server filters recipients and re-checks the current account. The UI reloads through permission-checked APIs, reconnects after interruption, and preserves active video playback or unsaved input by offering an explicit Show updates action. Sender IDs suppress unnecessary refreshes in the tab that saved the change. A Live/Reconnecting status is visible in the workspace header.
