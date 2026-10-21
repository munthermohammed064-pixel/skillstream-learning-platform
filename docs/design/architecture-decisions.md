# SkillStream Architecture Design Decisions

## Table A - Requirements-to-Design Traceability

| ID | Requirement in my project | Design response / component |
|-----|---------------------------|----------------------------|
| FR-01 | The system shall allow users to register and log in as Admin, Teacher, or Student. | Authentication Service, User Database, Login API Endpoint |
| FR-03 | The system shall allow teachers to create, update, and publish course content and video lessons. | Course Management Service, Video Storage, Content Upload API |
| FR-05 | The system shall allow enrolled students to watch video lessons and track their progress. | Video Streaming Service, Progress Tracking Database, Enrollment Service |
| NFR-01 | The system shall load course catalog pages in under 2 seconds under normal network conditions. | Database indexing, CDN for static assets, API response caching |
| NFR-02 | User passwords must be securely hashed before being stored in the database. | Password hashing module (bcrypt/argon2), User database schema |

## Table B - Component Responsibility Sheet

| Component | Responsibility / main input | Output / connection |
|-----------|---------------------------|---------------------|
| 1. Web Frontend (React) | User interface for all three roles, handles user interactions | HTTP requests to Backend API, displays data from API responses |
| 2. REST API Backend (Node.js/Express) | Receives HTTP requests, validates input, coordinates business logic | JSON responses to Frontend, database queries, calls to external services |
| 3. Authentication Service | Handles user registration, login, logout, session management | JWT tokens, session data, role-based access control |
| 4. User Database (PostgreSQL) | Stores user accounts, profiles, roles, and enrollment data | User records, course enrollment data, progress tracking |
| 5. Course Database (PostgreSQL) | Stores course metadata, lesson information, and content structure | Course catalogs, lesson lists, content references |
| 6. Video Storage Service | Stores and serves video lesson files | Video streaming URLs, file upload responses |
| 7. Admin Dashboard API | Provides endpoints for user management and course moderation | User lists, moderation actions, approval responses |

**Boundary Explanation:**
- User device: Web Frontend runs in user's browser
- Server: REST API Backend, Authentication Service, databases run on server
- External: Video Storage Service could be cloud-based (e.g., Cloudflare R2, AWS S3)
- Data processing: API Backend handles business logic and coordinates between components
- Storage: PostgreSQL databases handle all persistent data storage

## Table C - End-to-End Execution Scenario

**Use Case: Student enrolls in a course**

| Step | Component | Input, operation, and output |
|------|-----------|------------------------------|
| 1 | Web Frontend | Student clicks "Enroll" button, sends POST request to /api/courses/{id}/enroll with student ID and JWT token |
| 2 | REST API Backend | Receives request, validates JWT token and role, checks if student is already enrolled |
| 3 | User Database | API queries enrollment table to check existing enrollment status, returns enrollment status |
| 4 | REST API Backend | If not enrolled, creates new enrollment record in User Database, returns success response |
| 5 | Web Frontend | Receives success response, updates UI to show "Enrolled" status, enables access to course lessons |

**Failure Case:**
- If student is already enrolled, API returns 409 Conflict error
- Frontend displays "You are already enrolled in this course" message
- No database changes occur

## Table D - Architecture Decision Records (ADR-style)

| Decision | Student response |
|----------|------------------|
| **ADR-01** | |
| Issue | Database selection for storing users, courses, and enrollment data |
| Selected option | PostgreSQL |
| Alternative | MongoDB |
| Reason / trade-off | PostgreSQL provides ACID compliance, strong relational data integrity for enrollment relationships, and mature ecosystem. MongoDB would offer schema flexibility but requires more application-level validation for critical data like enrollments. PostgreSQL is better suited for structured relationships between users, courses, and enrollments. |
| Reference URL | https://www.postgresql.org/about/ |
| **ADR-02** | |
| Issue | Frontend framework choice for user interface |
| Selected option | React |
| Alternative | Vue.js |
| Reason / trade-off | React has larger ecosystem, more learning resources, and better component reusability for complex multi-role interfaces. Vue.js offers simpler learning curve but React's ecosystem and job market alignment make it the preferred choice for this project. |
| Reference URL | https://react.dev/ |

## Table E - Design Risk and Mitigation

| Risk | Potential impact | Mitigation / verification |
|------|------------------|---------------------------|
| R1 | Video streaming performance issues under high load | Use CDN for video delivery, implement adaptive bitrate streaming, test with concurrent users during Week 6 |
| R2 | Database performance degradation as course catalog grows | Implement proper indexing on frequently queried fields, use connection pooling, add database monitoring, performance test with large datasets |

## Week 4 Prototype Plan

In Week 4, I will demonstrate user registration and login functionality, where user input passes through the Web Frontend to the REST API Backend and Authentication Service to produce a successful login with JWT token generation. Terminal output showing successful API responses and database user record creation will prove it worked.