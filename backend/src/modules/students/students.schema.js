const { z } = require("zod");

const optionalString = z.string().nullable().optional().or(z.literal(""));
const optionalEmail = z.union([z.string().email(), z.literal(""), z.null(), z.undefined()]);

const studentBase = {
  admNo: z.string().min(1, "Admission number is required"),
  name: z.string().min(1, "Student name is required"),
  cls: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  roll: z.preprocess((val) => (val === "" || val === undefined || val === null ? 1 : Number(val)), z.number().int().min(1).default(1)),
  session: optionalString, // e.g. "2024-2025", "2023-2024"
  batch: optionalString, // e.g. "2020-2025" or "Batch 2024"
  dob: optionalString,
  bloodGroup: optionalString,
  emergency: optionalString,
  address: optionalString,
  fatherName: optionalString,
  fatherEmail: optionalEmail,
  fatherPhone: optionalString,
  motherName: optionalString,
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  // parent portal credential
  parentName: optionalString,
  parentEmail: optionalEmail,
  parentPhone: optionalString,
  schoolId: optionalString,
};

const createStudentSchema = z.object(studentBase);

// Full admin update
const updateStudentSchema = z.object(studentBase).partial().omit({
  parentName: true,
  parentEmail: true,
  parentPhone: true,
  schoolId: true,
});

// Teacher "corrections" whitelist — structurally safe fields a teacher may fix.
const TEACHER_EDITABLE = [
  "name",
  "dob",
  "bloodGroup",
  "emergency",
  "address",
  "fatherName",
  "fatherEmail",
  "fatherPhone",
  "motherName",
];

const teacherCorrectSchema = z
  .object({
    name: z.string().min(1).optional(),
    dob: optionalString,
    bloodGroup: optionalString,
    emergency: optionalString,
    address: optionalString,
    fatherName: optionalString,
    fatherEmail: optionalEmail,
    fatherPhone: optionalString,
    motherName: optionalString,
  })
  .strict();

const listQuerySchema = z.object({
  search: z.string().optional(),
  cls: z.string().optional(),
  section: z.string().optional(),
  session: z.string().optional(),
  status: z.string().optional(),
  schoolId: z.string().optional(),
});

const studentIdParam = z.object({ id: z.string().min(1) });

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  teacherCorrectSchema,
  TEACHER_EDITABLE,
  listQuerySchema,
  studentIdParam,
};