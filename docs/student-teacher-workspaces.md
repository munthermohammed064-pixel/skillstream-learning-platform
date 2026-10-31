# Student and teacher workspaces

This extension follows the initial Week 4 authentication work. It adds a role-specific workspace and a real course/enrollment flow to the existing Node.js/SQLite application. Earlier Week 4 evidence records describe the initial authentication prototype at the referenced commit; they do not claim these later course features were already present.

## Implemented

- Student: published catalog, title/description/teacher search, category filter, enrollment, personal course library, course description, account details, and sign out.
- Teacher: own course library, course draft creation (title, category, description), publish/unpublish, real enrollment count, account details, and sign out.
- Authorization: only teachers create courses; only the owner publishes or unpublishes; only students enroll; draft courses are hidden from the student catalog. Unpublishing does not delete an existing student's enrollment.
- SQLite stores courses and enrollments with foreign keys and unique student/course enrollment pairs. Tokens provide the current account identity; submitted user IDs are not trusted.
- Empty, loading, failure/retry, and expired-session states are handled. Course/user text is rendered using DOM text content. Desktop authentication uses a split layout; mobile uses a single column. Reduced-motion preference is respected.

## Verification

`npm run verify:courses` passed using actual HTTP requests against the application handler and an isolated in-memory database. It covers registration, unauthenticated access, student creation denial, invalid fields/JSON, draft visibility, owner restrictions, publishing, teacher enrollment denial, student enrollment, duplicate prevention, personal library, enrollment counts, and unpublishing behavior.

The original authentication checks also pass through `npm run verify:week4`. Browser visual review was not performed because permission to observe the local page was declined; no visual review or screenshot is claimed.

## Suggested next features, especially for students

1. Lesson player and saved playback position, backed by uploaded lesson content and protected access.
2. Real lesson completion and course progress, plus a continue-learning view.
3. Student notes and bookmarks linked to lesson timestamps.
4. Assignments, file submission, teacher feedback, and grades.
5. Course questions and teacher replies, with notifications for responses.
6. Saved courses, learning goals, and optional reminders.
7. Certificates only after completion requirements are defined and recorded.

Teacher follow-up: edit course metadata, organize modules/lessons, upload content, review assignment submissions, answer questions, and inspect progress with appropriate student privacy controls.

Course details currently state that lessons have not been added. Catalog creation/publication and enrollment do not imply video lessons, assessments, or progress tracking have been implemented.
