# VidyaLoop — Test Guide

Complete manual testing procedures for the VidyaLoop school management platform.

Tests are organized in phases that mirror a real deployment: clean database → platform setup → feature testing → multi-session & responsiveness.

---

## Setup

### Start Services

```bash
# Terminal 1 — Backend
cd backend
set NODE_ENV=development
node src/server.js

# Terminal 2 — Frontend
cd frontend
npm start
```

### Reset to Clean State (optional)

To test from scratch with only the super admin account:

```bash
cd backend
npx prisma db push --force-reset
node scripts/ensure-indexes.js
# Do NOT run npm run seed — this keeps the DB clean
```

The only account that exists after a reset is the super admin (created on first boot):
- **Email:** `superadmin@vidyaloop.in`
- **Password:** `Super@1234`

### Seeded State (full data)

If you want pre-loaded schools, staff, students, and parent accounts:

```bash
cd backend
npm run seed
```

This creates 3 schools (VLPS, SXIS, DPA) with staff, students, and parent logins. See `prisma/seed.js` for the full credential list.

---

## Phase 1: Clean State — Super Admin Only

No schools exist. No staff. No students. Only the super admin account.

### 1.1 Super Admin Login

**Browser:** Chrome

1. Open `http://localhost:3000`
2. Login with `superadmin@vidyaloop.in` / `Super@1234`
3. Verify: lands on dashboard

**Verify:**
- Dashboard shows aggregate stats (0 schools, 0 students, 0 staff)
- Sidebar shows: Dashboard, Schools, Support Console
- Sidebar does NOT show: Students, Staff, Attendance, Payroll, etc.

### 1.2 Super Admin Cannot Access School Data

**Browser:** Chrome

1. While logged in as super admin, try navigating to `/students` via URL bar
2. Try navigating to `/staff` via URL bar
3. Try navigating to `/attendance` via URL bar

**Verify:**
- All return 403 or redirect — super admin cannot see per-school data
- Error message: "Platform accounts may not access school-level data"

### 1.3 Create First School

**Browser:** Chrome (super admin session)

1. Go to **Schools** page
2. Click **Add School**
3. Fill form: name, code (e.g. `TEST`), board, address, session
4. Submit

**Verify:**
- School appears in the schools list
- A school admin account is auto-created (check console/network for credentials)
- Dashboard stats update: 1 school

### 1.4 Support Console — Empty State

**Browser:** Chrome (super admin session)

1. Go to **Support Console**
2. Verify: platform stats show 1 school, 0 students, 0 staff
3. Click the school in the table → school profile modal opens
4. Verify: shows school name, code, board, 0 students, 0 staff
5. Use Student Lookup: enter school code + any email → "No student found"

---

## Phase 2: School Setup (First School Admin)

### 2.1 School Admin Login

**Browser:** Chrome (new incognito window or logout)

1. Login with the school admin credentials from Phase 1.3
2. Verify: lands on admin dashboard
3. Verify sidebar shows: Students, Staff, Timetable, Attendance, Examination, Fees, Admissions, Payroll, etc.

### 2.2 Create Staff

**Browser:** Chrome (school admin session)

1. Go to **Staff** → Click **Add Staff**
2. Create a teacher: fill name, staff ID, job title, department, subject
3. Submit
4. Create a second staff member: accountant (job title: Accountant)

**Verify:**
- Both staff appear in the staff list
- Staff list shows name, staff ID, job title, department, status (Active)

### 2.3 Create Students

**Browser:** Chrome (school admin session)

1. Go to **Students** → Click **Add Student**
2. Create 3 students in Class 8-A with different names
3. Create 1 student in Class 9-B

**Verify:**
- Students appear in the list
- Filtering by class/section works
- Student count updates on dashboard

### 2.4 Create Admission Inquiry & Enroll

**Browser:** Chrome (school admin session)

1. Go to **Admissions** → Click **New Inquiry**
2. Fill: name "Test Enroll Kid", class "8", parent name, phone, email
3. Submit → inquiry appears in the pipeline
4. Click **Enroll** on the inquiry → pick section A → Confirm

