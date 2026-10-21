# SkillStream: Multi-Role Online Learning Platform
### Project Report - Week 1, Week 2 & Week 3

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

## 5. Methodology (Week 3)

The proposed engineering approach follows a layered architecture pattern with clear separation between presentation, business logic, and data layers. This approach fits the problem because:

- The three user roles (Admin, Teacher, Student) require different interfaces and permissions, which a layered architecture can cleanly separate
- Course content management needs robust data persistence and retrieval, which is handled by the dedicated data layer
- Video streaming requires specialized external service integration, which can be abstracted behind the API layer
- This architecture allows independent development and testing of each component

---

## 6. Proposed System (Week 3)

### System Goals
- Provide role-based access control for Admin, Teacher, and Student users
- Enable teachers to independently create and manage course content
- Allow students to discover, enroll in, and complete courses
- Ensure system performance and security for all user interactions

### Users
- **Admin**: Manages platform users and moderates course content
- **Teacher**: Creates, updates, and publishes courses and video lessons
- **Student**: Browses catalog, enrolls in courses, and watches lessons

### Main Functions
- User authentication and authorization
- Course creation and publishing
- Course catalog browsing and search
- Enrollment management
- Video lesson streaming
- Progress tracking

### System Boundaries
- **In scope**: User management, course management, enrollment, video delivery, progress tracking
- **Out scope**: Payment processing, live video streaming, certificate generation

---

## 7. System Architecture (Week 3)

### Architecture Overview

The system follows a three-tier architecture:

1. **Presentation Layer**: React-based web frontend providing role-specific interfaces
2. **Application Layer**: Node.js/Express REST API handling business logic and coordination
3. **Data Layer**: PostgreSQL databases for persistent storage of users, courses, and enrollments

External services include cloud-based video storage for content delivery.

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| Web Frontend | User interface for all roles, handles user interactions, displays data |
| REST API Backend | Request validation, business logic coordination, database queries |
| Authentication Service | User registration, login, session management, JWT token generation |
| User Database | Stores user accounts, profiles, roles, enrollments, and progress |
| Course Database | Stores course metadata, lesson information, and content structure |
| Video Storage Service | Stores and serves video lesson files with streaming capabilities |
| Admin Dashboard API | Provides endpoints for user management and course moderation |

### Complete Data Flow: Student Enrollment

1. **Trigger**: Student clicks "Enroll" button in Web Frontend
2. **Input**: POST request to `/api/courses/{id}/enroll` with student ID and JWT token
3. **Processing**: REST API Backend validates JWT token via Authentication Service, checks existing enrollment in User Database
4. **Storage**: If not enrolled, API creates new enrollment record in User Database
5. **Output**: API returns success response, Frontend updates UI to show enrolled status
6. **Failure handling**: If already enrolled, API returns 409 Conflict, Frontend displays appropriate message

### Architecture Diagram

**Figure 3.1**: High-level system architecture showing component boundaries and data flow

The Web Frontend sends HTTP requests with JWT tokens to the REST API Backend using RESTful API endpoints. The API Backend processes requests and coordinates with the Authentication Service for user validation, the User Database for enrollment and progress data, the Course Database for course metadata, and the Video Storage Service for content delivery. This separation was selected because it provides clear separation of concerns, enables independent scaling of components, and allows for easier testing and maintenance of individual services.

(See docs/design/architecture-diagram.md for detailed Mermaid diagram)

---

## 8. Technology Selection (Week 3)

### Database Selection: PostgreSQL

**Selected Option**: PostgreSQL
**Alternative**: MongoDB

**Justification**: PostgreSQL provides ACID compliance ensuring data integrity for critical operations like enrollments. The relational model naturally represents the many-to-many relationships between students and courses. PostgreSQL has a mature ecosystem with strong community support and extensive documentation.

**Reference**: https://www.postgresql.org/about/

### Frontend Framework: React

**Selected Option**: React
**Alternative**: Vue.js

**Justification**: React offers a larger ecosystem of libraries and components, better suited for complex multi-role interfaces. The component-based architecture promotes code reusability. React has more learning resources and better alignment with industry job markets.

**Reference**: https://react.dev/

---

## 9. Design Decisions (Week 3)

### Trade-offs

- **Complexity vs. Flexibility**: Chose a microservices-inspired architecture (separate services for authentication, course management) rather than a monolithic approach. This increases initial complexity but provides better scalability and maintainability.
- **Performance vs. Cost**: Cloud-based video storage provides better performance and scalability than local storage but introduces ongoing costs. This trade-off is acceptable given the expected user growth.

### Known Limitations

- No live video streaming capability in current scope
- No payment gateway integration
- Single-region deployment (no multi-region redundancy)
- No offline mode for students

### Risks and Mitigations

**Risk 1**: Video streaming performance degradation under high load
- **Mitigation**: Use CDN for video delivery, implement adaptive bitrate streaming, perform load testing

**Risk 2**: Database performance issues as course catalog grows
- **Mitigation**: Implement proper database indexing, use connection pooling, add monitoring and performance testing

---

## 10. Week 4 Prototype Plan (Week 3)

**Objective**: Demonstrate user registration and login functionality

**Expected Flow**: User input passes through Web Frontend to REST API Backend and Authentication Service to produce successful login with JWT token generation.

**Verification Evidence**: Terminal output showing successful API responses and database user record creation.