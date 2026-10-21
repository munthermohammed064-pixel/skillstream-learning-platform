Altınbaş University | Software Engineering
Graduation Project | Week 3

ALTINBAŞ UNIVERSITY
Faculty of Engineering and Architecture | Software Engineering Department

GRADUATION PROJECT
WEEK 3 — TASK 3
Architecture and Technical Design

Academic Year: 2026–2027 | Instructor: Dr. F. Kuzey Edes Huyal

Student: munther Iskender (210513647)

Project title: SkillStream: Multi-Role Online Learning Platform

GitHub repository URL: https://github.com/munthermohammed064-pixel/skillstream-learning-platform

Submission date: October 21, 2026

MAIN OBJECTIVE

Convert the Week 2 requirements into a coherent technical design. At the end of Week 3, another software engineer should understand which parts the system contains, how those parts communicate, where data goes, why technologies were selected, and what will be implemented first in Week 4.

Relationship to the nine-week program: Week 1 defined the project; Week 2 documented requirements; Week 3 designs the architecture; Week 4 is reserved for the first working prototype.

1. Task 3.1 — Review Requirements and Identify Design Drivers

Selected Requirements

Three key functional requirements:
FR-01: The system shall allow users to register and log in as Admin, Teacher, or Student.
FR-03: The system shall allow teachers to create, update, and publish course content and video lessons.
FR-05: The system shall allow enrolled students to watch video lessons and track their progress.

Two important non-functional requirements:
NFR-01: The system shall load course catalog pages in under 2 seconds under normal network conditions.
NFR-02: User passwords must be securely hashed before being stored in the database.

Design Impact

FR-01 requires an Authentication Service, User Database, and Login API Endpoint to handle user registration and login for all three roles.

FR-03 requires a Course Management Service, Video Storage, and Content Upload API to enable teachers to independently create and publish course content.

FR-05 requires a Video Streaming Service, Progress Tracking Database, and Enrollment Service to allow students to watch lessons and track completion.

NFR-01 requires database indexing, CDN for static assets, and API response caching to achieve the 2-second page load target.

NFR-02 requires a password hashing module (bcrypt or argon2) and secure User Database schema to protect user credentials.

Table A — Requirements-to-Design Traceability

ID    Requirement in my project                                                                                                    Design response / component
FR-01 The system shall allow users to register and log in as Admin, Teacher, or Student.                                        Authentication Service, User Database, Login API Endpoint
FR-03 The system shall allow teachers to create, update, and publish course content and video lessons.                           Course Management Service, Video Storage, Content Upload API
FR-05 The system shall allow enrolled students to watch video lessons and track their progress.                                  Video Streaming Service, Progress Tracking Database, Enrollment Service
NFR-01 The system shall load course catalog pages in under 2 seconds under normal network conditions.                            Database indexing, CDN for static assets, API response caching
NFR-02 User passwords must be securely hashed before being stored in the database.                                                Password hashing module (bcrypt/argon2), User database schema

2. Task 3.2 — Identify the Main System Components

Table B — Component Responsibility Sheet

Component                     Responsibility / main input                                                          Output / connection
1. Web Frontend (React)      User interface for all three roles, handles user interactions                     HTTP requests to Backend API, displays data from API responses
2. REST API Backend          Receives HTTP requests, validates input, coordinates business logic             JSON responses to Frontend, database queries, calls to external services
3. Authentication Service    Handles user registration, login, logout, session management                   JWT tokens, session data, role-based access control
4. User Database             Stores user accounts, profiles, roles, and enrollment data                         User records, course enrollment data, progress tracking
5. Course Database           Stores course metadata, lesson information, and content structure               Course catalogs, lesson lists, content references
6. Video Storage Service     Stores and serves video lesson files                                            Video streaming URLs, file upload responses
7. Admin Dashboard API       Provides endpoints for user management and course moderation                    User lists, moderation actions, approval responses

Boundary Explanation

User device: Web Frontend runs in user's browser.

Server: REST API Backend, Authentication Service, and databases run on server.

External: Video Storage Service is cloud-based (Cloudflare R2 or AWS S3).

Data processing: API Backend handles business logic and coordinates between components.

