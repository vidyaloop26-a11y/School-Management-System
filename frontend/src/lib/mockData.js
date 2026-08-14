import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardCheck, FileSpreadsheet,
  BookOpen, PencilLine, MessageSquare, Images, PartyPopper,
  Wallet, Bus, Library, Boxes, Building2, BedDouble,
  UserPlus, Banknote, TrendingUp, ScrollText, PlaneTakeoff, CheckSquare,
  IdCard, Settings, Megaphone
} from "lucide-react";

// Sidebar structure
export const NAV = {
  top: [
    { key: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard, functional: true },
  ],
  groups: [
    {
      label: "ACADEMICS",
      items: [
        { key: "students",    label: "Students",    path: "/students",    icon: Users,            functional: true },
        { key: "staff",       label: "Staff",       path: "/staff",       icon: GraduationCap,    functional: true },
        { key: "timetable",   label: "Timetable",   path: "/timetable",   icon: CalendarDays,     functional: true },
        { key: "attendance",  label: "Attendance",  path: "/attendance",  icon: ClipboardCheck,   functional: true },
        { key: "examination", label: "Examination", path: "/examination", icon: FileSpreadsheet,  functional: true },
      ],
    },
    {
      label: "ENGAGEMENT",
      items: [
        { key: "diary",         label: "Digital Diary",       path: "/diary",         icon: BookOpen,      functional: true },
        { key: "homework",      label: "Homework",            path: "/homework",      icon: PencilLine,    functional: true },
        { key: "communication", label: "Communication",       path: "/communication", icon: MessageSquare, functional: true },
        { key: "gallery",       label: "Gallery",             path: "/gallery",       icon: Images,        functional: false },
        { key: "events",        label: "Events & Holidays",   path: "/events",        icon: PartyPopper,   functional: true },
      ],
    },
    {
      label: "OPERATIONS",
      items: [
        { key: "fees",       label: "Fees",              path: "/fees",       icon: Wallet,      functional: true },
        { key: "transport",  label: "Transport",         path: "/transport",  icon: Bus,         functional: false },
        { key: "library",    label: "Library",           path: "/library",    icon: Library,     functional: false },
        { key: "inventory",  label: "Inventory",         path: "/inventory",  icon: Boxes,       functional: false },
        { key: "frontoffice",label: "Front Office",      path: "/front-office",icon: Building2,  functional: false },
        { key: "hostel",     label: "Building & Hostel", path: "/hostel",     icon: BedDouble,   functional: false },
      ],
    },
    {
      label: "ADMINISTRATION",
      items: [
        { key: "schools",    label: "Schools & Campuses", path: "/schools",    icon: Building2,  functional: true },
        { key: "admissions", label: "Admissions",       path: "/admissions", icon: UserPlus,   functional: true },
        { key: "payroll",    label: "Payroll",          path: "/payroll",    icon: Banknote,   functional: false },
        { key: "income",     label: "Income & Expense", path: "/income",     icon: TrendingUp, functional: false },
        { key: "certificates",label:"Certificates",     path: "/certificates",icon:ScrollText,  functional: false },
        { key: "leave",      label: "Leave",            path: "/leave",      icon: PlaneTakeoff,functional: false },
        { key: "copycheck",  label: "Copy Checking",    path: "/copy-checking", icon: CheckSquare, functional: false },
      ],
    },
  ],
  bottom: [
    { key: "idcard",   label: "ID Card Generator", path: "/id-card", icon: IdCard,   functional: true },
    { key: "settings", label: "Settings",          path: "/settings",icon: Settings, functional: false },
  ],
};

// Quick actions for Command palette
export const QUICK_ACTIONS = [
  { key: "add-student",    label: "Add New Student",       icon: UserPlus },
  { key: "mark-attendance",label: "Mark Attendance",       icon: ClipboardCheck },
  { key: "post-diary",     label: "Post to Digital Diary", icon: BookOpen },
  { key: "create-notice",  label: "Create Notice",         icon: Megaphone },
];

// Notifications
export const NOTIFICATIONS = [
  { id: 1, title: "New admission inquiry — Aditya Rawat (Class 6)", time: "2 hours ago", unread: true, kind: "admission" },
  { id: 2, title: "Fee payment received — Ishita Verma",            time: "5 hours ago", unread: true, kind: "fee" },
  { id: 3, title: "Leave request pending approval — Meera Iyer",    time: "Yesterday",   unread: true, kind: "leave" },
  { id: 4, title: "Term 2 fee due date approaching — 15 Aug",       time: "2 days ago",  unread: false, kind: "reminder" },
  { id: 5, title: "Parent-Teacher Meeting scheduled — 22 Jul",      time: "3 days ago",  unread: false, kind: "event" },
];

