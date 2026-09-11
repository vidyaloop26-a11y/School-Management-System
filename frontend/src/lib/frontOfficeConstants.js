export const PURPOSES = [
  { value: "PARENT_VISIT", label: "Parent Visit" },
  { value: "MEETING_TEACHER", label: "Meeting Teacher" },
  { value: "MEETING_PRINCIPAL", label: "Meeting Principal" },
  { value: "STUDENT_PICKUP", label: "Student Pickup" },
  { value: "ADMISSION_ENQUIRY", label: "Admission Enquiry" },
  { value: "VENDOR", label: "Vendor / Delivery" },
  { value: "OTHER", label: "Other" },
];

export const APPROVAL_OPTIONS = [
  { value: "APPROVED", label: "Approve", tone: "emerald" },
  { value: "REJECTED", label: "Reject", tone: "rose" },
  { value: "WAIT", label: "Wait", tone: "amber" },
];

export const approvalStyles = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
  WAIT: "bg-amber-50 text-amber-700 border border-amber-200",
};

export const pickupStyles = {
  NOT_APPLICABLE: "bg-slate-100 text-slate-500 border border-slate-200",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  MANUAL: "bg-blue-50 text-blue-700 border border-blue-200",
};

export const gatePassStatusStyles = {
  ACTIVE: "bg-blue-50 text-blue-700 border border-blue-200",
  USED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border border-rose-200",
};

export const passQrUrl = (token) =>
  `${window.location.origin}/pass/verify?token=${encodeURIComponent(token)}`;

export const checkInKioskUrl = (schoolId) =>
  `${window.location.origin}/check-in?school=${encodeURIComponent(schoolId)}`;