Storage: PostgreSQL databases handle all persistent data storage.

3. Task 3.3 — Create Student-Designed Architecture Diagrams

High-Level System Architecture

The Web Frontend sends HTTP requests with JWT tokens to the REST API Backend using RESTful API endpoints. The API Backend processes requests and coordinates with the Authentication Service for user validation, the User Database for enrollment and progress data, the Course Database for course metadata, and the Video Storage Service for content delivery. This separation was selected because it provides clear separation of concerns, enables independent scaling of components, and allows for easier testing and maintenance of individual services.

Figure 3.1: High-level system architecture showing component boundaries and data flow

User Device           Server Layer              Data Layer           External Services
Web Frontend   --->   REST API Backend   --->   User Database        Video Storage Service
                      Auth Service       --->   Course Database

Architecture Explanation

What happens first? The user interacts with the Web Frontend by clicking buttons or filling forms.

Which component receives the input? The Web Frontend sends HTTP requests to the REST API Backend.

Where is processing performed? The REST API Backend validates requests, coordinates with the Authentication Service for token validation, and queries the appropriate database.

Where is output produced? The API Backend returns JSON responses to the Web Frontend, which updates the user interface.

What happens if a component fails? If the API Backend is unavailable, the Frontend displays an error message and allows retry. If the database is unreachable, the API returns a 503 error and logs the issue for admin investigation.

4. Task 3.4 — Explain One Complete Data or Control Flow

Use Case: Student Enrolls in a Course

Actor/Trigger: Student clicks "Enroll" button on course page.

Initial Input: POST request to /api/courses/{id}/enroll with student ID and JWT token.

Table C — End-to-End Execution Scenario

Step  Component          Input, operation, and output
1     Web Frontend       Student clicks "Enroll" button, sends POST request to /api/courses/{id}/enroll with student ID and JWT token
2     REST API Backend  Receives request, validates JWT token and role, checks if student is already enrolled
3     User Database      API queries enrollment table to check existing enrollment status, returns enrollment status
4     REST API Backend  If not enrolled, creates new enrollment record in User Database, returns success response
5     Web Frontend       Receives success response, updates UI to show "Enrolled" status, enables access to course lessons

Failure Case

If the student is already enrolled, the API returns a 409 Conflict error. The Frontend displays "You are already enrolled in this course" message. No database changes occur.

Interface Notes

API Endpoint: POST /api/courses/{id}/enroll

Request Headers:
Authorization: Bearer <jwt-token>
Content-Type: application/json

Request Body:
{
  "user_id": "uuid-here",
  "course_id": "uuid-here"
}

Success Response (201 Created):
{
  "enrollment_id": "uuid-here",
  "course_id": "uuid-here",
  "enrolled_at": "2026-10-21T10:00:00Z"
}

Error Response (409 Conflict):
{
  "error": "Already enrolled",
  "message": "You are already enrolled in this course"
}

5. Task 3.5 — Data, Storage and Integration Design

Data Entered, Sensed, Downloaded, Transmitted, or Generated

User registration data: email, password, name, role
Course data: title, description, category, price
Lesson data: title, description, video file, duration
Enrollment data: user-course relationships, progress tracking
Video content: uploaded by teachers, streamed to students

Data Storage

Data will be saved in PostgreSQL databases:
User Database: users, enrollments, lesson progress
Course Database: courses, lessons

Video files will be stored in cloud storage (Cloudflare R2 or AWS S3).

Key Fields, Identifiers, Formats, and Units

User ID: UUID (primary key)
Email: VARCHAR(255), unique, format validation
Password: VARCHAR(255) for bcrypt hash
Role: ENUM (admin, teacher, student)
Course ID: UUID (primary key)
Lesson ID: UUID (primary key)
Video Duration: INTEGER (seconds)
Progress: INTEGER (percentage 0-100)
Timestamps: TIMESTAMP with timezone

External Dependencies

Cloud Storage: Cloudflare R2 or AWS S3 for video storage
Libraries: bcrypt for password hashing, jsonwebtoken for JWT
Node.js: Express framework for API

Data Validity, Privacy, Authorization, and Secure-Storage Concerns

