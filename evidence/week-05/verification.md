# Week 5 verification run

Run date: 2026-11-12T13:58:12.905Z
Node.js: v22.23.2
Scope: rerun of the existing isolated authentication, course, platform, realtime, and demo verification scripts.

These commands exercise request handlers over local HTTP or isolated handlers as implemented by each script. They are not a full interactive browser acceptance test.

## verify:week4: PASS

```text
{
  "runtime": "v22.23.2",
  "database": "SQLite :memory:",
  "results": [
    {
      "id": "P01",
      "check": "Register valid student",
      "status": 201,
      "pass": true
    },
    {
      "id": "P02",
      "check": "Login with registered password",
      "status": 200,
      "pass": true
    },
    {
      "id": "P03",
      "check": "Read protected profile with JWT",
      "status": 200,
      "pass": true
    },
    {
      "id": "P04",
      "check": "Reject duplicate email",
      "status": 409,
      "pass": true
    },
    {
      "id": "P05",
      "check": "Reject short password",
      "status": 400,
      "pass": true
    },
    {
      "id": "P06",
      "check": "Reject incorrect password",
      "status": 401,
      "pass": true
    },
    {
      "id": "P07",
      "check": "Reject protected request without JWT",
      "status": 401,
      "pass": true
    }
  ],
  "databaseRecordCount": 1,
  "storedPasswordIsHash": true
}
(node:19512) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

## verify:courses: PASS

```text
PASS: real HTTP registration, course creation, validation, draft visibility, owner permissions, publishing, enrollment, duplicate prevention, student library, real student count, and unpublishing.
(node:15812) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

## verify:platform: PASS

```text
PASS: 90 real HTTP checks; roles, technical categories, lessons, private notes, progress, saved courses, protected media/ranges, assignments/grading/deadlines, Q&A, offers/schedules, account updates, session revocation, and moderation.
PASS: records survive closing and reopening the SQLite database.
(node:3268) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

## verify:realtime: PASS

```text
PASS: authenticated live streams, course/enrollment/progress updates, recipient isolation, private-note hints, origin IDs, automatic offer expiry, password renewal, and account revocation.
(node:22844) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

## verify:demo: PASS

```text
PASS: idempotent demo setup; real video HTTP download and FFmpeg decode; student enrollment, playback/completion/notes, assignment submission, teacher grading, reply, and progress.
(node:23280) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

## Interpretation

- Authentication: seven cases, including valid registration/login, duplicate registration, short password, wrong password and unauthorized profile access.
- Courses: real HTTP checks for validation, ownership, publishing, enrollment and duplicate prevention.
- Platform: role and learning workflows, invalid values, protected media/ranges and database persistence after reopening.
- Realtime: authenticated event delivery, recipient filtering and session/offer behavior.
- Demo: authored WebM download and FFmpeg decode plus student/teacher coursework workflow.
- These results do not verify browser rendering, native browser playback or the full-page two-second catalog target.