// Dashboard cards
export const STAT_CARDS = [
  { key: "students",   title: "Total Students",           value: "1,284",         sub: "+18 this month",         trend: { text: "+1.4%",  dir: "up" } },
  { key: "staff",      title: "Total Staff",              value: "96",            sub: "82 teaching / 14 non-teaching", trend: null },
  { key: "fees",       title: "Fee Collected (This Term)",value: "₹68.4L / ₹82L", sub: "83% collected",          trend: { text: "+10.3%", dir: "up" } },
  { key: "attendance", title: "Today's Attendance",       value: "94.2%",         sub: "1,210 present / 1,284",  trend: { text: "+0.8% vs yesterday", dir: "up" } },
];

// Fee collection chart data
export const FEE_CHART = [
  { month: "Feb", amount: 40 },
  { month: "Mar", amount: 48 },
  { month: "Apr", amount: 55 },
  { month: "May", amount: 42 },
  { month: "Jun", amount: 58 },
  { month: "Jul", amount: 68.4 },
];

// Upcoming events
export const UPCOMING_EVENTS = [
  { month: "JUL", day: "22", title: "Parent-Teacher Meeting", sub: "Classes 6-8" },
  { month: "JUL", day: "28", title: "Independence Day Rehearsal", sub: "All sections" },
  { month: "AUG", day: "15", title: "Independence Day Celebration", sub: "Main Ground" },
  { month: "SEP", day: "02", title: "Term 2 Fee Due Date", sub: "All classes" },
];

// Students
export const STUDENTS = [
  { admNo: "VL2024001", name: "Aarav Sharma",  class: "8",  section: "A", roll: "12", status: "Active" },
  { admNo: "VL2024002", name: "Ishita Verma",  class: "8",  section: "A", roll: "13", status: "Active" },
  { admNo: "VL2024003", name: "Kabir Mehta",   class: "9",  section: "B", roll: "05", status: "Active" },
  { admNo: "VL2024004", name: "Ananya Nair",   class: "6",  section: "C", roll: "21", status: "Active" },
  { admNo: "VL2024005", name: "Rohan Gupta",   class: "10", section: "A", roll: "09", status: "Inactive" },
  { admNo: "VL2024006", name: "Sanya Kapoor",  class: "7",  section: "B", roll: "17", status: "Active" },
];

// Detailed profile only for Aarav (per doc)
export const STUDENT_PROFILE = {
  VL2024001: {
    name: "Aarav Sharma",
    admNo: "VL2024001",
    dob: "14 Mar 2012",
    classSection: "8-A",
    roll: "12",
    bloodGroup: "B+",
    emergency: "+91 98xxxxxx01",
    address: "House 42, Sector 45, Gurugram, Haryana - 122003",
    father: { name: "Rajesh Sharma", email: "rajesh.sharma@email.com", phone: "+91 98xxxxxx01" },
    mother: { name: "Priya Sharma" },
    attendanceTerm: 94,
    fees: [
      { term: "Term 1", status: "Paid",    amount: 42000, date: "12 Apr 2026" },
      { term: "Term 2", status: "Pending", amount: 42000, date: "due 15 Aug 2026" },
    ],
  },
};

// Staff
export const STAFF = [
  { id: "VLS-101", name: "Neha Kulkarni", role: "Teacher",        dept: "Mathematics",    status: "Active" },
  { id: "VLS-102", name: "Arjun Rao",     role: "Teacher",        dept: "Science",        status: "Active" },
  { id: "VLS-103", name: "Meera Iyer",    role: "Teacher",        dept: "English",        status: "Active" },
  { id: "VLS-104", name: "Vikram Singh",  role: "Vice Principal", dept: "Administration", status: "Active" },
  { id: "VLS-105", name: "Sunita Joshi",  role: "Front Office",   dept: "Administration", status: "Active" },
  { id: "VLS-106", name: "Deepak Chawla", role: "Accountant",     dept: "Finance",        status: "Active" },
];

export const STAFF_PROFILE = {
  "VLS-101": {
    name: "Neha Kulkarni",
    id: "VLS-101",
    joined: "2 Jun 2019",
    subject: "Mathematics",
    classes: ["8-A", "8-B", "9-A"],
    qualification: "M.Sc Mathematics, B.Ed",
    email: "neha.kulkarni@vidyaloopschool.in",
    phone: "+91 98xxxxxx11",
  },
};

