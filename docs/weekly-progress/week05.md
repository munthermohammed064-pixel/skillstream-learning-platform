# Week 5 Progress — Core Implementation and Engineering Quality

**Report update:** 12 November 2026
**Repository:** `docs/week3-architecture`
**Current source commit:** `88e9c6e` — `feat: complete local technical learning platform` (2 November 2026)
**Implementation dates:** 31 October and 2 November 2026, as shown in Git history. This file records their relationship to the Week 5 checklist; it does not backdate work to 12 November.

## 1. Current requirement status

| Requirement | Status in the local prototype | Evidence and limit |
|---|---|---|
| FR-01 — registration and login | Implemented for student/teacher self-registration; admin is provisioned by a separate local command. | `npm run verify:week4`, `npm run verify:platform`; invalid credentials and unauthorized requests are rejected. The public form does not create admin accounts. |
| FR-02 — admin account and course management | Implemented through API and administrator workspace. | `npm run verify:platform`, `npm run verify:realtime`; no student-supplied administrator screenshot is available. |
| FR-03 — teacher course and lesson publishing | Implemented, including drafts, ownership rules, lessons and local video uploads. | `npm run verify:courses`, `npm run verify:platform`; supplied teacher screenshot shows the course library, not an edit/publish action. |
| FR-04 — course discovery and enrollment | Implemented, including catalog filtering, enrollment and the student library. | `npm run verify:courses`, `npm run verify:platform`; the API checks enrollment and duplicate prevention. The supplied catalog screenshot does not capture an enrollment action. |
| FR-05 — lessons and progress | Implemented for enrolled learners, with protected local media, saved position and completion. | `npm run verify:platform`, `npm run verify:demo`; the demo downloads and decodes its WebM. Native browser playback has not been independently captured. |
| NFR-01 — catalog page under 2 seconds | Not yet established. | 30 warm localhost API calls measured p50 15.47 ms, p95 16.88 ms and max 17.48 ms. That excludes browser rendering, static resources and normal network conditions. See `evidence/week-04/catalog-performance.md`. |
| NFR-02 — passwords hashed before storage | Implemented with per-account salted scrypt hashes. | `npm run verify:week4` checks the stored value is a hash; this is project verification, not a production security audit. |

## 2. Prioritized implementation plan

1. Demonstrate the actual teacher-publish → student-enroll → lesson/progress workflow in the browser and capture those screens.
2. Measure the complete catalog page under the stated normal-network condition before claiming NFR-01.
3. Use Week 6 for systematic testing of invalid inputs, permission boundaries, media failures, persistence and regression behavior.
4. Keep SQLite and the current local stack for the graduation demonstration unless the supervisor asks for the proposed PostgreSQL/React/Express migration.

## 3. Development Stage 2 — Initial core functionality

| Field | Record |
|---|---|
| Implementation date | 2 November 2026, from the source commit timestamp. This is existing work recorded retrospectively in this Week 5 update, not a claim that it was implemented on 12 November. |
| Objective | Add useful course authoring and publishing beyond the Week 4 account prototype. |
| Requirement IDs | FR-03; supports FR-02 through later course moderation. |
| Implemented functionality | A teacher creates a technical course draft, edits it, adds lessons, and publishes it. Ownership and allowed course categories are checked by the API. |
| Main files | `src/platform.js`; `public/learning.js`; `public/app.js`; `scripts/verify-courses.js`. |
| Engineering decision | Keep course rules in the platform module and store courses/lessons in SQLite. Public registration remains limited to student and teacher roles; administrator privileges are provisioned separately. |
| Problem and solution | The proposed PostgreSQL/Docker setup was unavailable in the earlier environment. A built-in SQLite store kept course records persistent without adding a service dependency. PostgreSQL remains a planned migration, not an implemented component. |
| Demonstration and evidence | `npm run verify:courses` exercises course validation, draft visibility, ownership, publishing and unpublishing over HTTP. `evidence/week-04/screenshots/teacher-courses.png` shows the teacher library but does not by itself prove those actions. |
| GitHub history | `88e9c6e` — `feat: complete local technical learning platform`, pushed to `docs/week3-architecture`. Course work was included in this grouped implementation commit; it was not committed as a separate Stage 2 change. |
| Next step | Demonstrate the publishing action in the browser, then verify the student workflow using that published course. |

