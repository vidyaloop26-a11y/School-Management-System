# Vidyaloop — School Management Platform (PRD)

## Original problem statement
Build a School Management Platform web app for Vidyaloop — a premium, non-generic SaaS product for schools, not a childish "school app" look. Design system: white → pale-blue gradient background, accent #29ABE2 used sparingly, glassmorphism cards, clean sans-serif typography, Lucide icons, Recharts, ₹ lakhs formatting (₹68.4L above 1,00,000; ₹42,000 below). Stage 1 = frontend only, no backend/auth/DB. Dashboard, Students, Staff, Timetable are functional. All other 16+ sidebar items land on ONE reusable "Coming soon" placeholder. Exact mock data supplied by user.

## Architecture
- React 19 SPA with react-router-dom v7
- shadcn/ui + Tailwind + Lucide icons + Recharts + framer-motion (available)
- All data static in `/app/frontend/src/lib/mockData.js`
- No backend/API calls

## User personas
- Admin / Principal (primary demo view)
- Teacher, Parent, Student (role switcher only, non-functional)

## Core requirements (static)
- Navigation shell: sidebar with Dashboard, 4 collapsible groups (Academics, Engagement, Operations, Administration), and System group. Top bar with search+⌘K, role switcher, notification bell (badge=3), avatar RD.
- Command palette (⌘K / Cmd+K) with Pages + 4 static Quick Actions.
- Notification dropdown with 5 mock items, 3 unread.
- Design system: glass cards, brand #29ABE2 accent-only, Instrument Sans + Geist pairing, title dot accent.
- ₹ formatting rule: `formatINR()` in `/app/frontend/src/lib/format.js`.

## What's been implemented (Feb 2026)
- [x] Sidebar shell with collapsible groups + reusable Placeholder (`Coming soon`) route.
- [x] Top bar with glass search trigger opening ⌘K palette.
- [x] Command palette wired to Cmd/Ctrl+K, keyboard navigation.
- [x] Notification popover with 5 mock items and unread dots.
- [x] Dashboard: 4 stat cards with trend pills, Recharts area chart w/ gradient fill, upcoming events (no clipping @ 1440/1920).
- [x] Students: filterable table (class/section/status/search), row → profile with 5 tabs (Overview, Attendance heatmap, Fee History w/ lakhs formatting, Academic, Documents).
- [x] Staff: filterable table, profile with 4 tabs (Overview, Timetable derived from class grid, Leave, Documents).
- [x] Timetable: grid with Mon-Fri × P1-P5+Break, Class/Teacher view toggle, click-cell popover with teacher + room.

### Stage 2 additions
- [x] Role switcher supports Admin / Teacher / Parent with a `RoleContext`.
- [x] Per-role sidebar visibility: Teacher and Parent get focused sets; Admin keeps the full grouped sidebar with placeholders.
- [x] Teacher Dashboard: 4 stat cards (My Classes, Today's Periods, Pending HW Reviews with -3 pill, Attendance Marked) + Mark Attendance / Post to Diary quick-action tiles.
- [x] Parent Dashboard: 4 stat cards + latest 3 diary entries + latest 2 notices with `View All` links.
- [x] Attendance (role-aware): Teacher mark screen with Present/Absent per row, Mark All Present, Submit; Parent monthly calendar (July 2026) with Present/Absent/Holiday legend + summary card.
- [x] Digital Diary (role-aware): Teacher post form with live preview; Parent/Student reverse-chronological feed.
- [x] Homework Tracker (role-aware): Teacher/Admin list with submissions counter; Parent checklist with toggleable status pills.
- [x] Fee Management (role-aware): Admin stat strip (₹68.4L collected, ₹87L due, 1 overdue) + filterable table; Parent term-wise cards with Pay Now (non-functional) + downloadable Receipt link for paid terms + summary panel.
- [x] Communication (role-aware): Admin post-notice form (title, body, audience) with live preview; Teacher/Parent notice board with 3 mock notices.

## Prioritised backlog (P0/P1/P2)
- P1: Wire up remaining 16 modules (Attendance, Examination, Digital Diary, Homework, Communication, Gallery, Events & Holidays, Fees, Transport, Library, Inventory, Front Office, Building & Hostel, Admissions, Payroll, Income & Expense, Certificates, Leave, Copy Checking, ID Card Generator, Settings).
- P1: Backend + auth (role-based) when Stage 2 begins.
- P2: Real-time data, per-tenant multi-school support, RBAC granular.
- P2: Mobile-native shells (Parent app / Teacher app).

## Next tasks
- Await user review of Stage 1 visual build.
- Prioritise Attendance and Fees for Stage 2 (highest daily-use modules).
