// Stage 2 mock data — teacher/parent flows, attendance, diary, homework, fees, communication.

// Logged-in teacher (spec: Neha Kulkarni, VLS-101)
export const TEACHER_ME = { id: "VLS-101", name: "Neha Kulkarni" };
// Logged-in parent (spec: parent of Aarav Sharma, VL2024001)
export const PARENT_CHILD = { admNo: "VL2024001", name: "Aarav Sharma", classSection: "8-A" };

// Teacher dashboard cards
export const TEACHER_STATS = [
  { key: "classes",     title: "My Classes",              value: "3",           sub: "8-A, 8-B, 9-A",                    trend: null },
  { key: "periods",     title: "Today's Periods",         value: "5",           sub: "Next: 8-A Math, P3, Room 204",     trend: null },
  { key: "pending-hw",  title: "Pending Homework Reviews",value: "12",          sub: "Across 2 classes",                 trend: { text: "-3 vs yesterday", dir: "down-good" } },
  { key: "attendance",  title: "Attendance Marked Today", value: "2 / 3 classes", sub: "9-A pending",                    trend: null },
];

// Parent dashboard cards
export const PARENT_STATS = [
  { key: "attendance", title: "Attendance This Month", value: "91.3%",   sub: "21/23 days present",  trend: null },
  { key: "fee-due",    title: "Fee Due",               value: "₹42,000", sub: "Due 15 Aug 2026",     trend: null },
  { key: "pending-hw", title: "Pending Homework",      value: "2",       sub: "Across 3 subjects",   trend: null },
  { key: "unread",     title: "Unread Notices",        value: "1",       sub: "New this week",       trend: null },
];

// Attendance — Mark Attendance students for 8-A
export const ATTENDANCE_ROSTER_8A = [
  { roll: "12", name: "Aarav Sharma", status: "Present" },
  { roll: "13", name: "Ishita Verma", status: "Present" },
  { roll: "14", name: "Dev Malhotra", status: "Absent"  },
  { roll: "15", name: "Riya Chopra",  status: "Present" },
  { roll: "16", name: "Yash Bansal",  status: "Present" },
];

// Parent-side monthly attendance (July 2026 mock).
// P = Present, A = Absent, H = Holiday/Weekend, "" = future/blank
export const PARENT_ATTENDANCE_JULY_2026 = {
  month: "July",
  year: 2026,
  firstWeekday: 3, // 0=Sun ... 3=Wed (July 1 2026 is Wednesday — matches real calendar)
  daysInMonth: 31,
  summary: "21/23 days present (91.3%)",
  // day -> code
  marks: (() => {
    const out = {};
    for (let d = 1; d <= 31; d++) {
      // Weekend: Sun (day of week=0) - compute
      const weekday = (3 + d - 1) % 7;
      if (weekday === 0) { out[d] = "H"; continue; }
      // Two absent days per spec: 22 out of 23 school days present is bogus check;
      // doc says 21/23 = 2 absent. Mark days 8 and 21 as absent.
      if (d === 8 || d === 21) { out[d] = "A"; continue; }
      // 15 Aug is next month; skip. Mark day 22 as event (still present).
      out[d] = "P";
    }
    return out;
  })(),
};

// Digital Diary — reverse-chronological entries
export const DIARY_ENTRIES = [
  { id: 1, date: "15 Jul 2026", subject: "Mathematics", entry: "Homework: Complete Exercise 4.2, Q1-10. Due Monday." },
  { id: 2, date: "15 Jul 2026", subject: "Science",     entry: "Bring lab coat tomorrow for the practical class." },
  { id: 3, date: "14 Jul 2026", subject: "English",     entry: "Class test on Chapter 3 scheduled for 18 Jul." },
  { id: 4, date: "13 Jul 2026", subject: "General",     entry: "School will remain closed on 15 Aug for Independence Day." },
];

// Homework tracker items
export const HOMEWORK = [
  { id: 1, subject: "Mathematics", title: "Exercise 4.2, Q1-10",       due: "20 Jul 2026", status: "Pending",   submissions: "18/32" },
  { id: 2, subject: "English",     title: "Essay: My Favourite Book",  due: "18 Jul 2026", status: "Submitted", submissions: "30/32" },
  { id: 3, subject: "Science",     title: "Lab report - Photosynthesis", due: "22 Jul 2026", status: "Pending", submissions: "12/32" },
];

// Fees — Admin table
export const FEE_ROWS = [
  { admNo: "VL2024001", name: "Aarav Sharma", classSection: "8-A", term: 2, status: "Pending", due: "15 Aug 2026", amount: 42000 },
  { admNo: "VL2024002", name: "Ishita Verma", classSection: "8-A", term: 2, status: "Paid",    due: "-",           amount: 42000 },
  { admNo: "VL2024003", name: "Kabir Mehta",  classSection: "9-B", term: 2, status: "Overdue", due: "01 Jul 2026", amount: 45000 },
  { admNo: "VL2024004", name: "Ananya Nair",  classSection: "6-C", term: 2, status: "Paid",    due: "-",           amount: 38000 },
];

// Fee stat strip (derived / spec-consistent)
export const FEE_STAT_STRIP = {
  totalDue: 8700000,     // ₹87L across school (aggregate)
  totalCollected: 6840000, // ₹68.4L (Stage 1 dashboard consistency)
  overdueCount: 1,
};

// Parent fee card (child's fees)
export const PARENT_FEE_TERMS = [
  { term: "Term 1", status: "Paid",    amount: 42000, date: "12 Apr 2026" },
  { term: "Term 2", status: "Pending", amount: 42000, date: "due 15 Aug 2026" },
];

// Communication — Notice board
export const NOTICES = [
  { id: 1, date: "16 Jul 2026", title: "Parent-Teacher Meeting Schedule Released", audience: "All",         body: "The revised PTM schedule for classes 6-8 has been published. Please review the timings shared with your class teacher." },
  { id: 2, date: "14 Jul 2026", title: "Term 2 Fee Due Reminder",                  audience: "All Parents", body: "Term 2 fees are due on 15 August 2026. Kindly clear balances via the Fees section on the parent portal." },
  { id: 3, date: "12 Jul 2026", title: "Staff Meeting — 18 Jul, 4 PM",             audience: "All Staff",   body: "Monthly staff meeting will be held on 18 July at 4:00 PM in the auditorium. Attendance is mandatory." },
];
