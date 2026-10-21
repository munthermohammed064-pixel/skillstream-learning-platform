# SkillStream System Architecture Diagram

## High-Level Architecture (Mermaid Diagram)

```mermaid
graph TB
    subgraph "User Device"
        WEB[Web Frontend<br/>React Application]
    end

    subgraph "Server Layer"
        API[REST API Backend<br/>Node.js/Express]
        AUTH[Authentication Service]
    end

    subgraph "Data Layer"
        USER_DB[(User Database<br/>PostgreSQL)]
        COURSE_DB[(Course Database<br/>PostgreSQL)]
    end

    subgraph "External Services"
        VIDEO[Video Storage Service<br/>Cloud Storage]
    end

    WEB -->|HTTP Requests<br/>JWT Tokens| API
    API -->|Read/Write| USER_DB
    API -->|Read/Write| COURSE_DB
    API -->|Authenticate| AUTH
    API -->|Upload/Stream| VIDEO
    AUTH -->|Session Data| USER_DB

    classDef frontend fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef external fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class WEB frontend
    class API,AUTH backend
    class USER_DB,COURSE_DB database
    class VIDEO external
```

## Architecture Explanation

Figure 3.1 presents the proposed architecture for SkillStream. The Web Frontend sends HTTP requests with JWT tokens to the REST API Backend using RESTful API endpoints. The API Backend processes requests and coordinates with the Authentication Service for user validation, the User Database for enrollment and progress data, the Course Database for course metadata, and the Video Storage Service for content delivery. This separation was selected because it provides clear separation of concerns, enables independent scaling of components, and allows for easier testing and maintenance of individual services.

## Data Flow for Student Enrollment

1. **Input**: Student clicks "Enroll" button in Web Frontend
2. **Processing**: REST API Backend receives POST request, validates JWT token via Authentication Service
3. **Storage**: API checks User Database for existing enrollment, creates new enrollment record if valid
4. **Output**: API returns success response to Web Frontend, which updates UI to show enrolled status
5. **Failure handling**: If student is already enrolled, API returns 409 Conflict error, Frontend displays appropriate message

## Component Failure Handling

- If the Web Frontend fails to connect to the API Backend, it displays a network error message and allows retry
- If the Authentication Service is unavailable, the API Backend returns 503 Service Unavailable, prompting the user to try again later
- If the Database is unreachable, the API Backend returns 503 Service Unavailable and logs the error for admin investigation
- If the Video Storage Service fails, the system displays a placeholder message and allows the student to proceed with other course content