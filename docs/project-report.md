# SkillStream: Multi-Role Online Learning Platform
### Project Report - Week 1 & Week 2

---

## 1. Problem Statement (Week 1)

A lot of online learning platforms struggle to keep roles and permissions organized between the people who run the platform, the teachers, and the students. Teachers need a simple way to upload and manage their own course material without going through the admin for every small change. Students, on the other hand, just want to find a course, enroll, and watch the lessons without getting lost in a messy interface.

SkillStream tries to fix this by giving each role its own clear set of permissions:

- **Admin** manages users and checks that courses follow the platform rules.
- **Teacher** creates and publishes courses and video lessons.
- **Student** browses the catalog, enrolls, and follows the lessons.

---

## 2. Functional Requirements (Week 2)

| ID | Requirement |
|-------|-------------|
| FR-01 | The system shall allow users to register and log in as Admin, Teacher, or Student. |
| FR-02 | The system shall allow administrators to manage platform users and moderate courses. |
| FR-03 | The system shall allow teachers to create, update, and publish course content and video lessons. |
| FR-04 | The system shall allow students to browse the course catalog and enroll in available courses. |
| FR-05 | The system shall allow enrolled students to watch video lessons and track their progress. |

---

## 3. Non-Functional Requirements (Week 2)

| ID | Requirement |
|--------|-------------|
| NFR-01 | The system shall load course catalog pages in under 2 seconds under normal network conditions. |
| NFR-02 | User passwords must be securely hashed before being stored in the database. |

---

## 4. Scope & Constraints (Week 2)

**In scope**
- Handling the three roles (Admin, Teacher, Student) and what each one is allowed to do.
- Course creation and publishing by teachers.
- Student registration, enrollment, and watching course content.

**Out of scope**
- Online payment gateways.
- Live video streaming.

**Constraints**
- The project has to be finished and submitted within the semester, which gives us 9 weeks in total.

---

## 5. Implementation — Week 4 First Prototype

### 5.1 Implementation Overview

For the first prototype, I implemented the account flow planned at the end of Week 3. A user can register as a student or teacher, then sign in with that account. The server validates the submitted fields, hashes the password before saving the account, and returns a signed JSON Web Token (JWT). A protected profile endpoint accepts that token and returns the matching account. This implements the registration and login portion of FR-01; admin account setup is not part of this prototype.

The browser page, HTTP API, authentication functions, and local user database are connected in one running Node.js application. Course management, enrollment, video lessons, and progress tracking remain outside the Week 4 prototype.

### 5.2 Development Environment and Technologies

| Component | Actual technology/version | Role and reason for selection |
|---|---|---|
| Language/runtime | JavaScript, Node.js 24.13.1 | Runtime available in the development environment |
| HTTP server | Node.js built-in `http` module | Serves the prototype page and API without requiring an external package install |
| User database | SQLite 3.51.2 through Node's built-in `node:sqlite` | Provides persistent local records while PostgreSQL and a running Docker service were unavailable |
| Password hashing | Node.js `crypto.scryptSync` with random per-account salts | Keeps password plaintext out of the database and uses an available password-hashing function |
| Token signing | HMAC-SHA256 JWT | Lets the API validate a signed user ID and role claim on a protected request |
| Interface | HTML, CSS, browser JavaScript | Provides the registration and sign-in flow for the prototype |
| Version control | Git and GitHub | Track source and documentation changes; repository updates are recorded in the development log |

The Week 3 target proposed React, Express, and PostgreSQL. For this first local prototype, I used Node's built-in HTTP and SQLite modules because PostgreSQL tools and a running Docker service were not available. This made the prototype self-contained, but it does not yet demonstrate the planned PostgreSQL deployment. That difference is recorded as a technical limitation rather than presented as if the original stack had been implemented.

### 5.3 Prototype Implementation

**Feature:** Student/teacher account registration and sign-in

**Requirement:** FR-01, partially implemented

**Input:** First and last name, email, password, and student/teacher role for registration; email and password for sign-in.

**Output:** A public account profile and signed JWT on success; a clear HTTP error for invalid or duplicate input.

**Processing:** The server validates email, role, name, and password length. It creates a user ID, stores a per-account salted scrypt hash in SQLite, and signs a one-hour JWT containing the account ID and role. Login looks up the account and checks the password hash. `GET /api/me` verifies the Bearer token before returning the profile.

**Architecture relationship:** Browser form → Node.js HTTP API → authentication logic → SQLite users table. The protected profile request follows the reverse path after the API validates the JWT.

**Evidence:** Preliminary API handler checks and their actual output are recorded in `evidence/week-04/verification.md`. The browser-to-server UI flow remains to be demonstrated locally because loopback networking was blocked in the current environment. The account database remains local and is excluded from Git.

### 5.4 Technical Challenges and Solutions

The repository contained design documents but no runnable application code. PostgreSQL tools were not installed, and Docker could not connect to its engine. I created a small Node.js application using its built-in HTTP, cryptography, and SQLite modules so I could demonstrate a persistent registration and login workflow without external packages. The trade-off is that the prototype diverges from the planned React/Express/PostgreSQL stack. The next implementation step is to set up PostgreSQL and move the account store to it before extending the system.

### 5.5 Development Process — Stage 1