**Verify:**
- Inquiry moves to "Enrolled" stage
- Network tab shows response with `student.admNo` and `parentAccount.username` + `parentAccount.tempPassword`
- New student appears in Students list
- Parent account is created with `mustChangePassword: true`

---

## Phase 3: Forced Password Change Lifecycle

### 3.1 Parent First Login — Password Gate

**Browser:** Firefox (separate from admin session)

1. Logout any active session
2. Login with the parent credentials from Phase 2.4
3. **Expected:** full-screen "Change Your Password" gate appears
4. Try navigating to `/dashboard` via URL bar

**Verify:**
- Cannot access any page — password gate blocks everything
- URL changes back to gate or shows 403

### 3.2 Change Password

**Browser:** Firefox (password gate screen)

1. Enter current (temp) password
2. Enter new password (min 8 chars)
3. Click **Change Password**

**Verify:**
- Success message appears
- User is redirected to parent dashboard
- Dashboard shows child's name and info

### 3.3 Login with New Password

**Browser:** Firefox

1. Logout
2. Login with same parent username + NEW password
3. Verify: lands on parent dashboard normally (no password gate)

---

## Phase 4: Feature Tests — Academics

### 4.1 Attendance

**Browser A:** Chrome (school admin)
**Browser B:** Firefox (teacher — login as the teacher created in Phase 2.2)

**Admin flow (Chrome):**
1. Go to **Attendance**
2. Select Class 8, Section A, today's date
3. Mark a few students Present, one Absent
4. Submit

**Teacher flow (Firefox):**
1. Go to **Attendance**
2. Select same class/section/date
3. Verify: previously marked attendance is visible
4. Try changing a marked student's status

**Verify:**
- Both sessions see the same attendance data
- Attendance persists after page refresh
- Teacher can mark attendance for their class

**Responsiveness:**
- Resize Chrome to mobile width (< 768px)
- Verify: roster switches to card layout, mark buttons are touch-friendly

### 4.2 Timetable

**Browser:** Chrome (school admin)

1. Go to **Timetable**
2. Select Class 8, Section A
3. Add a slot: Monday Period 1, subject "Mathematics", assign teacher
4. Save

**Verify:**
- Timetable grid shows the slot
- Refresh page — slot persists
- Teacher sees the same slot on their timetable view

**Multi-school check:**
- Switch school scope to a different school (if multiple schools exist)
- Verify: timetable for the other school is empty (no cross-school leak)

### 4.3 Examination

**Browser:** Chrome (school admin or teacher with examCoordinator duty)

1. Go to **Examination**
2. Select Class 8, Section A
3. Enter marks for a student in a subject
4. Save marks

**Verify:**
- Marks appear in the roster
- Navigate to another student — marks persist
- Report card view shows grades

**Parent view (Firefox):**
1. Login as parent
2. Go to Student Profile → Academic Records tab
3. Verify: can see the marks entered by the teacher

### 4.4 Digital Diary (Mock — No Backend)

**Browser:** Chrome (teacher)

1. Go to **Digital Diary**
2. Verify: page loads with hardcoded entries
3. Note: data resets on page refresh (no backend yet)

---

## Phase 5: Feature Tests — Operations

### 5.1 Fees

**Browser:** Chrome (school admin)

1. Go to **Fees**
2. Verify: stat cards show Total Collected, Total Due, Overdue Count
3. Verify: fee records load from the finance API (not hardcoded)
4. If no records exist, verify: empty state message appears

**Responsiveness:**
- Resize to mobile — verify: table switches to card layout

### 5.2 Payroll

**Browser:** Chrome (school admin)

1. Go to **Payroll**
2. Verify: staff members from the school appear
3. Click **Configure Salary** on a row
4. Edit basic salary, allowances, deductions → Save
5. Click **Run Payroll** → pick month → Confirm

**Verify:**
- Salary configuration updates the row
- Payroll run marks records as PAID
- Payslip modal shows correct breakdown

### 5.3 Certificates

**Browser A:** Chrome (school admin)
**Browser B:** Firefox (parent)

**Admin flow (Chrome):**
1. Go to **Certificates** → Click **Issue New Certificate**
2. Fill: student name, type "Transfer Certificate", reason
3. Issue → verify it appears with status ISSUED and a serial number

