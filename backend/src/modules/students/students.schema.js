const { z } = require("zod");

const studentBase = {
  admNo: z.string().min(1, "Admission number is required"),
  name: z.string().min(1, "Student name is required"),
  cls: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  roll: z.number().int().min(1),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergency: z.string().optional(),
  address: z.string().optional(),
  fatherName: z.string().optional(),
  fatherEmail: z.string().email().optional().or(z.literal("")).optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  // parent portal credential (only relevant on create; not part of edits)
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")).optional(),
  parentPhone: z.string().optional(),
  schoolId: z.string().optional(),
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
    dob: z.string().optional(),
    bloodGroup: z.string().optional(),
    emergency: z.string().optional(),
    address: z.string().optional(),
    fatherName: z.string().optional(),
    fatherEmail: z.string().email().optional().or(z.literal("")).optional(),
    fatherPhone: z.string().optional(),
    motherName: z.string().optional(),
  })
  .strict();

const listQuerySchema = z.object({
  search: z.string().optional(),
  cls: z.string().optional(),
  section: z.string().optional(),
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