Validity:
Email format validation before storage
Password strength requirements (minimum 8 characters)
Input sanitization to prevent SQL injection

Privacy:
Passwords hashed using bcrypt before storage
Email addresses not exposed in public listings
Personal data only accessible to authenticated users with appropriate permissions

Authorization:
JWT tokens include role claims for access control
Students can only view enrolled courses
Teachers can only modify their own courses
Admins have full access to all data

Secure Storage:
Database credentials stored in environment variables
HTTPS required for all API communications
Video URLs signed with temporary access tokens

6. Task 3.6 — Justify Technology and Architecture Decisions

Table D — Architecture Decision Records (ADR-style)

Decision   Student response
ADR-01
Issue      Database selection for storing users, courses, and enrollment data
Selected   PostgreSQL
Alternative MongoDB
Reason     PostgreSQL provides ACID compliance ensuring data integrity for critical operations like enrollments. The relational model naturally represents the many-to-many relationships between students and courses. PostgreSQL has a mature ecosystem with strong community support and extensive documentation. MongoDB would offer schema flexibility but requires more application-level validation for critical data.
Reference  https://www.postgresql.org/about/

ADR-02
Issue      Frontend framework choice for user interface
Selected   React
Alternative Vue.js
Reason     React offers a larger ecosystem of libraries and components, better suited for complex multi-role interfaces. The component-based architecture promotes code reusability. React has more learning resources and better alignment with industry job markets. Vue.js offers simpler learning curve but React's ecosystem makes it the preferred choice.
Reference  https://react.dev/

7. Task 3.7 — Design Walkthrough, Risks and Week 4 Prototype Plan

Normal Scenario Walkthrough

1. Student opens course catalog in Web Frontend
2. Frontend sends GET request to /api/courses
3. API Backend queries Course Database for course list
4. API returns course data to Frontend
5. Frontend displays course catalog
6. Student clicks "Enroll" on a course
7. Frontend sends POST request with JWT token
8. API validates token via Authentication Service
9. API checks User Database for existing enrollment
10. API creates enrollment record
11. API returns success response
12. Frontend updates UI to show enrolled status

Error Scenario Walkthrough

1. Student attempts to enroll in a course
2. Network connection fails between Frontend and API
3. Frontend displays network error message to user
4. Student can retry enrollment when connection is restored
5. No partial enrollment data is created in database
6. System remains in consistent state

Table E — Design Risk and Mitigation

Risk    Potential impact                                                         Mitigation / verification
R1      Video streaming performance issues under high load                      Use CDN for video delivery, implement adaptive bitrate streaming, test with concurrent users during Week 6
R2      Database performance degradation as course catalog grows                Implement proper indexing on frequently queried fields, use connection pooling, add database monitoring, performance test with large datasets

Week 4 Prototype Plan

In Week 4, I will demonstrate user registration and login functionality, where user input passes through the Web Frontend to the REST API Backend and Authentication Service to produce a successful login with JWT token generation. Terminal output showing successful API responses and database user record creation will prove it worked.

Expected evidence: Screenshot of successful login with JWT token in terminal, database query showing new user record, and web interface displaying authenticated user session.

8. Task 3.8 — Update GitHub and the Graduation Project Report

8.1 GitHub Evidence

Repository structure:
skillstream-learning-platform/
README.md
docs/
  design/
    architecture-decisions.md
    architecture-diagram.md
    data-specification.md
  weekly-progress/
    week03.md
  project-report-week3.md
  week3-system-design.md

Commit: docs/week3-architecture - "docs: add architecture and component interfaces for Week 3"

Branch: docs/week3-architecture

8.2 Graduation Project Report Update

The following sections have been added or updated in the project report:

1. Methodology: Proposed layered architecture approach with separation of concerns
2. Proposed System: System goals, users, main functions, and boundaries
3. System Architecture: Architecture diagram, component responsibilities, and complete data flow
4. Technology Selection: PostgreSQL and React justifications with references
5. Design Decisions: Trade-offs, known limitations, and risk mitigations

9. Task 3.9 — Weekly Progress Log and Supervisor Questions

Table F — Week 3 Progress Record

