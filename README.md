# Finance Dashboard API

A RESTful backend for a finance dashboard system with role-based access control, built with **Node.js**, **Express**, and **MongoDB**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Running](#setup--running)
- [Role Permissions](#role-permissions)
- [API Reference](#api-reference)
- [Design Decisions & Assumptions](#design-decisions--assumptions)

---

## Tech Stack

| Layer         | Choice             | Reason                                                   |
| ------------- | ------------------ | -------------------------------------------------------- |
| Runtime       | Node.js + Express  | Lightweight, fast, well-suited for REST APIs             |
| Database      | MongoDB + Mongoose | Flexible schema, good aggregation pipeline for analytics |
| Auth          | JWT (jsonwebtoken) | Stateless, easy to test; no session storage needed       |
| Validation    | express-validator  | Declarative, co-located with routes                      |
| Password      | bcryptjs           | Industry-standard hashing with salt rounds               |
| Rate limiting | express-rate-limit | Basic DDoS protection out of the box                     |

---

## Architecture

```
src/
├── config/
│   └── db.js                 # MongoDB connection
├── models/
│   ├── User.js               # User schema (roles, status, password hashing)
│   └── FinancialRecord.js    # Record schema (soft delete, indexes)
├── middleware/
│   ├── authenticate.js       # JWT verification → attaches req.user
│   ├── authorize.js          # RBAC guard — authorize("admin", "analyst")
│   ├── validators.js         # Input validation rules per route group
│   └── errorHandler.js       # Global error handler (normalises Mongoose errors)
├── controllers/
│   ├── authController.js     # register, login, getMe
│   ├── userController.js     # Admin user management
│   ├── recordController.js   # Financial record CRUD
│   └── dashboardController.js# Aggregation analytics
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── recordRoutes.js
│   └── dashboardRoutes.js
├── utils/
│   ├── AppError.js           # Custom error class (statusCode + isOperational)
│   ├── catchAsync.js         # Wraps async handlers — no try/catch boilerplate
│   └── seed.js               # Demo data seeder
└── server.js                 # App entry point
```

**Request lifecycle:**
`Client → Rate limiter → JSON parser → Auth middleware → RBAC middleware → Route → Controller → MongoDB → Response`

---

## Setup & Running

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Steps

```bash
# 1. Clone the repo
git clone <repo-url>
cd finance-dashboard-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET

# 4. (Optional) Seed demo data
npm run seed

# 5. Start the server
npm run dev        # development (nodemon + morgan logging)
npm start          # production
```

The API will be available at `http://localhost:3000`.

### Demo credentials (after seeding)

| Role    | Name         | Email            | Password    |
| ------- | ------------ | ---------------- | ----------- |
| Admin   | Vikram Singh | admin@demo.com   | password123 |
| Analyst | Arjun Sharma | analyst@demo.com | password123 |
| Viewer  | Vidyut Bisht | viewer@demo.com  | password123 |

---

## Role Permissions

| Action                 | Viewer | Analyst | Admin |
| ---------------------- | :----: | :-----: | :---: |
| Login / register       |   ✅   |   ✅    |  ✅   |
| View records           |   ✅   |   ✅    |  ✅   |
| View dashboard summary |   ✅   |   ✅    |  ✅   |
| View recent activity   |   ✅   |   ✅    |  ✅   |
| Category breakdown     |   ❌   |   ✅    |  ✅   |
| Trend analytics        |   ❌   |   ✅    |  ✅   |
| Create records         |   ❌   |   ✅    |  ✅   |
| Update records         |   ❌   |   ✅    |  ✅   |
| Delete records (soft)  |   ❌   |   ❌    |  ✅   |
| Manage users           |   ❌   |   ❌    |  ✅   |

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require:

```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint             | Auth | Description              |
| ------ | -------------------- | ---- | ------------------------ |
| POST   | `/api/auth/register` | No   | Register a new user      |
| POST   | `/api/auth/login`    | No   | Login and receive JWT    |
| GET    | `/api/auth/me`       | Yes  | Get current user profile |

**Register body:**

```json
{
  "name": "Rahul Verma",
  "email": "rahul@example.com",
  "password": "secret123",
  "role": "analyst"
}
```

**Login body:**

```json
{
  "email": "rahul@example.com",
  "password": "secret123"
}
```

**Login response:**

```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": { "user": { "name": "Rahul Verma", "role": "analyst", ... } }
}
```

---

### Users (Admin only)

| Method | Endpoint                | Description                                             |
| ------ | ----------------------- | ------------------------------------------------------- |
| GET    | `/api/users`            | List all users (supports `?role=&status=&page=&limit=`) |
| GET    | `/api/users/:id`        | Get user by ID                                          |
| PATCH  | `/api/users/:id/role`   | Update user role                                        |
| PATCH  | `/api/users/:id/status` | Activate or deactivate user                             |
| DELETE | `/api/users/:id`        | Delete user                                             |

---

### Financial Records

| Method | Endpoint           | Roles          | Description                              |
| ------ | ------------------ | -------------- | ---------------------------------------- |
| GET    | `/api/records`     | All            | List records with filters and pagination |
| GET    | `/api/records/:id` | All            | Get single record                        |
| POST   | `/api/records`     | Analyst, Admin | Create record                            |
| PATCH  | `/api/records/:id` | Analyst, Admin | Update record                            |
| DELETE | `/api/records/:id` | Admin          | Soft delete record                       |

**GET /api/records — query parameters:**

| Param       | Type     | Example      | Description                                               |
| ----------- | -------- | ------------ | --------------------------------------------------------- |
| `type`      | string   | `income`     | Filter by income or expense                               |
| `category`  | string   | `salary`     | Filter by category                                        |
| `startDate` | ISO date | `2024-01-01` | Filter from date                                          |
| `endDate`   | ISO date | `2024-12-31` | Filter to date                                            |
| `sort`      | string   | `-date`      | Sort field (date, amount, createdAt; prefix `-` for desc) |
| `page`      | number   | `1`          | Pagination page                                           |
| `limit`     | number   | `20`         | Items per page (max 100)                                  |

**POST /api/records body:**

```json
{
  "amount": 75000.0,
  "type": "income",
  "category": "salary",
  "date": "2024-06-01",
  "notes": "June monthly salary credit"
}
```

**Valid categories:** `salary`, `freelance`, `investment`, `rental`, `bonus`, `food`, `transport`, `utilities`, `healthcare`, `entertainment`, `education`, `shopping`, `rent`, `insurance`, `other`

---

### Dashboard

| Method | Endpoint                            | Roles          | Description                                            |
| ------ | ----------------------------------- | -------------- | ------------------------------------------------------ |
| GET    | `/api/dashboard/summary`            | All            | Total income, expenses, net balance                    |
| GET    | `/api/dashboard/recent`             | All            | Recent transactions (`?limit=10`)                      |
| GET    | `/api/dashboard/category-breakdown` | Analyst, Admin | Totals grouped by category and type                    |
| GET    | `/api/dashboard/trends`             | Analyst, Admin | Monthly or weekly trends (`?period=monthly&year=2024`) |

**GET /api/dashboard/summary response:**

```json
{
  "status": "success",
  "data": {
    "totalIncome": 450000,
    "totalExpenses": 285000,
    "netBalance": 165000,
    "incomeCount": 12,
    "expenseCount": 48,
    "avgIncome": 37500,
    "avgExpense": 5937.5
  }
}
```

**GET /api/dashboard/trends?period=monthly&year=2024 response:**

```json
{
  "status": "success",
  "data": {
    "period": "monthly",
    "year": 2024,
    "trends": [
      {
        "period": 1,
        "year": 2024,
        "type": "income",
        "total": 75000,
        "count": 2
      },
      {
        "period": 1,
        "year": 2024,
        "type": "expense",
        "total": 23000,
        "count": 8
      }
    ]
  }
}
```

---

### Error Responses

All errors follow this shape:

```json
{
  "status": "fail",
  "message": "Descriptive error message"
}
```

| Status | Meaning                         |
| ------ | ------------------------------- |
| 400    | Validation error or bad input   |
| 401    | Missing or invalid token        |
| 403    | Insufficient role permissions   |
| 404    | Resource not found              |
| 409    | Conflict (e.g. duplicate email) |
| 429    | Rate limit exceeded             |
| 500    | Internal server error           |

---

## Design Decisions & Assumptions

### Soft Delete

Records are never permanently deleted — they have an `isDeleted: boolean` field. A Mongoose pre-find hook automatically filters these out from all queries. This preserves audit history and prevents accidental data loss.

### RBAC via Middleware

Access control is enforced at the route level using a composable `authorize(...roles)` middleware. This keeps business logic in controllers clean and makes permission changes easy to audit.

### Separation of Concerns

The project follows a strict layered pattern: routes only wire paths to controllers; controllers contain business logic; models contain data logic (hooks, methods). Middleware is purely cross-cutting.

### Error Handling

A custom `AppError` class distinguishes operational errors (user-facing, e.g. "email not found") from programmer errors (bugs, logged but not exposed). Mongoose errors (duplicate key, cast errors) are normalized into `AppError` instances in the global error handler.

### JWT Stateless Auth

No session store is used. JWTs are signed with a secret and expire in 7 days. Token invalidation on logout is not implemented (out of scope for this assessment) — in production this would typically be handled with a Redis blocklist.

### Assumptions

- A single financial ledger is shared across all users (no per-user isolation of records). Admins and analysts manage records on behalf of the organization.
- The `role` field can be set at registration for simplicity. In production, new users would default to `viewer` and an admin would promote them.
- Pagination defaults to 20 items per page with a max of 100.
- Amounts are stored as plain `Number` (float). In a production finance system, integers representing the smallest currency unit (e.g. paise/cents) would be preferred to avoid floating point issues.