| Field | Student entry |
|---|---|
| Date | 31 October 2026 |
| Objective | Build and demonstrate the first working account workflow for FR-01 |
| Implemented functionality | Student/teacher registration, login, local account persistence, salted password hashing, JWT issuance and validation, protected profile endpoint |
| Important technical decision | Use Node.js built-in modules and SQLite for a runnable local prototype while documenting the planned-stack deviation |
| Problem encountered | No existing app source; PostgreSQL unavailable and Docker engine not running |
| Solution attempted | Added a local API and browser flow backed by SQLite |
| Related GitHub commit | `584b9e2` — `feat: add Week 4 authentication prototype` |
| Screenshot/other evidence | See `evidence/week-04/verification.md` after local verification |
| Next development step | Finish preliminary checks, capture the real running UI, and prepare PostgreSQL migration before implementing course enrollment |

### 5.6 Current Limitations and Next Steps

Admin account provisioning, email verification, password reset, rate limiting, deployment secret management, courses, enrollment, video delivery, and progress tracking are not implemented. The current interface is HTML/CSS/JavaScript, and the local data store is SQLite. The next steps are to verify the account flow, provision PostgreSQL, migrate the users table, and then develop the course catalog and enrollment flow.
## 5. Week 8 revision and technical consistency

This revision carries the original problem, roles, requirements and prototype record forward into the integrated local implementation. The following sections supersede the earlier proposed stack when describing the running software.

## 6. Background and engineering method
Requirements distinguish role-specific behavior from measurable quality targets. Role-based access control informed the teacher ownership and student enrollment checks [1]. Node.js provides built-in HTTP, SQLite and cryptographic operations [2-4]. Password storage follows a salted password-derivation approach informed by OWASP guidance [5]. Incremental development connected account operations, course publishing and learning records before integration checks.

## 7. Implemented architecture and development
Browser HTML/CSS/JavaScript communicates with server.js through authenticated HTTP requests. platform.js applies course ownership, enrollment and learning rules and persists records in SQLite. realtime.js sends permission-filtered change hints. Protected MP4/WebM files remain on local disk. Figure 8.1 describes this single-process deployment. React, Express, PostgreSQL and cloud video were earlier proposals.

Stage 1 (31 October 2026, 584b9e2) implemented account registration, login, password hashes and protected profiles. Stage 2 (2 November, 88e9c6e) added teacher course/lesson drafts and publication. Stage 3 shares that commit and connects catalog, enrollment, protected lessons and saved progress. These stages were grouped in source history. Stage 4 (18 November, e4c0b98 and eccfbc9) recorded API validation and browser playback/timing. Stage 5 (27 November, 31b691d) tested a fresh clone and corrected missing video-generation instructions. Each dated weekly record contains decisions, evidence and next steps.

## 8. Table 8.1 Requirement traceability
FR-01 | server.js and account interface | Week 6 T01-T03 | Pass with separate administrator provisioning.
FR-02 | platform.js administrator operations | Week 6 platform and realtime logs | Pass in local API verification.
FR-03 | platform.js course/lesson rules | Week 6 course suite | Pass.
FR-04 | platform.js enrollment and catalog | Week 6 T04-T05 | Pass.
FR-05 | protected media and saved progress | Week 6 T06-T09/T11 | Pass locally.
NFR-01 | catalog rendering | Week 6 T10, 268 ms initial and 85-144 ms repeats | Partial, measured on localhost only.
NFR-02 | salted scrypt password storage | Week 6 T03 | Pass for stored-hash check.

## 9. Testing, installation and results
The existing verification suites use isolated SQLite records, HTTP requests and assertions about returned data. Week 6 passed all five suites, including 90 platform checks and database reopen persistence. Browser testing decoded 29 frames at 1280 by 720 with advancing playback and no media error. Figures 8.2 and 8.3 capture the current catalog and lesson output. Their fresh-run measurements are stored in evidence/week-08/browser.json.

A fresh local clone during Week 7 lacked sample video because runtime data is excluded from Git. Seeding initially failed. Generating the original video with Python/Pillow and FFmpeg before seeding corrected the setup, and the demo retest passed. See evidence/week-07/initial-demo.txt and demo.txt. docs/installation.md documents prerequisites, clone, configuration, run, sample-data and verification commands. Runtime needs Node.js; sample-media creation additionally uses Windows fonts, Python, Pillow and FFmpeg.

## 10. Limitations and conclusion
The platform meets its central local teaching and learning objectives through persisted accounts, course publication, enrollment, lesson progress and coursework. The project demonstrates a connected application with repeatable local checks. Its evidence covers a single Windows host. Peer installation, full normal-network performance, external deployment and Linux/macOS sample-media generation remain open. Payments, live video, password-reset email and cloud transcoding are outside the implemented prototype.

## 11. Future work and Week 9
Rehearse teacher publication through student learning, confirm persistent progress after restart and review the final report against the official university template. Obtain peer setup feedback and measure catalog performance under a stated external network profile. Preserve the current SQLite implementation for the local demonstration and evaluate a database/cloud migration only when needed.

## 12. References
[1] R. S. Sandhu et al., Role-based access control models, IEEE Computer, 29(2), 1996, pp. 38-47.
[2] Node.js HTTP documentation. https://nodejs.org/download/release/v22.23.2/docs/api/http.html
[3] Node.js SQLite documentation. https://nodejs.org/download/release/v22.23.2/docs/api/sqlite.html
[4] Node.js Crypto documentation. https://nodejs.org/download/release/v22.23.2/docs/api/crypto.html
[5] OWASP Password Storage Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
