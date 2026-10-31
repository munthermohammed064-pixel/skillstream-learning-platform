# SkillStream: Multi-Role Online Learning Platform

## Project Overview
SkillStream is an online learning platform with three types of users: Admin, Teacher and Student. Teachers can publish their own courses, and students can sign up, enroll and learn at their own pace. The admin keeps an eye on users and course content.

## Scope & Status
- **Current Status:** Authentication and role-specific student/teacher workspaces implemented. Course creation, publishing, discovery, and enrollment pass real HTTP verification.
- **Core Roles:** Admin, Teacher, Student.

## Documents
- [Project Report (Week 1 & 2)](docs/project-report.md) - problem statement, requirements, scope and constraints.
- [Week 4 Development Record](docs/weekly-progress/week04.md) - prototype scope, verification evidence and Stage 1 record.

## Milestones
| Week | Milestone | Status |
|------|-----------|--------|
| 1 | Project idea, problem statement and references | Done |
| 2 | Functional / non-functional requirements, scope | Done |
| 3 | Architecture and technical design | Done |
| 4 | First working authentication prototype | In Progress |
| 5-9 | Further implementation, testing and final delivery | Planned |

## Run the Week 4 prototype

Requirements: Node.js 22.5 or later. The prototype uses Node's built-in HTTP server, cryptography and SQLite modules; it does not need `npm install` or a running PostgreSQL server.

```powershell
npm start
```

Open <http://localhost:3000>. Create a student or teacher account, then sign out and sign in. The account is stored in `data/skillstream.sqlite`, which is local and ignored by Git. Passwords are stored as scrypt hashes. The API issues a one-hour signed JWT and exposes `GET /api/me` as an authenticated route.

Run `npm run verify:week4` to repeat the preliminary API handler checks against a temporary in-memory database. The current verification output is in [evidence/week-04/verification.md](evidence/week-04/verification.md). A full browser demonstration should be captured from the local app before submission.

For a stable signing key between restarts, set `JWT_SECRET` in the environment before starting the server. Without it, the server creates a temporary development key and prints a notice; tokens stop working when the server restarts. Do not commit real secrets.

### Prototype API

- `POST /api/auth/register` - creates a student or teacher account and returns the account plus a JWT.
- `POST /api/auth/login` - checks credentials and returns the account plus a JWT.
- `GET /api/me` - returns the signed-in account when sent `Authorization: Bearer <token>`.

The local SQLite database is a deliberate prototype adjustment because PostgreSQL and a running Docker service were not available in the development environment. PostgreSQL, Express and the React frontend remain candidates for the full implementation after setup is agreed and available.

## Student and teacher workspaces

After signing in, students can search and filter published courses, enroll, open their personal learning library, and view their account details. Teachers can create course drafts, publish or unpublish their own courses, see real enrollment counts, and view their account details. Course and enrollment records persist locally in SQLite. No sample courses or simulated progress are shown.

Use a teacher account to create and publish a course, then a student account to enroll. New accounts can be created using the registration form. `npm run verify:courses` verifies the workflow and authorization boundaries over real HTTP with an isolated, temporary in-memory database.

Additional APIs: `GET /api/courses`, `POST /api/courses`, `PATCH /api/courses/:id`, `POST /api/courses/:id/enroll`, and `GET /api/enrollments`. The server derives ownership and enrollment identity from the authenticated account.

Lessons, video delivery, progress tracking, assignments, certificates, admin provisioning, and production deployment are not implemented. See [workspace scope and roadmap](docs/student-teacher-workspaces.md).

## Week 3 - Architecture Design
- [Architecture Decisions](docs/design/architecture-decisions.md) - Component responsibilities, data flows, and technology justifications
- [Architecture Diagram](docs/design/architecture-diagram.md) - System architecture with component boundaries and data flow
- [Week 3 Progress Log](docs/weekly-progress/week03.md) - Design walkthrough, risks, and prototype plan