// Timetable — Class 8-A
export const PERIODS = [
  { key: "P1",    label: "P1", time: "8:30-9:15" },
  { key: "P2",    label: "P2", time: "9:15-10:00" },
  { key: "P3",    label: "P3", time: "10:00-10:45" },
  { key: "BREAK", label: "Break", time: "10:45-11:00" },
  { key: "P4",    label: "P4", time: "11:00-11:45" },
  { key: "P5",    label: "P5", time: "11:45-12:30" },
];
export const DAYS = ["Mon","Tue","Wed","Thu","Fri"];

// [period][day] -> { subject, teacher, room }
export const TIMETABLE_8A = {
  P1: {
    Mon: { subject: "Math",        teacher: "Neha Kulkarni", room: "204" },
    Tue: { subject: "English",     teacher: "Meera Iyer",    room: "112" },
    Wed: { subject: "Science",     teacher: "Arjun Rao",     room: "301" },
    Thu: { subject: "Math",        teacher: "Neha Kulkarni", room: "204" },
    Fri: { subject: "Social Sci.", teacher: "Vikram Singh",  room: "205" },
  },
  P2: {
    Mon: { subject: "English",     teacher: "Meera Iyer",    room: "112" },
    Tue: { subject: "Math",        teacher: "Neha Kulkarni", room: "204" },
    Wed: { subject: "Social Sci.", teacher: "Vikram Singh",  room: "205" },
    Thu: { subject: "Science",     teacher: "Arjun Rao",     room: "301" },
    Fri: { subject: "Math",        teacher: "Neha Kulkarni", room: "204" },
  },
  P3: {
    Mon: { subject: "Science",     teacher: "Arjun Rao",     room: "301" },
    Tue: { subject: "Hindi",       teacher: "Meera Iyer",    room: "115" },
    Wed: { subject: "Math",        teacher: "Neha Kulkarni", room: "204" },
    Thu: { subject: "English",     teacher: "Meera Iyer",    room: "112" },
    Fri: { subject: "Computer",    teacher: "Deepak Chawla", room: "Lab 1" },
  },
  BREAK: {
    Mon: null, Tue: null, Wed: null, Thu: null, Fri: null,
  },
  P4: {
    Mon: { subject: "Social Sci.", teacher: "Vikram Singh",  room: "205" },
    Tue: { subject: "Science",     teacher: "Arjun Rao",     room: "301" },
    Wed: { subject: "English",     teacher: "Meera Iyer",    room: "112" },
    Thu: { subject: "Hindi",       teacher: "Meera Iyer",    room: "115" },
    Fri: { subject: "Science",     teacher: "Arjun Rao",     room: "301" },
  },
  P5: {
    Mon: { subject: "Computer",    teacher: "Deepak Chawla", room: "Lab 1" },
    Tue: { subject: "Social Sci.", teacher: "Vikram Singh",  room: "205" },
    Wed: { subject: "Hindi",       teacher: "Meera Iyer",    room: "115" },
    Thu: { subject: "Math",        teacher: "Neha Kulkarni", room: "204" },
    Fri: { subject: "English",     teacher: "Meera Iyer",    room: "112" },
  },
};

// Subject color mapping (kept tonal, brand blue used sparingly)
export const SUBJECT_COLORS = {
  "Math":        { bg: "bg-[#EAF6FC]",  text: "text-[#0C6A99]", dot: "bg-[#29ABE2]" },
  "English":     { bg: "bg-[#F4EEFB]",  text: "text-[#5B3A8B]", dot: "bg-[#8B5CF6]" },
  "Science":     { bg: "bg-[#E9F7EF]",  text: "text-[#166534]", dot: "bg-[#22C55E]" },
  "Social Sci.": { bg: "bg-[#FEF3E6]",  text: "text-[#8A4B0F]", dot: "bg-[#F59E0B]" },
  "Hindi":       { bg: "bg-[#FEEEF0]",  text: "text-[#9F1239]", dot: "bg-[#F43F5E]" },
  "Computer":    { bg: "bg-[#E8F1FE]",  text: "text-[#1E3A8A]", dot: "bg-[#3B82F6]" },
};

// Flatten all sidebar entries for command palette
export function flatNav() {
  const out = [];
  NAV.top.forEach((i) => out.push(i));
  NAV.groups.forEach((g) => g.items.forEach((i) => out.push(i)));
  NAV.bottom.forEach((i) => out.push(i));
  return out;
}
