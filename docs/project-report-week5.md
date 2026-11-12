# Graduation Project Report — Week 5 Update

**Project:** SkillStream — Multi-Role Technical Learning Platform
**Reporting update:** 12 November 2026
**Repository implementation referenced:** `88e9c6e`, committed 2 November 2026

This section is prepared for transfer into the official university report template. It records the current implementation and its verified limits. The core course and learning work described below predates this report update and is not presented as code written on 12 November.

## 4.3 Implementation — Core course workflow

The Week 4 prototype established student/teacher registration, login and a protected profile. The current local implementation extends that starting point with a teacher-to-student learning workflow. A teacher creates a technical-course draft, adds lessons and publishes the course. A student sees published courses, enrolls, opens an authorized lesson, and can save progress. The browser sends requests to the Node.js HTTP server; the server validates the session, role, course ownership and input, then the platform logic reads or writes SQLite records. A permitted live event can notify another open workspace that data changed; the browser reloads the record through the ordinary API.

The implementation is organized across `src/server.js` (HTTP, authentication and static files), `src/platform.js` (course, lesson, enrollment and progress rules) and `src/realtime.js` (authenticated updates). Browser code is separated into `public/app.js`, `public/learning.js` and `public/live.js`. The teacher course editor, student catalog and lesson workflow are presented by the same local application.

## 4.4 Basic error handling and code quality

The current source separates request handling, learning-domain operations and live event delivery. The API rejects empty course titles, malformed course requests and nontechnical categories; rejects negative lesson progress and invalid completion values; prevents students from publishing; restricts teachers to their own courses; and rejects duplicate enrollment with HTTP 409. These outcomes are repeatable through `npm run verify:courses` and `npm run verify:platform`. Private database files, signing keys and demonstration credentials are kept in ignored local `data/` files.

These are prototype-level input and permission checks. The local verification does not constitute a security audit or a complete user-facing browser test.

## 4.5 Architecture and technology stack

The Week 3 proposal separated a React frontend, Express API/authentication service, PostgreSQL storage and external video storage. The implemented prototype preserves the logical flow from browser to validated application request to persistent data, but combines runtime services in one Node.js process. The frontend is HTML/CSS/browser JavaScript; HTTP uses built-in `node:http`; domain logic is separated into `platform.js`; events use an authenticated stream; persistence uses built-in `node:sqlite`; and video files remain local. This choice kept the demonstration runnable without a PostgreSQL/Docker service. It does not demonstrate the proposed React/Express/PostgreSQL deployment or cloud video delivery. The original and current diagrams plus a component-by-component comparison are in `docs/design/architecture-diagram.md`.

| Component | Current technology | Role in the prototype |
|---|---|---|
| Language/runtime | JavaScript on Node.js (local verification: v22.23.2) | Runs the HTTP server, domain modules, scripts and browser code. |
| HTTP | Built-in `node:http` | Serves the interface and JSON endpoints without an external web framework. |
| Interface | HTML, CSS and browser JavaScript | Renders student, teacher and admin workspaces. |
| Data | Built-in `node:sqlite`, backed by SQLite | Persists accounts, courses, lessons, enrollments and learning records locally. |
| Password/session handling | Built-in `node:crypto`; salted scrypt and HMAC-SHA256 signed tokens | Stores password hashes and validates authenticated requests. |
| Live updates | Authenticated server event stream | Notifies permitted open workspaces to refresh changed data. |
| Media | Local MP4/WebM files; FFmpeg used in the demo verification | Serves protected course media locally; FFmpeg decodes the authored demo video in a check. |
| Version control | Git and GitHub | Tracks implementation and report changes; local databases and secrets are excluded. |

## 4.6 Development Process — Stage 2

Stage 2 adds teacher course and lesson authoring beyond the account-only Week 4 prototype. Teachers can create a draft, update their own course, add lessons and publish into the student catalog. Server-side validation enforces the technical category and course ownership. The related files are `src/platform.js`, `public/learning.js` and `scripts/verify-courses.js`. `npm run verify:courses` checks invalid course input, draft visibility, ownership restrictions, publication and unpublishing over HTTP.

## 4.7 Development Process — Stage 3

Stage 3 connects publication to student learning: catalog → enrollment → protected lesson → saved progress. A duplicate enrollment returns HTTP 409; course and lesson access depend on role and enrollment. The workflow is represented in `src/platform.js` and `public/learning.js`, with update delivery in `src/realtime.js` and `public/live.js`. `npm run verify:platform` checks the HTTP behavior and database persistence. `npm run verify:demo` downloads and decodes the authored WebM, then checks enrollment, progress, notes, assignment submission, teacher grading and reply.

Both stages are mapped to existing implementation commit `88e9c6e` (2 November 2026). They were included together in that platform commit, so the report does not invent separate Stage 2 and Stage 3 commit hashes or claim that either was implemented on 12 November. The four student-supplied screenshots document the student catalog/workspace and teacher catalog/account screens; they do not show the complete enrollment-to-progress sequence. The Week 6 plan should include authentic browser acceptance for that sequence.

## Current requirements summary

See `docs/weekly-progress/week05.md` for the complete FR/NFR status table, detailed stage records, evidence references, current limitations and prioritized next steps.
