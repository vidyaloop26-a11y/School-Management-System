// Stage 3 mock data — Admissions kanban, Examination, ID Card generator, Events calendar.

// Admissions kanban stages (counts from spec; only Inquiry & Enrolled have explicit counts).
export const KANBAN_STAGES = [
  { key: "inquiry",      label: "Inquiry",                 count: 142,  accent: "bg-[#e6f4fb] text-[#0c6a99] border-[#c9e7f5]" },
  { key: "docs",         label: "Document Verification",   count: null, accent: "bg-[#F4EEFB] text-[#5B3A8B] border-[#E7DCF6]" },
  { key: "interaction",  label: "Interaction Scheduled",   count: null, accent: "bg-[#FEF3E6] text-[#8A4B0F] border-[#FDDEB4]" },
  { key: "enrolled",     label: "Enrolled",                count: 58,   accent: "bg-emerald-50 text-emerald-800 border-emerald-200" },
];

export const APPLICANTS = [
  { id: 1, name: "Aditya Rawat",    classApplied: "6",  stage: "inquiry",     date: "10 Jul 2026" },
  { id: 2, name: "Sara Fernandes",  classApplied: "9",  stage: "docs",        date: "08 Jul 2026" },
  { id: 3, name: "Om Prakash",      classApplied: "3",  stage: "interaction", date: "05 Jul 2026" },
  { id: 4, name: "Zara Khan",       classApplied: "11", stage: "enrolled",    date: "01 Jul 2026" },
];

export const ADMISSIONS_STATS = [
  { key: "total",      title: "Total Inquiries (This Session)", value: "142",    sub: "+12 this month",        trend: { text: "+12 this month", dir: "up" } },
  { key: "enrolled",   title: "Enrolled",                       value: "58",     sub: "Session 2026-27",       trend: null },
  { key: "conversion", title: "Conversion Rate",                value: "40.8%",  sub: "+2.1% vs last session", trend: { text: "+2.1% vs last session", dir: "up" } },
];

// Examination — mark entry (class 8-A, Mathematics, Term 1 Exam)
export const MARK_ENTRY = [
  { roll: "12", name: "Aarav Sharma", marks: 82, outOf: 100 },
  { roll: "13", name: "Ishita Verma", marks: 91, outOf: 100 },
  { roll: "14", name: "Dev Malhotra", marks: 67, outOf: 100 },
  { roll: "15", name: "Riya Chopra",  marks: 88, outOf: 100 },
];

// Examination — Report card for Aarav Sharma, Class 8-A, Term 1 Exam
export const REPORT_CARD = {
  student: "Aarav Sharma",
  admNo: "VL2024001",
  classSection: "8-A",
  term: "Term 1 Exam",
  rows: [
    { subject: "Mathematics",    marks: 82, outOf: 100, grade: "A"  },
    { subject: "Science",        marks: 78, outOf: 100, grade: "B+" },
    { subject: "English",        marks: 85, outOf: 100, grade: "A"  },
    { subject: "Social Science", marks: 74, outOf: 100, grade: "B+" },
    { subject: "Hindi",          marks: 80, outOf: 100, grade: "A"  },
  ],
  total: 399,
  totalOutOf: 500,
  percentage: 79.8,
  overallGrade: "A",
  rank: 4,
};

// ID Card generator
export const ID_CARD_TEMPLATES = [
  { key: "classic-blue",   label: "Classic Blue" },
  { key: "minimal-white",  label: "Minimal White" },
];

export const ID_CARD_SAMPLE = {
  name: "Aarav Sharma",
  idNo: "VL2024001",
  classSection: "8-A",
  bloodGroup: "B+",
  validTill: "31 Mar 2027",
  emergency: "+91 98xxxxxx01",
};

// Events & Holidays
export const CALENDAR_EVENTS = [
  { date: "22 Jul 2026", y: 2026, m: 6, d: 22, title: "Parent-Teacher Meeting", sub: "Classes 6-8",       type: "Event"   },
  { date: "28 Jul 2026", y: 2026, m: 6, d: 28, title: "Independence Day Rehearsal", sub: "All sections", type: "Event"   },
  { date: "15 Aug 2026", y: 2026, m: 7, d: 15, title: "Independence Day",       sub: "National Holiday", type: "Holiday" },
  { date: "02 Sep 2026", y: 2026, m: 8, d: 2,  title: "Term 2 Fee Due Date",    sub: "All classes",      type: "Event"   },
  { date: "07 Sep 2026", y: 2026, m: 8, d: 7,  title: "Ganesh Chaturthi",       sub: "Regional Holiday", type: "Holiday" },
  { date: "02 Oct 2026", y: 2026, m: 9, d: 2,  title: "Gandhi Jayanti",         sub: "National Holiday", type: "Holiday" },
];

// Placeholder descriptions for the remaining "Coming soon" modules (keys match NAV item keys).
export const PLACEHOLDER_DESCRIPTIONS = {
  transport:    "Track routes, drivers, and student pickup/drop assignments.",
  library:      "Manage book inventory, issue/return records, and fines.",
  gallery:      "School event photo albums, organized by date.",
  frontoffice:  "Visitor log, gate passes, and enquiry desk records.",
  income:       "Track school-level income and expenditure ledgers.",
  payroll:      "Staff salary processing, payslips, and deductions.",
  inventory:    "Track school assets, consumables, and stock levels.",
  hostel:       "Room allocation, hostel attendance, and maintenance requests.",
  certificates: "Generate and issue bonafide, transfer, and achievement certificates.",
  leave:        "Staff and student leave applications and approval workflow.",
  copycheck:    "Assign and track answer-sheet checking workload among teachers.",
  settings:     "Configure school profile, academic year, roles, and system preferences.",
};