**Parent flow (Firefox):**
1. Login as parent → Go to **Certificates**
2. Click **Request Certificate** → fill form → Submit
3. Verify: appears with status REQUESTED (no serial number)

**Cross-check (Chrome):**
1. Refresh certificates list as admin
2. Verify: the parent's REQUESTED certificate appears in the list

### 5.4 Leave

**Browser A:** Chrome (school admin)
**Browser B:** Firefox (teacher)

**Teacher flow (Firefox):**
1. Go to **Leave** → Click **Apply Leave**
2. Fill: type, dates, reason → Submit
3. Verify: leave request appears with status PENDING

**Admin flow (Chrome):**
1. Go to **Leave**
2. Verify: the teacher's leave request appears
3. Click **Approve** → confirm

**Verify (Firefox):**
1. Teacher refreshes → status changed to APPROVED
2. Teacher tries to approve someone else's leave → 403 error

**Concurrent test:**
- Both browsers on the Leave page at the same time
- Admin approves in Chrome
- Teacher refreshes in Firefox — status updates

### 5.5 Communication (Notices)

**Browser:** Chrome (school admin)

1. Go to **Communication**
2. Create a notice: title, body, target audience
3. Submit

**Verify:**
- Notice appears in the list
- Refresh — persists
- If parent view exists, parent sees the notice

### 5.6 Income & Expense

**Browser:** Chrome (school admin)

1. Go to **Income & Expense**
2. Add an income record: category, amount, date, payment method
3. Add an expense record
4. Verify: both appear in the list

---

## Phase 6: Feature Tests — Student Lifecycle

### 6.1 Student Profile

**Browser:** Chrome (school admin)

1. Go to **Students** → click on any student
2. **Overview tab:** verify personal details, parent info
3. **Attendance tab:** verify calendar view loads (may be empty if no attendance marked)
4. **Fee History tab:** verify fee records from finance API (or empty state)
5. **Academic Records tab:** verify marks/report card loads

### 6.2 Staff Profile

**Browser:** Chrome (school admin)

1. Go to **Staff** → click on any staff member
2. Verify: profile shows name, designation, department
3. If timetable exists for this teacher, verify: timetable tab shows slots

### 6.3 Staff Archive (Not Delete)

**Browser:** Chrome (school admin)

1. Go to **Staff** → click delete/deactivate on a staff member
2. Confirm the action

**Verify:**
- Staff member status changes to "Inactive" (not removed)
- Staff member's login is deactivated (try logging in as them → fails)
- Staff still appears in historical records (timetable, attendance)

---

## Phase 7: Multi-Session Testing

### 7.1 Two Admins, Same School

**Browser A:** Chrome (school admin)
**Browser B:** Edge (same school admin, different session)

1. Both logged in as the same school admin
2. Chrome: create a student
3. Edge: refresh students list

**Verify:**
- Edge sees the new student immediately
- No stale data issues

### 7.2 Admin + Teacher, Simultaneous

**Browser A:** Chrome (school admin)
**Browser B:** Firefox (teacher)

1. Chrome: mark attendance for Class 8-A
2. Firefox: teacher views same class attendance

**Verify:**
- Teacher sees the updated attendance
- No race conditions

### 7.3 Admin + Parent, Simultaneous

**Browser A:** Chrome (school admin — entering exam marks)
**Browser B:** Firefox (parent — checking student profile)

1. Chrome: enter marks for a student
2. Firefox: parent refreshes Academic Records tab

**Verify:**
- Parent sees the newly entered marks (or on next refresh)
- No data leakage between schools

### 7.4 Session Revocation

**Browser A:** Chrome (staff member)
**Browser B:** Chrome (admin)

1. Staff is logged in (Browser A)
2. Admin deactivates that staff (Browser B)
3. Staff tries to navigate to any page (Browser A)

**Verify:**
- Staff gets 401 → redirected to login
- Staff cannot access any page

---

## Phase 8: Responsiveness Testing

Test every page at these breakpoints:
- **Desktop:** > 1024px
- **Tablet:** 768px – 1024px
- **Mobile:** < 768px

Use Chrome DevTools device toolbar (F12 → toggle device toolbar).

### 8.1 Pages to Test

