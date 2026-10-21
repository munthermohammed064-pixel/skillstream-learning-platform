# SkillStream System Design - Week 3

## 5. Methodology

The proposed engineering approach follows a layered architecture pattern with clear separation between presentation, business logic, and data layers. This approach fits the problem because:

- The three user roles (Admin, Teacher, Student) require different interfaces and permissions, which a layered architecture can cleanly separate
- Course content management needs robust data persistence and retrieval, which is handled by the dedicated data layer
- Video streaming requires specialized external service integration, which can be abstracted behind the API layer
- This architecture allows independent development and testing of each component

## 6. Proposed System

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

## 7. System Architecture

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

### Technology Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **Video Storage**: Cloud storage service (Cloudflare R2 or AWS S3)
- **API Protocol**: REST over HTTPS

## 8. Technology Selection

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

## 9. Design Decisions

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

## 10. Week 4 Prototype Plan

**Objective**: Demonstrate user registration and login functionality

**Expected Flow**: User input passes through Web Frontend to REST API Backend and Authentication Service to produce successful login with JWT token generation.

**Verification Evidence**: Terminal output showing successful API responses and database user record creation.