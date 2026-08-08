# Vidyaloop Backend — Express + MongoDB (Prisma)

REST API for the Vidyaloop School Management Platform.

- **Runtime:** Node.js 18+ / Express 4 (plain **JavaScript**, CommonJS)
- **Database:** MongoDB via **Prisma** ORM
- **Auth:** JWT (access + refresh), bcrypt, httpOnly-friendly, refresh tokens persisted (hashed)
- **Validation:** zod
- **Multi-tenant:** every school is an isolated data scope under `schoolId`

> **Migration-ready:** the Prisma schema is written provider-agnostic so the
> project can move to PostgreSQL later — see
> [Switching to PostgreSQL](#switching-to-postgresql).

---

## Quick start

```bash
cd backend
npm install
npm run prisma:generate     # generates the Prisma client from schema.prisma
cp .env.example .env        # edit DATABASE_URL to point at your MongoDB
npm run db:setup            # `prisma db push` + seed demo data (idempotent-ish)
npm run dev                 # nodemon on http://localhost:5000/api
```

Health check: `GET /api/health`

### Seed accounts

`npm run seed` creates one demo school plus:

| Role        | Login                                        |
| ----------- | -------------------------------------------- |
| Super Admin | `superadmin@vidyaloop.in` / `Super@1234`     |
| School Admin| `admin@vidyaloop.in` / `Admin@1234`          |
| Teacher     | generated per teacher (printed on seed)      |
| Parent      | generated per student with parent contact    |

Login with either `email` or `username` in the `identifier` field.

---

## Roles (RBAC)

| Role         | Description                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| `superAdmin` | Global admin. Creates/manages **schools** and their school-admin accounts. Sees everything.                  |
| `schoolAdmin`| Runs one school. Adds/edits/deletes **staff** and **students**, sets timetables, marks attendance, resets logins. |
| `teacher`    | Views students & marks attendance, and may **edit/correct** student records (name, DOB, blood group, guardian contact). **Cannot create users/students/staff.** |
| `parent`     | Read-only. Views **only their own child** (student profile, attendance, dashboard).                           |

`requireRole()` always lets `superAdmin` through. `schoolId` scoping is applied
in the service layer for every query.

---

## API surface (all under `/api`)

### Auth
| Method | Path           | Access | Body / Notes                                        |
| ------ | -------------- | ------ | --------------------------------------------------- |
| POST   | `/auth/bootstrap` | public (only while no super admin exists) | Creates the first super admin |
| POST   | `/auth/login`  | public | `{ identifier, password }` → `{ user, accessToken, refreshToken }` |
| POST   | `/auth/refresh`| public | `{ refreshToken }`                                   |
| POST   | `/auth/logout` | any    | `{ refreshToken }` revokes the refresh token         |
| GET    | `/auth/me`     | any    | current user                                        |

### Schools (superAdmin only)
| Method | Path                 | Notes                                     |
| ------ | -------------------- | ----------------------------------------- |
| GET    | `/schools`           | list with counts                          |
| POST   | `/schools`           | create school + school-admin account, returns admin credentials |
| GET    | `/schools/:id`       |                                            |
| PUT    | `/schools/:id`       | edit profile fields                       |
| DELETE | `/schools/:id`       | cascade deletes school data               |

`POST /schools` body: `{ name, code, adminName, adminEmail, adminPassword, board?, address?, phone?, session? }`

### Students
| Method | Path                            | Access                     | Notes |
| ------ | ------------------------------- | -------------------------- | ----- |
| GET    | `/students`                     | any                        | filters: `search, cls, section, status` |
| GET    | `/students/:id`                 | any (parent: own child)    |       |
| POST   | `/students`                     | schoolAdmin                | creates parent portal login if `parentName`/`parentEmail` given |
| PUT    | `/students/:id`                 | schoolAdmin (full) or **teacher (corrections only)** |       |
| DELETE | `/students/:id`                 | schoolAdmin                |       |
| POST   | `/students/:id/reset-parent-password` | schoolAdmin         | regenerates parent password |

Teacher edits are restricted to: `name, dob, bloodGroup, emergency, address,
fatherName, fatherEmail, fatherPhone, motherName`. Structural fields
(`admNo, cls, section, roll, status`) are teacher-proof.

### Staff
| Method | Path                          | Access      | Notes |
| ------ | ----------------------------- | ----------- | ----- |
| GET    | `/staff`                      | any         | filters: `search, dept, status` |
| GET    | `/staff/:id`                  | any         |       |
| POST   | `/staff`                      | schoolAdmin | `jobTitle: "Teacher"` → teacher portal login generated |
| PUT    | `/staff/:id`                  | schoolAdmin |       |
| DELETE | `/staff/:id`                  | schoolAdmin |       |
| POST   | `/staff/:id/reset-password`   | schoolAdmin | regenerates portal password |

### Timetable
| Method | Path                | Access      | Notes |
| ------ | ------------------- | ----------- | ----- |
| GET    | `/timetable?cls=&section=` | any   | returns flat `entries` + frontend-friendly `grid` `[period][day]` |
| GET    | `/timetable/teacher?staffId=` | any   | one teacher's weekly schedule |
| POST   | `/timetable/upsert` | schoolAdmin | body `{ cls, section, entries: [{day, period, subject, room?, staffId?}] }` (upserts) |
| DELETE | `/timetable/:id`    | schoolAdmin |       |

### Attendance
| Method | Path                              | Access                   | Notes |
| ------ | --------------------------------- | ------------------------ | ----- |
| GET    | `/attendance?cls=&section=&date=` | any                      | roster with `status: null` for unmarked |
| POST   | `/attendance/mark`                | schoolAdmin, teacher     | body `{ cls, section, date, marks?: [{studentId, status: P\|A\|L}] }` — omit `marks` to mark all Present |
| GET    | `/attendance/student?studentId=&month=&year=` | any (parent: own child) | month calendar + summary % |

### Dashboard
| Method | Path         | Access | Notes |
| ------ | ------------ | ------ | ----- |
| GET    | `/dashboard` | any    | role-aware stats (super admin: school/student/staff counts; school admin: school stats; teacher: classes + marked today; parent: child + attendance) |

---

## Credential generation

- **School admin:** created when a super admin creates a school (`POST /schools`).
- **Teacher login:** created automatically when a school admin adds staff with
  `jobTitle: "Teacher"`.
- **Parent login:** created when a student is added with `parentName` /
  `parentEmail` / `parentPhone`.

Credentials are returned **once** in the create response and never stored in
plaintext. Forgotten passwords are handled via
`/students/:id/reset-parent-password` and `/staff/:id/reset-password`.

---

## Project structure

```
backend/
├─ prisma/
│  ├─ schema.prisma      # models — MongoDB provider (Postgres-ready)
│  └─ seed.js
├─ src/
│  ├─ server.js          # boot + connect + listen
│  ├─ app.js             # express wiring, routes, middleware
│  ├─ config/env.js      # validated env access
│  ├─ lib/prisma.js      # Prisma client singleton
│  ├─ lib/errors.js      # ApiError, catchAsync, notFound
│  ├─ middleware/        # auth (JWT), rbac (roles), validate (zod), errorHandler
│  ├─ utils/             # credentials + JWT helpers
│  └─ modules/           # auth, schools, students, staff, timetable, attendance, dashboard
└─ tests/                # node:test integration tests
```

Convention: `routes → controller → service → prisma`. DB access never leaks
into routes/controllers, which is what makes the provider switch cheap.

---

## Switching to PostgreSQL

1. **Install** the Postgres provider requirements (already in `package.json`):
   `npm install pg` and restart the dev server once.
2. **Update the datasource** in `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **Point `DATABASE_URL`** at your Postgres, e.g.
   `postgresql://user:pass@localhost:5432/vidyaloop`.
4. **Run the real migration engine:**
   ```bash
   npm run prisma:generate
   npx prisma migrate dev --name init_postgres
   ```
   This generates versioned SQL migrations (the thing MongoDB's connector
   doesn't have — with MongoDB you use `prisma db push` instead).
5. **Adjust a handful of annotations** that are MongoDB-specific:
   - Remove `@map("_id")` and `@db.ObjectId` on every `id` / FK field.
   - Replace `@default(auto())` with `@default(cuid())`.
   - `DateTime` fields carry over unchanged.
   - Optionally convert `role`/`status` String columns to native Postgres
     `enum`s now that the connector supports them.
6. **Re-seed** with `npm run db:setup` (or `npx prisma db seed`).

No application code changes are required — services only ever talk through the
Prisma client, and the request/response contracts are identical.

---

## Env vars

See `.env.example`. Key ones: `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `PORT`, `CORS_ORIGINS`, `SUPER_ADMIN_*`.