| Page | Desktop Check | Mobile Check |
|------|--------------|-------------|
| Login | Centered card, full width | Card fills screen, inputs tappable |
| Dashboard | 4-column stat grid | Stacked cards, scrollable |
| Students list | Full table | Card-based list |
| Student Profile | Side-by-side tabs | Stacked tabs, scrollable |
| Attendance roster | Full table | Card list with mark buttons |
| Timetable | Grid layout | Scrollable grid or list |
| Payroll table | Full table | Card-based list |
| Fees table | Full table | Card-based list |
| Certificates table | Full table | Card-based list |
| Admissions kanban | Multi-column board | Stacked columns |
| Leave list | Full table | Card-based list |
| Sidebar | Always visible | Hamburger menu, slide-in |

### 8.2 Touch Targets

On mobile (< 768px):
- All buttons are at least 44x44px touch targets
- No overlapping clickable elements
- Form inputs are large enough to tap
- Modals/dialogs fill the screen appropriately

### 8.3 Navigation

On mobile:
- Sidebar collapses to hamburger menu
- Tap hamburger → sidebar slides in
- Tap a nav item → sidebar closes, page loads
- Tap outside sidebar → sidebar closes

---

## Phase 9: Error States & Edge Cases

### 9.1 Invalid Login

1. Go to login page
2. Enter wrong password → verify: error message "Invalid credentials"
3. Enter non-existent email → verify: same error (no user enumeration)

### 9.2 Empty States

Test each page with no data:
- Students list (no students) → "No students found" message
- Staff list (no staff) → "No staff found" message
- Fees (no records) → "No fee records found" message
- Certificates (none issued) → "No certificates found" message
- Leave (no requests) → empty state message

### 9.3 Form Validation

**Student create form:**
- Submit with empty required fields → validation errors
- Enter invalid phone format → error
- Enter duplicate admission number → 409 error

**Leave apply form:**
- End date before start date → validation error
- Submit without reason → error

### 9.4 Malformed JSON

```bash
curl -X POST http://localhost:5000/api/admissions \
  -H "Content-Type: application/json" \
  -d '{"name": "broken'
```

**Verify:** returns 400 "Invalid JSON body" (not 500)

### 9.5 Unauthorized Access

1. Open incognito window (no login)
2. Try accessing `/students` → redirected to login
3. Try accessing `/api/students` directly → 401

### 9.6 Token Expiry

1. Login → get access token
2. Wait for token to expire (or manually delete from localStorage)
3. Try navigating to any page → should auto-refresh token
4. If refresh token also expired → redirected to login

---

## Phase 10: Build & Syntax Checks

### 10.1 Frontend Build

```bash
cd frontend && npm run build
```

**Verify:**
- Build succeeds with no errors
- No `api is not exported` import errors
- Output in `build/` folder

### 10.2 Backend Syntax

```bash
cd backend
node --check src/app.js
```

**Verify:**
- Exit code 0 (no syntax errors)

### 10.3 Backend Boot

```bash
cd backend
NODE_ENV=development node src/server.js
```

**Verify:**
- "Connected to MongoDB" message
- "Vidyaloop API listening on http://localhost:5000/api"
- No crash on startup

---

## Quick Smoke Test (5 minutes)

If you only have 5 minutes, do this:

1. Reset DB: `npx prisma db push --force-reset` + `node scripts/ensure-indexes.js`
2. Start backend + frontend
3. Login as superadmin → create a school
4. Login as school admin → create 1 staff + 1 student
5. Create admission inquiry → enroll → get parent creds
6. Login as parent → change password → see dashboard
7. `cd frontend && npm run build` → should pass

If all 7 steps work, the core flow is solid.

---

## Test Execution Checklist

Use this to track which phases you've completed:

- [ ] Phase 1: Clean state & super admin
- [ ] Phase 2: School setup
- [ ] Phase 3: Forced password change
- [ ] Phase 4: Academics (attendance, timetable, examination)
- [ ] Phase 5: Operations (fees, payroll, certificates, leave, communication)
- [ ] Phase 6: Student lifecycle
- [ ] Phase 7: Multi-session testing
- [ ] Phase 8: Responsiveness
- [ ] Phase 9: Error states & edge cases
- [ ] Phase 10: Build & syntax checks