Field                       Student response
Tasks planned and completed Reviewed Week 2 requirements and identified design drivers
                            Identified main system components and their responsibilities
                            Created high-level architecture diagram with component boundaries
                            Documented one complete data flow (student enrollment scenario)
                            Designed data storage and integration approach
                            Justified technology decisions with ADR-style records
                            Identified design risks and mitigation strategies
                            Planned Week 4 prototype
New diagrams / files        docs/design/architecture-decisions.md (Tables A, B, C, D, E)
                            docs/design/architecture-diagram.md (Architecture diagram)
                            docs/design/data-specification.md (Database schema and API specs)
                            docs/weekly-progress/week03.md (Progress log)
                            docs/project-report-week3.md (Updated report)
                            docs/week3-system-design.md (System design section)
GitHub commit links         Commit: 2df8540 on branch docs/week3-architecture
Technical problems found    No significant technical problems encountered during design phase
Solutions considered        Evaluated MongoDB vs PostgreSQL for database
                            Evaluated Vue.js vs React for frontend
                            Considered different video storage options (Cloudflare R2, AWS S3)
References consulted        PostgreSQL official documentation
                            React official documentation
                            REST API design best practices
Report sections updated     Methodology section
                            System Architecture section
                            Technology Selection section
                            Design Decisions section
Week 4 prototype objective  Demonstrate user registration and login functionality with JWT token generation and database user record creation

Supervisor Question Preparation

1. Why did you divide your system into these particular components?
   Separation of concerns: Frontend handles UI, Backend handles business logic, Database handles persistence. This allows independent scaling, easier testing, and clearer maintenance boundaries.

2. Explain every arrow in your main architecture diagram.
   Web Frontend to API: HTTP requests with JWT tokens for authentication. API to Authentication Service: Token validation and session management. API to User Database: Read/write operations for user data and enrollments. API to Course Database: Read operations for course catalog and metadata. API to Video Storage: Upload and streaming operations for video content.

3. Show where one Week 2 requirement is satisfied by your design.
   FR-05 (students watch video lessons and track progress) is satisfied by the Video Storage Service for streaming and User Database for progress tracking, coordinated by the REST API Backend.

4. Why did you select your technology instead of the alternative?
   PostgreSQL over MongoDB: ACID compliance and relational integrity for enrollment relationships. React over Vue.js: Larger ecosystem and better component reusability for complex multi-role interfaces.

5. What is the greatest technical risk? What will you verify first in Week 4?
   Greatest risk: Video streaming performance under high load. Week 4 verification: User registration and login with JWT authentication to establish core authentication foundation.

6. Which GitHub changes and report pages prove what you completed this week?
   GitHub: New files in docs/design/ and docs/weekly-progress/ directories on branch docs/week3-architecture. Report: Updated System Architecture, Technology Selection, and Design Decisions sections in project-report-week3.md.

10. Week 3 — Required Submission Checklist

Student-created high-level architecture diagram with explained, labeled connections
Technology decisions and justified choices (two ADR-style records)
Updated Methodology / Proposed System / System Design sections in the Graduation Project Report
Updated GitHub repository with diagrams, source files and meaningful commit evidence
Requirements-to-architecture mapping (expanded Table A)
Component responsibility sheet and one end-to-end flow (expanded Tables B and C)
Relevant detail diagram / data specification (data-specification.md with database schema and API endpoints)
Two design risks and a small Week 4 prototype acceptance goal (expanded Table E)
Week 3 progress log, reference list, and evidence links (expanded Table F)

Submission Organization

graduation-report-week3.pdf - the cumulative report with the Week 3 sections updated
docs/design/ - architecture diagrams and data specifications
docs/weekly-progress/week03.md - task record and evidence URLs
GitHub URL: https://github.com/munthermohammed064-pixel/skillstream-learning-platform
Commit: 2df8540 on branch docs/week3-architecture

References

PostgreSQL Documentation: https://www.postgresql.org/about/
React Documentation: https://react.dev/
REST API Design Best Practices: https://restfulapi.net/
JWT Authentication: https://jwt.io/
Cloudflare R2 Documentation: https://developers.cloudflare.com/r2/

End of Week 3 Assignment