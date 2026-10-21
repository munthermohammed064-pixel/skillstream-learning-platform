# Week 3 Progress Log

## Table F - Week 3 Progress Record

| Field | Student response |
|-------|------------------|
| Tasks planned and completed | - Reviewed Week 2 requirements and identified design drivers<br>- Identified main system components and their responsibilities<br>- Created high-level architecture diagram with component boundaries<br>- Documented one complete data flow (student enrollment scenario)<br>- Designed data storage and integration approach<br>- Justified technology decisions with ADR-style records<br>- Identified design risks and mitigation strategies<br>- Planned Week 4 prototype |
| New diagrams / files | - docs/design/architecture-decisions.md (Tables A, B, C, D, E)<br>- docs/design/architecture-diagram.md (Mermaid architecture diagram)<br>- docs/weekly-progress/week03.md (this file) |
| GitHub commit links or hashes | To be added after committing changes |
| Technical problems found | No significant technical problems encountered during design phase |
| Solutions considered | - Considered MongoDB vs PostgreSQL for database<br>- Considered Vue.js vs React for frontend<br>- Evaluated different video storage options (Cloudflare R2, AWS S3) |
| References consulted | - PostgreSQL official documentation<br>- React official documentation<br>- Mermaid diagram syntax reference |
| Report sections updated | - Methodology section (to be updated in main report)<br>- System Architecture section (to be updated in main report)<br>- Technology Selection section (to be updated in main report) |
| Week 4 prototype objective | Demonstrate user registration and login functionality with JWT token generation and database user record creation |

## Design Walkthrough Summary

### Normal Scenario (Student Enrollment)
1. Student browses course catalog in Web Frontend
2. Student clicks "Enroll" on a course
3. Frontend sends POST request to REST API Backend with JWT token
4. API validates token via Authentication Service
5. API checks User Database for existing enrollment
6. If not enrolled, API creates enrollment record
7. API returns success response to Frontend
8. Frontend updates UI to show enrolled status

### Error Scenario (Network Failure)
1. Student attempts to enroll
2. Network connection fails between Frontend and API
3. Frontend displays network error message
4. Student can retry enrollment when connection is restored
5. No partial enrollment data is created in database

## Supervisor Question Preparation

1. **Why did you divide your system into these particular components?**
   - Separation of concerns: Frontend handles UI, Backend handles business logic, Database handles persistence
   - Scalability: Each component can be scaled independently
   - Maintainability: Clear boundaries make the system easier to understand and modify

2. **Explain every arrow in your main architecture diagram.**
   - Web Frontend to API: HTTP requests with JWT tokens for authentication
   - API to Authentication Service: Token validation and session management
   - API to User Database: Read/write operations for user data and enrollments
   - API to Course Database: Read operations for course catalog and metadata
   - API to Video Storage: Upload and streaming operations for video content

3. **Show where one Week 2 requirement is satisfied by your design.**
   - FR-05 (students watch video lessons and track progress) is satisfied by the Video Storage Service for streaming and User Database for progress tracking, coordinated by the REST API Backend

4. **Why did you select your technology instead of the alternative?**
   - PostgreSQL over MongoDB: ACID compliance and relational integrity for enrollment relationships
   - React over Vue.js: Larger ecosystem and better component reusability for complex multi-role interfaces

5. **What is the greatest technical risk? What will you verify first in Week 4?**
   - Greatest risk: Video streaming performance under high load
   - Week 4 verification: User registration and login with JWT authentication to establish core authentication foundation

6. **Which GitHub changes and report pages prove what you completed this week?**
   - GitHub: New files in docs/design/ and docs/weekly-progress/ directories
   - Report: Updated System Architecture, Technology Selection, and Design Decisions sections