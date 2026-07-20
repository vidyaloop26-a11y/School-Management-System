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
- [x] Teacher Dashboard + Parent Dashboard + role-aware Attendance / Digital Diary / Homework / Fees / Communication modules.

### Stage 3 additions
- [x] Promoted 4 modules from placeholder → functional: Admissions, Examination, ID Card Generator, Events & Holidays.
- [x] Admissions: 3 stat cards (Total Inquiries 142 +12, Enrolled 58, Conversion 40.8% +2.1%) + 4-column kanban with the 4 mock applicants; "New Inquiry" dialog form with all 6 fields.
- [x] Examination: two tabs — Mark Entry (editable marks per student, class/subject/exam selectors) and Report Card (Aarav Sharma · Class 8-A · Term 1, 5 subjects with grades, footer with Total 399/500, %79.8, Grade A, Rank #4).
- [x] ID Card Generator: template selector (Classic Blue / Minimal White), student picker, live preview panel with print/download.
- [x] Events & Holidays: full month grid with distinct event/holiday chips + agenda list, month navigation (July 2026 default), all 6 spec events (Jul-Oct 2026).
- [x] All remaining 11 placeholder modules use the reusable template with the exact copy from the doc via `PLACEHOLDER_DESCRIPTIONS` map.

### Stage 4 — Polish additions
- [x] `RouteSkeleton` reusable component + `Layout` briefly (~380ms) shows a pulsing skeleton on every route change AND role switch.
- [x] `Toaster` (sonner) mounted globally with glassmorphism `classNames`. 7 auto-dismissing action toasts wired: Submit Attendance ("Attendance submitted for [Class]"), Post to Diary ("Diary entry posted"), Send Notice ("Notice sent to [Audience]"), Add New Student ("Student added successfully"), Submit Inquiry ("Inquiry recorded"), Save Marks ("Marks saved for [Class] — [Subject]"), Generate ID Card ("ID card generated — ready to download").
- [x] `EmptyState` reusable component applied to StaffProfile Leave tab ("No pending leave requests — smooth sailing"), NotificationDropdown ("You're all caught up"), Homework parent checklist all-done ("No pending homework right now"), Command-K search ("No results found — try a different search term"), Events month agenda ("No events scheduled this month"). Table empty states (Students, Staff, Fees) now use the exact "No results found" copy.
- [x] Chart tooltip on Fee Collection line chart restyled to glassmorphism (translucent white + backdrop-blur) showing month + `₹XX L collected`.
- [x] `ExportButton` reusable component applied to Student list, Staff list, Fee Collection, and Examination pages; click fires the "Export started — this may take a moment" toast.
- [x] `LastSynced` reusable component ("Last synced: Just now") shown next to the Admin Dashboard title.
- [x] `DemoBadge` reusable component ("DEMO DATA") shown as a subtle muted pill in the top bar (lg+ screens).

### Mobile responsiveness (whole app, tested at 375px)
- [x] Sidebar collapses to a slide-out drawer with backdrop; hamburger button in top bar opens it; drawer auto-closes on route change.
- [x] Top bar on mobile: hamburger + search icon (Cmd-K reachable via icon) + compact role switcher (label hidden) + bell + avatar. Full search pill returns at `md:`.
- [x] Stat cards stack 1-per-row → 2 → 4 across breakpoints (already responsive in Stage 1/2).
- [x] All tables (Students, Staff, Fees admin, Homework teacher, Attendance mark) switch to stacked glass cards on mobile.
- [x] Admissions kanban → horizontally-scrollable tab strip with single-column list on mobile.
- [x] Events calendar → agenda list only on mobile.
- [x] Timetable retains horizontal scroll (already set in Stage 1).
- [x] Report card and ID card preview stay readable at 375px without zoom.
- [x] Profile tab lists (StudentProfile 5 tabs, StaffProfile 4 tabs) become horizontally scrollable on mobile.
- [x] Main content padding reduced to `px-4 py-6` on mobile.
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
