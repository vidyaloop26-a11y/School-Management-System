import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardCheck, FileSpreadsheet,
  BookOpen, PencilLine, MessageSquare, Images, PartyPopper,
  Wallet, Bus, Library, Boxes, Building2, BedDouble,
  UserPlus, Banknote, TrendingUp, ScrollText, PlaneTakeoff, CheckSquare,
  IdCard, Settings, Megaphone, Shield
} from "lucide-react";

// Sidebar structure
export const NAV = {
  top: [
    { key: "dashboard", label: "Dashboard", path: "/", icon: LayoutDashboard, functional: true },
    { key: "schools",   label: "Schools",   path: "/schools", icon: Building2, functional: true },
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
        { key: "payroll",    label: "Payroll",          path: "/payroll",    icon: Banknote,   functional: true },
        { key: "income",     label: "Income & Expense", path: "/income",     icon: TrendingUp, functional: true },
        { key: "certificates",label:"Certificates",     path: "/certificates",icon:ScrollText,  functional: true },
        { key: "leave",      label: "Leave",            path: "/leave",      icon: PlaneTakeoff,functional: true },
        { key: "copycheck",  label: "Copy Checking",    path: "/copy-checking", icon: CheckSquare, functional: false },
      ],
    },
  ],
  bottom: [
    { key: "idcard",   label: "ID Card Generator", path: "/id-card", icon: IdCard,   functional: true },
    { key: "support",  label: "Support Console",   path: "/support", icon: Shield,  functional: true },
    { key: "settings", label: "Settings",          path: "/settings",icon: Settings, functional: true },
  ],
};

// Subject color mapping (used by timetable, homework, diary)
export const SUBJECT_COLORS = {
  "Math":        { bg: "bg-[#EAF6FC]",  text: "text-[#0C6A99]", dot: "bg-[#29ABE2]" },
  "Mathematics": { bg: "bg-[#EAF6FC]",  text: "text-[#0C6A99]", dot: "bg-[#29ABE2]" },
  "English":     { bg: "bg-[#F4EEFB]",  text: "text-[#5B3A8B]", dot: "bg-[#8B5CF6]" },
  "Science":     { bg: "bg-[#E9F7EF]",  text: "text-[#166534]", dot: "bg-[#22C55E]" },
  "Social Sci.": { bg: "bg-[#FEF3E6]",  text: "text-[#8A4B0F]", dot: "bg-[#F59E0B]" },
  "Social Science": { bg: "bg-[#FEF3E6]",  text: "text-[#8A4B0F]", dot: "bg-[#F59E0B]" },
  "Hindi":       { bg: "bg-[#FEEEF0]",  text: "text-[#9F1239]", dot: "bg-[#F43F5E]" },
  "Computer":    { bg: "bg-[#E8F1FE]",  text: "text-[#1E3A8A]", dot: "bg-[#3B82F6]" },
  "Computer Sci.": { bg: "bg-[#E8F1FE]",  text: "text-[#1E3A8A]", dot: "bg-[#3B82F6]" },
  "Physics":     { bg: "bg-[#F4EEFB]",  text: "text-[#5B3A8B]", dot: "bg-[#8B5CF6]" },
  "Chemistry":   { bg: "bg-[#FEF3E6]",  text: "text-[#8A4B0F]", dot: "bg-[#F59E0B]" },
  "Biology":     { bg: "bg-[#E9F7EF]",  text: "text-[#166534]", dot: "bg-[#22C55E]" },
};

// Flatten all sidebar entries for command palette
export function flatNav() {
  const out = [];
  NAV.top.forEach((i) => out.push(i));
  NAV.groups.forEach((g) => g.items.forEach((i) => out.push(i)));
  NAV.bottom.forEach((i) => out.push(i));
  return out;
}
