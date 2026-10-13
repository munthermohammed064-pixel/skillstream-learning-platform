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