## 4. Development Stage 3 — Integrated learning workflow

| Field | Record |
|---|---|
| Implementation date | 2 November 2026, from the same grouped source commit. This Stage 3 record describes a distinct workflow in that implementation; it does not imply a separate commit or a later implementation date. |
| Objective | Connect course publication to student enrollment and persistent lesson progress. |
| Requirement IDs | FR-04 and FR-05; follows the teacher workflow in FR-03. |
| Implemented functionality | A student discovers a published course, enrolls once, opens an authorized lesson, records completion/position and can return to the course library. Duplicate enrollment is rejected with HTTP 409. The local demo also exercises a video download, notes, a written assignment, grading and a teacher reply. |
| Main files | `src/platform.js`; `src/server.js`; `public/learning.js`; `public/live.js`; `scripts/verify-platform.js`; `scripts/verify-demo.js`. |
| Engineering decision | Keep enrollment, ownership and lesson-access checks on the server; persist progress in SQLite; serve media through signed, authorized local routes. The browser receives live change hints and reloads data through the normal permission-checked API. |
| Problem and solution | A static course page would not demonstrate stored learning behavior. The API now writes enrollment and progress records and returns the updated library; isolated HTTP checks confirm persistence and duplicate handling. |
| Demonstration and evidence | `npm run verify:platform` checks enrollment, authorization, progress and SQLite reopen persistence. `npm run verify:demo` downloads and decodes the authored WebM and runs enrollment, progress, notes, submission, grading and Q&A. These tests do not establish native browser video playback. The supplied student images document the catalog and account screens, not the complete learning sequence. |
| GitHub history | `88e9c6e`, the same grouped commit cited for Stage 2. The repository does not contain separate Stage 2 and Stage 3 feature commits. |
| Next step | Capture the integrated browser workflow and use Week 6 for systematic integration and regression testing. |

## 5. Code quality and error handling

Two concrete improvements visible in the current source are:

1. **Separated responsibilities.** `server.js` handles HTTP, authentication and static delivery; `platform.js` handles learning-domain rules and database operations; `realtime.js` handles authenticated event delivery. In the browser, account/catalog behavior, learning interactions and live updates are separated into `app.js`, `learning.js` and `live.js`.
2. **Input and permission checks at the API boundary.** Course creation rejects missing or invalid fields; progress updates reject a negative position or a non-boolean completion value; learners cannot publish courses; teachers cannot edit another teacher's course; and duplicate enrollment returns HTTP 409. These cases are exercised by `verify:courses.js` and `verify-platform.js`.

Configuration and private data stay local: the SQLite file, signing key, uploaded media and demonstration credentials live under ignored `data/`. The static server returns an error for a missing file or an unsafe path. These practices reduce accidental exposure in this local project, but do not replace a production security review.

## 6. Architecture and technology decision

The Week 3 proposal describes React → Express/authentication service → PostgreSQL and external video storage. The current implementation keeps the same request-to-server-to-data flow, but serves a static HTML/CSS/JavaScript client from a single Node.js process, splits server responsibilities across `server.js`, `platform.js` and `realtime.js`, stores records in SQLite, and keeps videos on local disk. The original proposed architecture is preserved in `docs/design/architecture-diagram.md`; the actual local design and the reason for each change are now documented beside it. The app does not claim independent services, cloud storage, React, Express or PostgreSQL.

## 7. Evidence and chronology

The code for Stages 2 and 3 is in the 2 November grouped commit `88e9c6e`. The Week 5 guide and this status report were reviewed on 12 November. GitHub Issue [#4](https://github.com/munthermohammed064-pixel/skillstream-learning-platform/issues/4) was created retrospectively on 2 November for the Week 4 scope; it is not an issue opened before that work. The implementation evidence is test output, source code and the four supplied student/teacher screen captures. No capture of the complete course-to-progress browser journey is claimed.

On 12 November 2026, all five existing verification commands were run again successfully: authentication (7 checks), course workflow, platform (90 HTTP checks plus database reopen), realtime updates, and the end-to-end demo/video decode. The captured outputs are in `evidence/week-05/verification.md`.

The university report still needs to be transferred into the official template. No report PDF is included in the repository or submitted to the university as part of this update.
