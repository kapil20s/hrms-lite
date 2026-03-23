# HRMS Lite — Human Resource Management System

A full-stack web application for managing employees and tracking daily attendance, built with React and FastAPI.

![Dashboard](screenshots/dashboard.png)

## Live Demo

- **Frontend**: [https://hrms-lite-psi-navy.vercel.app](https://hrms-lite-psi-navy.vercel.app)
- **Backend API**: [https://hrms-lite-api-9rhx.onrender.com](https://hrms-lite-api-9rhx.onrender.com)

## Features

### Employee Management
- Create, read, update, and delete employees
- Search employees by name or email
- Filter by department
- Duplicate email detection with meaningful error messages

### Attendance Tracking
- Mark daily attendance (present/absent) per employee
- Bulk mark all employees present or absent
- Date picker navigation for any date
- Summary view with attendance percentage per employee

### Dashboard
- Real-time overview: total employees, departments, today's attendance
- Attendance rate calculation
- Department breakdown with per-department stats
- Auto-refreshes every 30 seconds

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| **State Management** | TanStack Query v5 (server state), React Hook Form + Zod (forms) |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy 2.0, Pydantic v2 |
| **Database** | PostgreSQL |
| **Deployment** | Vercel (frontend), Render (backend + PostgreSQL) |

## Project Structure

```
├── app/                    # Backend (FastAPI)
│   ├── api/v1/             # API routers (employees, attendance)
│   ├── core/               # Config (pydantic-settings)
│   ├── db/                 # Database session & engine
│   ├── models/             # SQLAlchemy models
│   ├── repositories/       # Data access layer
│   ├── schemas/            # Pydantic request/response schemas
│   └── services/           # Business logic layer
├── frontend/               # Frontend (React + Vite)
│   └── src/
│       ├── api/            # Axios client & API functions
│       ├── components/     # UI components (layout, employees, attendance, shared)
│       ├── pages/          # Page components (Dashboard, Employees, Attendance)
│       ├── types/          # TypeScript type definitions
│       └── lib/            # Utilities
├── requirements.txt        # Python dependencies
└── README.md
```

## Local Development Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (with npm)
- **PostgreSQL** (running locally or remote connection string)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hrms-lite.git
cd hrms-lite
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL:
#   DATABASE_URL=postgresql://user:password@localhost:5432/hrms_lite
#   CORS_ORIGINS=http://localhost:5173

# Create the database
createdb hrms_lite  # Or via psql: CREATE DATABASE hrms_lite;

# Start the server (tables auto-create on startup)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive Swagger documentation.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

The app is now available at `http://localhost:5173`.

## API Overview

All API endpoints are prefixed with `/api/v1` and return a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/employees` | List employees (filter: `department`, `search`) |
| `POST` | `/api/v1/employees` | Create employee |
| `GET` | `/api/v1/employees/:id` | Get employee by ID |
| `PUT` | `/api/v1/employees/:id` | Update employee |
| `DELETE` | `/api/v1/employees/:id` | Delete employee (cascades attendance) |
| `GET` | `/api/v1/employees/departments` | List unique departments |
| `GET` | `/api/v1/attendance` | List attendance (filter: `employee_id`, `date`, `month`, `year`) |
| `POST` | `/api/v1/attendance` | Mark single attendance |
| `POST` | `/api/v1/attendance/bulk` | Bulk mark attendance |
| `PUT` | `/api/v1/attendance/:id` | Update attendance record |
| `GET` | `/api/v1/attendance/summary` | Per-employee attendance summary |
| `GET` | `/api/v1/attendance/dashboard` | Dashboard statistics |

### Error Handling

All errors return structured responses with appropriate HTTP status codes:

- `400` — Bad request
- `404` — Resource not found
- `409` — Conflict (duplicate email, duplicate attendance)
- `422` — Validation error (with field-level details)
- `500` — Internal server error

## Assumptions & Design Decisions

1. **Single admin user** — No authentication/authorization required per the assignment spec. All endpoints are publicly accessible.
2. **Attendance is date-based** — One record per employee per day (enforced via unique constraint).
3. **Cascade delete** — Deleting an employee removes all their attendance records.
4. **Department as free text** — Departments are derived from employee records rather than a separate table, keeping the schema simple while still supporting filtering and grouping.
5. **Bulk attendance** — The bulk endpoint uses an upsert pattern: existing records for the same employee+date are updated rather than rejected.
6. **Tables auto-create** — On server startup, SQLAlchemy creates tables if they don't exist (`create_all`). For production, Alembic migrations are recommended.
7. **Time zone** — All dates are naive (no timezone). The frontend sends dates in `YYYY-MM-DD` format.

## Screenshots

| Dashboard | Employees | Attendance |
|-----------|-----------|------------|
| ![Dashboard](screenshots/dashboard.png) | ![Employees](screenshots/employees.png) | ![Attendance](screenshots/attendance.png) |
