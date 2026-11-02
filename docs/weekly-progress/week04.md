# Week 4 Progress Record

## Scope chosen

The first prototype implements account registration and login, based on FR-01 and the Week 3 prototype plan. It demonstrates a complete browser-to-server-to-database flow: a student or teacher submits an account form, the API validates it, stores the account, and returns a signed JWT. Signing in checks the stored password hash. The authenticated `GET /api/me` endpoint confirms the token and returns the current user's profile.

Public self-registration is limited to student and teacher accounts. An admin account must be provisioned separately; the prototype does not yet implement that workflow.

## Implementation record

| Item | Actual implementation |
|---|---|
| Language/runtime | JavaScript on Node.js 24.13.1; source requires Node.js 22.5 or later for built-in SQLite |
| HTTP/API | Node.js built-in `http` module; no Express dependency in this prototype |
| Data store | Node.js built-in SQLite module; `data/skillstream.sqlite` is created locally |
| Password storage | Node.js `crypto.scryptSync`, a random per-account salt, and a timing-safe comparison on login |
| Session token | HMAC-SHA256 signed JWT with user ID, email, role, issue time, and one-hour expiry |
| Interface | HTML, CSS and browser JavaScript served by the same Node.js process |
| Repository | Account database and secrets are excluded by `.gitignore` |

## Architecture relationship and decision

The prototype preserves the Week 3 flow: browser interface → HTTP API → authentication logic → persistent user record. The account ID and role are included in the JWT, and the protected profile route validates the token before returning account data.

The Week 3 design proposed React, Express and PostgreSQL. Neither PostgreSQL tools nor a running Docker service were present in the development environment, so I used Node's built-in HTTP and SQLite modules to make the first workflow runnable without external packages. This is a prototype-only decision, and SQLite does not demonstrate the PostgreSQL design or its multi-user deployment characteristics. Moving to PostgreSQL and the planned framework remains future work.

## Preliminary verification

These preliminary checks exercise the API request handlers with a temporary in-memory SQLite database; they are not a replacement for the fuller testing planned later. The environment blocked loopback network access, so the browser-to-server connection and visual flow still need a local demonstration.

| ID | Input/action | Expected | Actual | Status |
|---|---|---|---|---|
| P01 | Register a new student with valid name, email and password | `201 Created`; student record and JWT returned | `201`; JWT returned; one SQLite account row stored | Pass |
| P02 | Sign in with the same email and password | `200 OK`; same account and fresh JWT returned | `200`; returned account ID matched registration | Pass |
| P03 | Request `/api/me` with the returned Bearer token | `200 OK`; matching profile returned | `200`; profile email matched the registered account | Pass |
| P04 | Register again with the same email | `409 Conflict`; no duplicate record | `409`; one account row remained | Pass |
| P05 | Submit a password shorter than 8 characters | `400 Bad Request`; account is not created | `400` | Pass |
| P06 | Sign in with an incorrect password | `401 Unauthorized`; credentials are not disclosed | `401` | Pass |
| P07 | Request `/api/me` without a token | `401 Unauthorized` | `401` | Pass |

The repeatable check is `npm run verify:week4`; its recorded output is in `evidence/week-04/verification.md`. The browser UI has not been verified end-to-end in this environment.

## Technical challenges and solutions

| Problem | Diagnosis | Attempted solution | Outcome/evidence |
|---|---|---|---|
| PostgreSQL and a running Docker service were not available in the environment | Checked for `psql`/PostgreSQL commands and queried Docker; Docker could not connect to its engine | Used Node's built-in SQLite module for the first local, persistent prototype and documented the deviation | Prototype uses a local database; PostgreSQL integration remains incomplete |
| No account/authentication source code existed in the repository | The Week 3 repository contained planning and design documents, but no runnable app | Added the Node.js server, local database schema, browser form, validation, password hashing and signed-token endpoints | Source files under `src/` and `public/`; verification table above |

## Development Process — Stage 1

| Field | Student entry |
|---|---|
| Date | 31 October 2026 |
| Objective | Build the first runnable SkillStream workflow around FR-01 |
| Implemented functionality | Student/teacher registration, login, local user persistence, salted password hashing, JWT creation and validation, protected profile endpoint |
| Important technical decision | Use built-in Node.js HTTP/SQLite/crypto modules to keep the prototype runnable without a package install or unavailable PostgreSQL service; preserve the intended API and authentication flow |
| Problem encountered | No PostgreSQL installation or running Docker engine; no pre-existing application code |
| Solution attempted | Local SQLite prototype and a simple static browser interface; record the difference from the Week 3 target for later migration |
| Related GitHub commit | `584b9e2` — `feat: add Week 4 authentication prototype` |
| Screenshot/other evidence | API verification output: `evidence/week-04/verification.md`; browser screenshot remains to be captured during a local run |
| Next development step | Run the app locally, capture the actual UI flow, then provision PostgreSQL and begin course functionality in Week 5 |

## Current limitations and Week 5 next steps

- Admin provisioning is not implemented; public registration is restricted to student and teacher roles.
- The database is local SQLite; PostgreSQL migration, schema migrations and deployment configuration remain open.
- The prototype has no rate limiting, password reset, account verification or production secret management.
- The frontend is a simple HTML/CSS/JavaScript screen, not the planned React interface.
- Courses, enrollment, video delivery and progress tracking are not implemented yet.

The entries above are the historical Week 4 plan and implementation record as written at that milestone. The following dated addendum records subsequent local development without rewriting that history.

## Later local implementation addendum — 2 November 2026

The prototype was extended after the original Week 4 authentication work. The current local code supports technical course publishing and enrollment, lessons and protected local video, playback progress and completion, private notes, written assignments and grading, course questions and replies, administrator account controls and offers, and authenticated live update notifications. The interface includes student, teacher and administrator workspaces.

The implementation remains on built-in Node.js HTTP, SQLite, HTML, CSS and browser JavaScript. React, Express and PostgreSQL remain proposed technologies and have not been implemented. Administrator provisioning is now available as a separate local command. The prior limitations above describe the earlier milestone and should not be read as the current feature list.

Verification rerun on 2 November 2026 used Node.js v22.23.2. `npm run verify:week4` passed all seven authentication cases; `npm run verify:courses`, `npm run verify:platform` (90 HTTP checks plus persistence), `npm run verify:realtime` and `npm run verify:demo` also passed. The demo check downloaded and decoded the authored WebM video and exercised enrollment, progress, notes, submission, grading and Q&A.

Four screenshots supplied by the student are stored in `evidence/week-04/screenshots/`: student workspace, student account, teacher course library and teacher account/settings. They document rendered interfaces. They do not prove lesson playback, interactive registration, grading, or admin workflows. The two-second catalog performance target remains unmeasured. See `evidence/local-platform-verification.md` for the broader test scope and limits.

The current implementation and supporting source are documented in the repository. The cumulative university report still requires transfer into the official university template before PDF submission.
