// Placeholder descriptions for the remaining "Coming soon" modules (keys match NAV item keys).
export const PLACEHOLDER_DESCRIPTIONS = {
  transport:   "Track routes, drivers, and student pickup/drop assignments.",
  library:     "Manage book inventory, issue/return records, and fines.",
  gallery:     "School event photo albums, organized by date.",
  frontoffice: "Visitor log, gate passes, and enquiry desk records.",
  inventory:   "Track school assets, consumables, and stock levels.",
  hostel:      "Room allocation, hostel attendance, and maintenance requests.",
  copycheck:   "Assign and track answer-sheet checking workload among teachers.",
};

// Admission pipeline stages
export const KANBAN_STAGES = [
  { key: "inquiry",     label: "Inquiry",     color: "#3b82f6" },
  { key: "docs",        label: "Documents",   color: "#f59e0b" },
  { key: "interaction", label: "Interaction",  color: "#8b5cf6" },
  { key: "enrolled",    label: "Enrolled",     color: "#10b981" },
  { key: "rejected",    label: "Rejected",     color: "#ef4444" },
];

// ID Card templates
export const ID_CARD_TEMPLATES = [
  { key: "classic-blue",   label: "Classic Blue" },
  { key: "minimal-white",  label: "Minimal White" },
];
