# Week 4 submission preparation

Revision: 2 November 2026. University submission and deployment have not been performed.

## Verified locally

- Authentication: all seven cases pass; one account record and hashed password confirmed.
- Courses: real HTTP registration, publishing, ownership, enrolment and duplicate prevention pass.
- Platform: 90 HTTP checks pass; records persist after reopening SQLite.
- Realtime: authenticated streams, recipient isolation, offer expiry and session revocation pass.
- Demo: idempotent setup, protected video download and FFmpeg decoding, enrolment, progress, notes, submission, grading and reply pass.
- Frontend JavaScript syntax checks and `git diff --check` pass (Git reports normal line-ending warnings).

These checks do not establish browser visual correctness, native browser video playback or the two-second catalogue target.

## Report

Current review file: `output/pdf/SkillStream_Week4_Combined_Review.pdf`.
It combines the weekly assignment and cumulative report, numbered figures/tables, authentic technical output and references. The footer contains page numbers only. Detailed appendices cover components, role workflows, core data relationships and registration sequence.

## Browser evidence remains blocked

The application was started at `http://localhost:3000/`. The browser tool rejected access because a saved permission or managed policy denied that origin. No alternate browser surface, headless tool or other workaround was used. Four screenshots were subsequently supplied by the student and included as Figures E.1-E.4. They show teacher courses/settings and student workspace/profile. No successful interactive browser acceptance by the agent is claimed.

Once browser access is allowed, capture the following using demonstration accounts without showing credentials or tokens:

1. Public welcome page and course catalogue.
2. Registration result or authenticated student workspace.
3. Enrolled course, actual video and progress.
4. Teacher lesson/assignment management and review.
5. Student-visible grade and instructor reply.
6. Admin offers and user management.

Captions should identify the action and what the image proves. Add only actual captures to the report.

## Repository preparation

The source changes are prepared for a GitHub update on `docs/week3-architecture`. This repository update is separate from uploading the combined report PDF to the university assignment.

Candidate changes: application source and assets, verification scripts, original demo content, current documentation, and the final approved report. Review each path explicitly before staging. Do not stage `data/`, passwords, signing keys, temporary report renders or unrelated `docs/Week3_Submission.html`.

Commit groups should describe platform implementation, interface design, verification/demo content and submission documentation. Report references to commit hashes must use the hashes actually created.

## Outstanding before final submission

- Apply the official university template when supplied.
- Four student-supplied captures are incorporated; complete remaining interactive browser acceptance and any desired lesson/admin captures.
- Review final report wording, diagrams, captions, citations and student details.
- Resolve the authorised GitHub version and update its report reference if required.
- Upload the approved combined PDF to the university assignment and verify the submission receipt/status. This final upload has not been performed.
