# VidyaLoop — School Management Platform

Multi-tenant school ERP built with React, Express, Prisma, and MongoDB.

## Quick Start

```bash
# Backend
cd backend
npm install
npx prisma db push
npm run seed
NODE_ENV=development node src/server.js

# Frontend
cd frontend
npm install
npm start
```

## Default Credentials

| Role | Identifier | Password |
|------|-----------|----------|
| Super Admin | `superadmin@vidyaloop.in` | `Super@1234` |
| School Admin | `admin@vidyaloop.in` | `Admin@1234` |
| Teacher | `vls-101` | `VLS-101@1234` |

## Testing

See [TEST_GUIDE.md](./TEST_GUIDE.md) for full test procedures covering login, forced password change, RBAC, payroll, certificates, fees, and more.

## Project Structure

```
backend/
  src/
    modules/       # Auth, Students, Staff, Attendance, Examination, etc.
    middleware/     # Auth, RBAC, validation, error handling
    config/        # Environment, CORS
  prisma/          # Schema, migrations, seed
frontend/
  src/
    pages/         # Dashboard, Students, Staff, Payroll, Fees, etc.
    components/    # Layout, auth gates, UI primitives
    lib/           # API client, auth context, queries
```

## Key Features

- Multi-tenant with school-scoped data isolation
- Role-based access: `superAdmin`, `schoolAdmin`, `staff`, `parent`
- 13 staff duties (teacher, principal, accountant, etc.)
- Forced password change on first login
- Staff archival (never hard-delete)
- SuperAdmin privacy wall (aggregate-only platform view)
- Full audit trail for privileged actions
