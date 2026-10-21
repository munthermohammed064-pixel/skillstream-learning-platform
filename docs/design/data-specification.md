# SkillStream Data Specification

## Data Dictionary

### Users Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| user_id | UUID | Unique identifier for user | Primary key, not null |
| email | VARCHAR(255) | User email address | Unique, not null |
| password_hash | VARCHAR(255) | Hashed password | Not null |
| role | ENUM | User role (admin, teacher, student) | Not null |
| first_name | VARCHAR(100) | User first name | Not null |
| last_name | VARCHAR(100) | User last name | Not null |
| created_at | TIMESTAMP | Account creation timestamp | Not null, default now() |
| updated_at | TIMESTAMP | Last update timestamp | Not null, default now() |

### Courses Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| course_id | UUID | Unique identifier for course | Primary key, not null |
| teacher_id | UUID | Reference to teacher who created course | Foreign key to users, not null |
| title | VARCHAR(255) | Course title | Not null |
| description | TEXT | Course description | Not null |
| category | VARCHAR(100) | Course category | Not null |
| price | DECIMAL(10,2) | Course price | Not null, default 0.00 |
| status | ENUM | Course status (draft, published, archived) | Not null, default 'draft' |
| created_at | TIMESTAMP | Course creation timestamp | Not null, default now() |
| updated_at | TIMESTAMP | Last update timestamp | Not null, default now() |

### Lessons Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| lesson_id | UUID | Unique identifier for lesson | Primary key, not null |
| course_id | UUID | Reference to parent course | Foreign key to courses, not null |
| title | VARCHAR(255) | Lesson title | Not null |
| description | TEXT | Lesson description | Nullable |
| video_url | VARCHAR(500) | URL to video file | Not null |
| duration_seconds | INTEGER | Video duration in seconds | Not null |
| order_index | INTEGER | Lesson order within course | Not null |
| created_at | TIMESTAMP | Lesson creation timestamp | Not null, default now() |
| updated_at | TIMESTAMP | Last update timestamp | Not null, default now() |

### Enrollments Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| enrollment_id | UUID | Unique identifier for enrollment | Primary key, not null |
| user_id | UUID | Reference to enrolled student | Foreign key to users, not null |
| course_id | UUID | Reference to enrolled course | Foreign key to courses, not null |
| enrolled_at | TIMESTAMP | Enrollment timestamp | Not null, default now() |
| progress_percent | INTEGER | Course completion percentage | Not null, default 0 |
| completed_at | TIMESTAMP | Course completion timestamp | Nullable |

### Lesson Progress Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| progress_id | UUID | Unique identifier for progress record | Primary key, not null |
| enrollment_id | UUID | Reference to enrollment | Foreign key to enrollments, not null |
| lesson_id | UUID | Reference to lesson | Foreign key to lessons, not null |
| completed | BOOLEAN | Whether lesson is completed | Not null, default false |
| last_watched_position | INTEGER | Last video position in seconds | Not null, default 0 |
| watched_at | TIMESTAMP | Last watch timestamp | Not null, default now() |

## API Interface Specification

### Authentication Endpoints

#### POST /api/auth/register
**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "role": "student",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (201 Created):
```json
{
  "user_id": "uuid-here",
  "email": "student@example.com",
  "role": "student",
  "token": "jwt-token-here"
}
```

#### POST /api/auth/login
**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "user_id": "uuid-here",
  "email": "student@example.com",
  "role": "student",
  "token": "jwt-token-here"
}
```

### Course Endpoints

#### GET /api/courses
**Response** (200 OK):
```json
{
  "courses": [
    {
      "course_id": "uuid-here",
      "title": "Introduction to Programming",
      "description": "Learn programming basics",
      "category": "Programming",
      "teacher_name": "Jane Smith"
    }
  ]
}
```

#### POST /api/courses/{course_id}/enroll
**Headers**: `Authorization: Bearer jwt-token-here`

**Response** (201 Created):
```json
{
  "enrollment_id": "uuid-here",
  "course_id": "uuid-here",
  "enrolled_at": "2026-10-21T10:00:00Z"
}
```

## Data Validity and Privacy

### Validity Concerns
- Email format validation before storage
- Password strength requirements (minimum 8 characters, mix of letters and numbers)
- Course title and description length limits
- Video URL format validation

### Privacy Concerns
- Passwords are hashed using bcrypt or argon2 before storage
- User email addresses are not exposed in public course listings
- Personal information (names, emails) is only accessible to authenticated users with appropriate permissions
- Video content is access-controlled based on enrollment status

### Authorization Requirements
- Students can only view courses they are enrolled in
- Teachers can only modify courses they created
- Admins can view and modify all users and courses
- JWT tokens include role claims for authorization decisions

## Integration Points

### External Video Storage
- Video files are stored in cloud storage (Cloudflare R2 or AWS S3)
- Video URLs are stored in database lessons table
- Streaming is handled by cloud storage service
- Video upload requires teacher authentication

### Database Connection
- PostgreSQL connection pool configured in backend
- Environment variables for database credentials
- Migration scripts for schema versioning
- Backup strategy for data recovery