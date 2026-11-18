# SkillStream graduation project demonstration

The Week 4 record describes the original prototype and the features added for this local demonstration.

## Setup

1. Run `npm start`, open http://localhost:3000 and refresh with Ctrl+Shift+R.
2. Use the administrator credentials in `data/admin-access.txt` and the teacher and student credentials in `data/demo-access.txt`. Git excludes both private files.
3. Open separate teacher and student tabs. Each tab keeps its own session.
4. The 56-second demonstration video uses text and code examples and plays without sound.

## Seven-minute walkthrough

1. Introduce the three roles, the technical course categories and the SkillStream logo. Open the JavaScript course and explain that its content and activity are demonstration data.
2. As the student, preview the course and enroll. Play the lesson, seek ahead, pause and reopen it to show the saved position. Save a private note, mark the lesson complete and show the updated completion count and percentage.
3. Open Assignments, read the instructions and submit a short answer. A fresh demonstration account starts without submissions or grades. For a repeat walkthrough after grading, create a new student account to preserve earlier work.
4. In the teacher tab, open Assignments and select Review submissions. Show the incoming submission, enter a grade and feedback, then switch to the student tab to show the result. When a form has unsaved edits, Show updates lets the user choose when to refresh.
5. Post a student question in Discussion, reply as the teacher and show the reply in the student tab. Open Students to see completed lesson counts.
6. As the administrator, show user and course management. Open Offers & announcements and edit an offer or schedule a short announcement. Show its student-facing card, rotation and navigation controls. Discounts are demonstration announcements. The prototype does not process payments.
7. Trace a request from browser JavaScript through Node.js to SQLite. The event stream tells authorized clients when to fetch changes. The server delivers local video in byte ranges. Explain why the local prototype uses this stack and how it differs from the original React, Express and PostgreSQL proposal.

## Evidence to capture

Capture the registration and sign-in screens, student catalog, course details, video player, note and progress indicator. Follow one submission through grading and feedback. Include the teacher reply or student roster, the administrator offer and the corresponding student announcement. Capture verification output when relevant. Take screenshots from the running application.

## Verification

```
npm run verify:week4
npm run verify:courses
npm run verify:platform
npm run verify:realtime
npm run verify:demo
```

Run `npm run demo` to restore missing demonstration records while preserving accounts, progress and edits. To regenerate the video, run `python scripts/create-demo-media.py` with Pillow and FFmpeg installed.
