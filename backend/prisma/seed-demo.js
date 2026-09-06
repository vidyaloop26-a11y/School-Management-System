// Vidyaloop Demo Data Seed
// Usage: node prisma/seed-demo.js
//
// Generates a realistic multi-tenant dataset for the 3 demo schools:
//   VLPS (Vidyaloop Public School), SXIS (St. Xavier International), DPA (Delhi Public Academy)
// Per school: 24 classes, 8 subjects, ~56 staff, 1000 students, ~1000 parent accounts,
// backed by fees (8 components, 24 structures, ~2000 ledger entries, ~1200 payments),
// timetable (600 entries), attendance (~45k records), exam marks (~32k), payroll (~336),
// library (~400 books), syllabus (~384 topics), transport (6 routes + vehicles + assignments),
// hostel, inventory, notices, events, visitors, copy-check batches, digital diary, homework,
// leave balances & leave requests.
//
// Demo credentials:
//   Super Admin      superadmin@vidyaloop.in  / Super@1234        (from seed.js)
//   School Admin     admin-{CODE}             / admin123
//   Teacher          teacher-{CODE}           / teacher123
//   Duty leads       accountant-{CODE}        / accountant123
//                    frontoffice-{CODE}       / frontoffice123
//                    transport-{CODE}         / transport123
//                    librarian-{CODE}         / librarian123
//                    hr-{CODE}                / hr123
//                    admissions-{CODE}        / admissions123
//   Parent            {ADMNO}-p               / parent123          (e.g. VLPS0001-p)
const prisma = require("../src/lib/prisma");
const env = require("../src/config/env");
const authService = require("../src/modules/auth/auth.service");
const { MongoClient, ObjectId } = require("mongodb");

const mongoClient = new MongoClient(env.databaseUrl);
let mongoDb;

const SESSION = "2024-2025";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5"];
const SUBJECTS = [
  "Mathematics",
  "English",
  "Hindi",
  "Science",
  "Social Sci.",
  "Computer",
  "Physical Education",
  "Arts",
];
const FEES_TERMS = ["Term 1", "Term 2"];
const DAY_MS = 86400000;

// Deterministic PRNG so every run produces the same nice-looking dataset.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
const randInt = (r, min, max) => min + Math.floor(r() * (max - min + 1));

const FIRST = [
  "Aarav", "Ishita", "Kabir", "Ananya", "Rohan", "Sanya", "Dev", "Riya", "Yash", "Vivaan",
  "Myra", "Aditya", "Diya", "Tanvi", "Neha", "Arjun", "Meera", "Vikram", "Sunita", "Deepak",
  "Priya", "Kavita", "Nisha", "Amit", "Pooja", "Manish", "Swati", "Gaurav", "Ritu", "Sneha",
  "Varun", "Alok", "Divya", "Kunal", "Shreya", "Harsh", "Anjali", "Nikhil", "Rachna", "Sahil",
  "Pallavi", "Rakesh", "Geeta", "Sanjay", "Kirti", "Mohit", "Preeti", "Abhishek", "Zoya", "Aryan",
  "Tanmay", "Shivam", "Aditi", "Ritika", "Pranav", "Lavanya", "Karan", "Farheen", "Imran", "Tara",
];
const LAST = [
  "Sharma", "Verma", "Mehta", "Nair", "Gupta", "Kapoor", "Malhotra", "Chopra", "Bansal", "Joshi",
  "Singh", "Kulkarni", "Iyer", "Rao", "Patel", "Shah", "Kumar", "Sen", "Das", "Reddy",
  "Khan", "Chauhan", "Mishra", "Pandey", "Tiwari", "Dubey", "Saxena", "Bhatt", "Agarwal", "Garg",
  "Goel", "Jain", "Sethi", "Naik", "Pillai", "Menon", "Prasad", "Anand", "Mittal", "Batra",
  "Kohli", "Suri", "Bhagat", "Sahu", "Rathore", "Chadha", "Balaji", "Hegde", "Nayak", "Tripathi",
];
const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// Run a batch of promises in flight-limited chunks.
async function chunked(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    await Promise.all(slice.map((item) => fn(item)));
  }
}

// Fast leaf-document inserts via the native MongoDB driver (1000 docs/command).
// Uses the driver directly (not prisma.$runCommandRaw) so JS Date -> BSON Date and
// ObjectId fields keep their true types; prisma.$runCommandRaw JSON-serializes Dates
// into plain strings, which later breaks prisma reads with P2023.
// oidFields lists scalar fields annotated @db.ObjectId that must be stored as BSON ObjectId.

// Swallows MongoDB E11000 duplicate-key errors so re-running the seed is fully
// idempotent. Any other error is re-thrown as-is.
async function ignoreDuplicates(fn) {
  try {
    return await fn();
  } catch (err) {
    // MongoBulkWriteError wraps writeErrors; plain MongoServerError has .code directly.
    if (err.code === 11000 || (err.writeErrors && err.writeErrors.length && err.code === 11000)) return;
    throw err;
  }
}

async function bulkInsert(collection, docs, oidFields = []) {
  const transformed = docs.map((d) => {
    const copy = { ...d };
    for (const f of oidFields) if (copy[f]) copy[f] = new ObjectId(copy[f]);
    for (const k of Object.keys(copy)) if (copy[k] === undefined) delete copy[k];
    if (copy.createdAt === undefined || copy.createdAt === null) copy.createdAt = new Date();
    if (copy.updatedAt === undefined || copy.updatedAt === null) copy.updatedAt = new Date();
    return copy;
  });
  for (let i = 0; i < transformed.length; i += 1000) {
    await ignoreDuplicates(() =>
      mongoDb.collection(collection).insertMany(transformed.slice(i, i + 1000), { ordered: false })
    );
  }
}

async function connectMongo() {
  await mongoClient.connect();
  mongoDb = mongoClient.db();
}

// All model collections (Prisma mongo uses the model name as the collection name).
const ALL_COLLECTIONS = [
  "School", "SchoolSettings", "SchoolEvent", "SchoolClass", "SchoolSubject", "ExamConfig",
  "AdmissionInquiry", "Notice", "User", "RefreshToken", "AuditLog",
  "Student", "Staff", "FeeComponent", "FeeStructure", "StudentFeeLedger", "Payment",
  "TimetableEntry", "AttendanceRecord", "ExamMark", "PayrollRecord", "IncomeExpenseRecord",
  "CertificateRecord", "LeaveRequest", "Task", "SyllabusTopic", "LessonProgress",
  "Album", "Photo", "Book", "BookIssue", "TransportRoute", "Vehicle", "StudentRoute",
  "Visitor", "GatePass", "HostMapping", "InventoryItem", "PurchaseRecord", "IssueLog",
  "Building", "HostelRoom", "BedAssignment", "MaintenanceRequest",
  "CopyCheckBatch", "CopyCheckEntry", "DiaryEntry", "Homework", "HomeworkSubmission", "LeaveBalance",
];

// Full wipe so stale rows with old/mismatched school ids (from earlier partial seed
// runs) can never leak into the fresh demo dataset.
async function wipeAllCollections() {
  for (const c of ALL_COLLECTIONS) {
    await mongoDb.collection(c).deleteMany({});
  }
  console.log(`Wiped ${ALL_COLLECTIONS.length} collections.`);
}

function hashCache() {
  const cache = {};
  const get = (password) => {
    if (!cache[password]) cache[password] = authService.hashPassword(password);
    return cache[password];
  };
  return get;
}

function workingDays(from, to) {
  const out = [];
  let d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
    d = new Date(d.getTime() + DAY_MS);
  }
  return out;
}

function gradeFor(marks, max) {
  const pct = (marks / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  return "D";
}

const SCHOOLS = [
  {
    name: "Vidyaloop Public School",
    code: "VLPS",
    board: "CBSE",
    address: "Sector 45, Gurugram, Haryana - 122003",
    adminName: "Rajesh Director",
    pad: 3,
  },
  {
    name: "St. Xavier International School",
    code: "SXIS",
    board: "ICSE",
    address: "Vasant Kunj, New Delhi - 110070",
    adminName: "Sister Clara",
    pad: 3,
  },
  {
    name: "Delhi Public Academy",
    code: "DPA",
    board: "CBSE",
    address: "Sector 62, Noida, Uttar Pradesh - 201301",
    adminName: "Dr. Amit Singhania",
    pad: 3,
  },
];

// Build the staff roster for a school: { role key, count } descriptors.
function buildStaffPool(code, r) {
  const staff = [];
  const add = (jobTitle, dept, subject, dutyCount, dutyName) => {
    for (let i = 0; i < dutyCount; i++) {
      staff.push({
        staffId: `${code}-${100 + staff.length}`,
        name: `${pick(FIRST, r)} ${pick(LAST, r)}`,
        jobTitle,
        dept,
        subject: subject || null,
        duty: dutyName,
        salary: jobTitle === "Teacher" ? randInt(r, 32000, 52000) : randInt(r, 38000, 95000),
      });
    }
  };
  add("Principal", "Administration", null, 1, "principal");
  add("Vice Principal", "Administration", null, 1, "vicePrincipal");
  add("Teacher", "Academics", "Mathematics", 1, "hod");
  add("Teacher", "Academics", "Science", 1, "hod");
  add("Exam Coordinator", "Academics", null, 1, "examCoordinator");
  add("Accountant", "Finance", null, 2, "accountant");
  add("Front Office", "Administration", null, 2, "frontOffice");
  add("Librarian", "Library", null, 1, "librarian");
  add("Transport Incharge", "Transport", null, 1, "transportIncharge");
  add("Warden", "Hostel", null, 1, "warden");
  add("HR Manager", "Administration", null, 1, "hrManager");
  add("Admissions Officer", "Admissions", null, 2, "admissionsOfficer");
  add("IT Admin", "IT", null, 1, "itAdmin");
  // 38 classroom teachers spread across the 8 subjects.
  for (const sub of SUBJECTS) {
    const n = sub === "Hindi" || sub === "Arts" || sub === "Physical Education" ? 3 : 5;
    for (let i = 0; i < n; i++) {
      staff.push({
        staffId: `${code}-${100 + staff.length}`,
        name: `${pick(FIRST, r)} ${pick(LAST, r)}`,
        jobTitle: "Teacher",
        dept: sub,
        subject: sub,
        duty: "teacher",
        salary: randInt(r, 32000, 52000),
      });
    }
  }
  return staff;
}

async function resetSchoolData(schoolId) {
  const deletes = [
    prisma.lessonProgress.deleteMany({ where: { topic: { schoolId } } }),
    prisma.syllabusTopic.deleteMany({ where: { schoolId } }),
    prisma.bedAssignment.deleteMany({ where: { room: { building: { schoolId } } } }),
    prisma.hostelRoom.deleteMany({ where: { building: { schoolId } } }),
    prisma.building.deleteMany({ where: { schoolId } }),
    prisma.maintenanceRequest.deleteMany({ where: { schoolId } }),
    prisma.purchaseRecord.deleteMany({ where: { schoolId } }),
    prisma.issueLog.deleteMany({ where: { schoolId } }),
    prisma.inventoryItem.deleteMany({ where: { schoolId } }),
    prisma.bookIssue.deleteMany({ where: { schoolId } }),
    prisma.book.deleteMany({ where: { schoolId } }),
    prisma.gatePass.deleteMany({ where: { schoolId } }),
    prisma.visitor.deleteMany({ where: { schoolId } }),
    prisma.hostMapping.deleteMany({ where: { schoolId } }),
    prisma.studentRoute.deleteMany({ where: { schoolId } }),
    prisma.vehicle.deleteMany({ where: { schoolId } }),
    prisma.transportRoute.deleteMany({ where: { schoolId } }),
    prisma.homeworkSubmission.deleteMany({ where: { homework: { schoolId } } }),
    prisma.homework.deleteMany({ where: { schoolId } }),
    prisma.diaryEntry.deleteMany({ where: { schoolId } }),
    prisma.copyCheckEntry.deleteMany({ where: { batch: { schoolId } } }),
    prisma.copyCheckBatch.deleteMany({ where: { schoolId } }),
    prisma.certificateRecord.deleteMany({ where: { schoolId } }),
    prisma.leaveBalance.deleteMany({ where: { schoolId } }),
    prisma.leaveRequest.deleteMany({ where: { schoolId } }),
    prisma.payrollRecord.deleteMany({ where: { schoolId } }),
    prisma.incomeExpenseRecord.deleteMany({ where: { schoolId } }),
    prisma.admissionInquiry.deleteMany({ where: { schoolId } }),
    prisma.task.deleteMany({ where: { schoolId } }),
    prisma.schoolEvent.deleteMany({ where: { schoolId } }),
    prisma.notice.deleteMany({ where: { schoolId } }),
    prisma.album.deleteMany({ where: { schoolId } }),
    prisma.payment.deleteMany({ where: { schoolId } }),
    prisma.studentFeeLedger.deleteMany({ where: { schoolId } }),
    prisma.timetableEntry.deleteMany({ where: { schoolId } }),
    prisma.attendanceRecord.deleteMany({ where: { schoolId } }),
    prisma.examMark.deleteMany({ where: { schoolId } }),
  ];
  await Promise.all(deletes);
}

function amountForClass(cls) {
  const c = parseInt(cls, 10);
  if (c <= 5) return 18000;
  if (c <= 8) return 22000;
  if (c <= 10) return 26000;
  return 30000;
}

const FEEDBACK = [
  "Well prepared", "Needs more practice", "Excellent attempt", "Good, keep improving",
  "Shows clear understanding", "Could not focus", "Improved from last term",
];

async function seedSchool(cfg, getHash) {
  const { code, name, board, address, adminName } = cfg;
  const r = rng(code.split("").reduce((a, c) => a + c.charCodeAt(0), 0));

  let school = await prisma.school.findUnique({ where: { code } });
  if (!school) {
    school = await prisma.school.create({
      data: { name, code, board, address, session: SESSION },
    });
  }
  const schoolId = school.id;
  await resetSchoolData(schoolId);

  // School settings
  await prisma.schoolSettings.upsert({
    where: { schoolId },
    create: { schoolId, term: 2, grading: "CGPA", academicSession: SESSION },
    update: { term: 2, grading: "CGPA", academicSession: SESSION },
  });

  // Classes (1-12, sections A & B) and subjects
  const classes = [];
  for (let c = 1; c <= 12; c++) {
    for (const sec of ["A", "B"]) {
      const clsVal = String(c);
      await prisma.schoolClass.upsert({
        where: { schoolId_cls_section: { schoolId, cls: clsVal, section: sec } },
        create: { schoolId, cls: clsVal, section: sec },
        update: {},
      });
      classes.push({ cls: clsVal, section: sec });
    }
  }
  for (const sub of SUBJECTS) {
    await prisma.schoolSubject.upsert({
      where: { schoolId_name: { schoolId, name: sub } },
      create: { schoolId, name: sub, code: sub.slice(0, 4).toUpperCase(), order: SUBJECTS.indexOf(sub) },
      update: {},
    });
  }
  for (const term of FEES_TERMS) {
    await prisma.examConfig.upsert({
      where: { schoolId_term: { schoolId, term } },
      create: { schoolId, term },
      update: {},
    });
  }

  // ---------------- Staff ----------------
  const staffPool = buildStaffPool(code, r);
  const staffByDuty = { principal: null, vicePrincipal: null, accountant: [], frontOffice: [], librarian: null, transportIncharge: null, hrManager: null, admissionsOfficer: [], itAdmin: null };
  const teacherStaff = [];
  const staffById = new Map();
  for (const s of staffPool) {
    const rec = await prisma.staff.upsert({
      where: { schoolId_staffId: { schoolId, staffId: s.staffId } },
      create: {
        schoolId,
        staffId: s.staffId,
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
        qualification: "M.Sc / M.A",
        email: `${s.staffId.toLowerCase()}@vidyaloop.local`,
        phone: `+91 9${randInt(r, 100000000, 999999999)}`,
        assignedClass: s.jobTitle === "Teacher" ? String(randInt(r, 1, 12)) : null,
        assignedSection: s.jobTitle === "Teacher" ? (r() > 0.5 ? "A" : "B") : null,
        salary: s.salary,
        joined: `202${randInt(r, 0, 4)}-${String(randInt(r, 1, 6)).padStart(2, "0")}-01`,
      },
      update: {
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
        salary: s.salary,
        status: "Active",
      },
    });
    staffById.set(s.staffId, rec);
    if (s.duty === "teacher") teacherStaff.push(rec);
    else if (s.duty === "principal") staffByDuty.principal = rec;
    else if (s.duty === "vicePrincipal") staffByDuty.vicePrincipal = rec;
    else if (s.duty === "accountant") staffByDuty.accountant.push(rec);
    else if (s.duty === "frontOffice") staffByDuty.frontOffice.push(rec);
    else if (s.duty === "librarian") staffByDuty.librarian = rec;
    else if (s.duty === "transportIncharge") staffByDuty.transportIncharge = rec;
    else if (s.duty === "hrManager") staffByDuty.hrManager = rec;
    else if (s.duty === "admissionsOfficer") staffByDuty.admissionsOfficer.push(rec);
    else if (s.duty === "itAdmin") staffByDuty.itAdmin = rec;
  }

  // Admin + duty + teacher users
  const adminUser = await prisma.user.upsert({
    where: { username: `admin-${code}` },
    create: {
      email: `admin-${code}@vidyaloop.local`,
      username: `admin-${code}`,
      passwordHash: await getHash("admin123"),
      role: "schoolAdmin",
      name: adminName,
      schoolId,
      isActive: true,
      mustChangePassword: false,
    },
    update: { passwordHash: await getHash("admin123"), schoolId, name: adminName, isActive: true, mustChangePassword: false },
  });
  void adminUser;

  const teacherLead = (await prisma.staff.findFirst({ where: { schoolId, jobTitle: "Teacher" } })).id;
  await prisma.user.upsert({
    where: { username: `teacher-${code}` },
    create: {
      email: `teacher-${code}@vidyaloop.local`,
      username: `teacher-${code}`,
      passwordHash: await getHash("teacher123"),
      role: "staff",
      duties: ["teacher"],
      name: staffById.get(staffPool.find((s) => s.duty === "teacher").staffId).name,
      schoolId,
      staffId: teacherLead,
      isActive: true,
      mustChangePassword: false,
    },
    update: { passwordHash: await getHash("teacher123"), schoolId, staffId: teacherLead, isActive: true, mustChangePassword: false },
  });

  const dutyAccounts = [
    ["accountant", "accountant", staffByDuty.accountant[0]?.id],
    ["frontoffice", "frontOffice", staffByDuty.frontOffice[0]?.id],
    ["transport", "transportIncharge", staffByDuty.transportIncharge?.id],
    ["librarian", "librarian", staffByDuty.librarian?.id],
    ["hr", "hrManager", staffByDuty.hrManager?.id],
    ["admissions", "admissionsOfficer", staffByDuty.admissionsOfficer[0]?.id],
  ];
  for (const [slug, duty, staffId] of dutyAccounts) {
    if (!staffId) continue;
    const rec = staffById.get(staffPool.find((s) => s.duty === duty)?.staffId);
    await prisma.user.upsert({
      where: { username: `${slug}-${code}` },
      create: {
        email: `${slug}-${code}@vidyaloop.local`,
        username: `${slug}-${code}`,
        passwordHash: await getHash(`${slug}123`),
        role: "staff",
        duties: [duty],
        name: rec?.name || code,
        schoolId,
        staffId,
        isActive: true,
        mustChangePassword: false,
      },
      update: { passwordHash: await getHash(`${slug}123`), schoolId, staffId, isActive: true, mustChangePassword: false },
    });
  }

  // ---------------- Students + parents (1000/school, batched raw inserts) ----------------
  const existingSt = await prisma.student.findMany({
    where: { schoolId },
    select: { admNo: true, id: true },
  });
  const existingByAdm = new Map(existingSt.map((x) => [x.admNo, x.id]));

  const students = [];
  const newStudentDocs = [];
  const studentOid = (id) => new ObjectId(id);
  let admSeq = 0;
  for (const c of classes) {
    for (let k = 0; k < 42 && admSeq < 1000; k++) {
      admSeq += 1;
      const admNo = `${code}${String(admSeq).padStart(4, "0")}`;
      const firstName = pick(FIRST, r);
      const lastName = pick(LAST, r);
      const father = `${pick(FIRST, r)} ${lastName}`;
      const mother = `${pick(FIRST, r)} ${lastName}`;
      const existingId = existingByAdm.get(admNo);
      const rec = {
        schoolId,
        admNo,
        name: `${firstName} ${lastName}`,
        cls: c.cls,
        section: c.section,
        roll: k + 1,
        session: SESSION,
        batch: `${parseInt(c.cls, 10) + 3}-${parseInt(c.cls, 10) + 8}`,
        dob: `${randInt(r, 2008, 2018)}-${String(randInt(r, 1, 12)).padStart(2, "0")}-${String(randInt(r, 1, 28)).padStart(2, "0")}`,
        bloodGroup: pick(BLOOD, r),
        fatherName: father,
        fatherPhone: `+91 9${randInt(r, 100000000, 999999999)}`,
        fatherEmail: `${admNo}-parent@vidyaloop.local`,
        motherName: mother,
        emergency: `+91 9${randInt(r, 100000000, 999999999)}`,
        address: `${randInt(r, 1, 99)} ${pick(["Sector", "Street", "Colony"], r)} ${randInt(r, 1, 25)}, ${pick(["Gurugram", "New Delhi", "Noida", "Faridabad"], r)}`,
        status: "Active",
      };
      rec.id = existingId || new ObjectId().toString();
      if (!existingId) {
        const { id: _ignore, schoolId: _ignoreSchoolId, ...studentData } = rec;
        newStudentDocs.push({
          ...studentData,
          _id: studentOid(rec.id),
          schoolId: studentOid(schoolId),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      students.push(rec);
    }
  }
  if (newStudentDocs.length) {
    await ignoreDuplicates(() =>
      mongoDb.collection("Student").insertMany(newStudentDocs, { ordered: false })
    );
  }

  const parentHash = await getHash("parent123");
  const existingParents = await prisma.user.findMany({
    where: { schoolId, role: "parent" },
    select: { username: true },
  });
  const existingParentSet = new Set(existingParents.map((u) => u.username));
  const newParentDocs = [];
  for (const s of students) {
    const username = `${s.admNo}-p`;
    if (existingParentSet.has(username)) continue;
    newParentDocs.push({
      _id: new ObjectId(),
      email: `${s.admNo}-parent@vidyaloop.local`,
      username,
      passwordHash: parentHash,
      role: "parent",
      name: s.fatherName || `Parent of ${s.name}`,
      schoolId: studentOid(schoolId),
      studentId: studentOid(s.id),
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  if (newParentDocs.length) {
    await ignoreDuplicates(() =>
      mongoDb.collection("User").insertMany(newParentDocs, { ordered: false })
    );
  }
  const studentById = new Map(students.map((s) => [s.id, s]));

  // ---------------- Fees ----------------
  const feeComponents = [
    ["Tuition Fee", "TUITION", "Annual"],
    ["Registration Fee", "REG", "One-Time"],
    ["Development Fund", "DEVFUND", "Annual"],
    ["Examination Fee", "EXAM", "Annual"],
    ["Sports Fee", "SPORTS", "Annual"],
    ["Library Fee", "LIB", "Annual"],
    ["Transport Fee", "TRANSPORT", "Annual"],
    ["Laboratory Fee", "LAB", "Annual"],
  ];
  for (const [fName, fCode, fType] of feeComponents) {
    await prisma.feeComponent.upsert({
      where: { schoolId_name: { schoolId, name: fName } },
      create: { schoolId, name: fName, code: fCode, type: fType },
      update: {},
    });
  }
  const structures = [];
  for (const c of classes) {
    const amount = amountForClass(c.cls) + (c.section === "B" ? 1000 : 0);
    const rec = await prisma.feeStructure.upsert({
      where: { schoolId_cls_session: { schoolId, cls: c.cls, session: SESSION } },
      create: { schoolId, cls: c.cls, session: SESSION, amount },
      update: { amount },
    });
    structures.push({ cls: c.cls, section: c.section, amount });
  }

  const termAmount = (s) => {
    const st = structures.find((x) => x.cls === s.cls && x.section === s.section);
    return (st?.amount || 18000) / 2;
  };
  const DUE1 = new Date("2024-10-15");
  const DUE2 = new Date("2025-02-15");

  const ledgerRows = [];
  const RECTYPES = ["ONLINE", "CASH", "UPI", "CHEQUE"];
  let receiptSeq = 1;
  const paymentRows = [];
  for (const s of students) {
    const amt = termAmount(s);
    for (const term of FEES_TERMS) {
      const isT1 = term === "Term 1";
      const roll = r();
      let status = "UNPAID";
      if (isT1) status = roll < 0.75 ? "PAID" : roll < 0.9 ? "PARTIAL" : "UNPAID";
      else status = roll < 0.45 ? "PAID" : roll < 0.7 ? "PARTIAL" : "UNPAID";
      const paid = status === "PAID" ? amt : status === "PARTIAL" ? Math.round(amt * 0.5) : 0;
      ledgerRows.push({
        schoolId,
        studentId: s.id,
        session: SESSION,
        term,
        amount: amt,
        dueDate: isT1 ? DUE1 : DUE2,
        paid,
        status,
      });
      if (paid > 0) {
        paymentRows.push({
          schoolId,
          studentId: s.id,
          amount: paid,
          paymentMode: pick(RECTYPES, r),
          receiptNo: `RCP-${code}-${String(receiptSeq++).padStart(5, "0")}`,
          paidAt: new Date(isT1 ? "2024-08-05" : "2025-01-20").getTime() + randInt(r, 0, 60) * DAY_MS,
        });
      }
    }
  }
  await bulkInsert("StudentFeeLedger", ledgerRows, ["schoolId", "studentId"]);
  await bulkInsert("Payment", paymentRows.map((p) => ({ ...p, paidAt: new Date(p.paidAt) })), ["schoolId", "studentId"]);

  // ---------------- Timetable ----------------
  const subjectGrid = [
    ["Mathematics", "English", "Science", "Mathematics", "Social Sci."],
    ["English", "Mathematics", "Social Sci.", "Science", "Mathematics"],
    ["Science", "Hindi", "Mathematics", "English", "Computer"],
    ["Social Sci.", "Science", "English", "Hindi", "Science"],
    ["Computer", "Social Sci.", "Hindi", "Mathematics", "English"],
  ];
  const teacherForSubject = new Map();
  for (const sub of SUBJECTS) {
    teacherForSubject.set(sub, teacherStaff.find((t) => (t.subject || "").replace(".", "") === sub.replace(".", "")) || teacherStaff[0]);
  }
  const ttRows = [];
  for (const c of classes) {
    for (let p = 0; p < 5; p++) {
      for (let d = 0; d < 5; d++) {
        const subject = subjectGrid[p][d];
        ttRows.push({
          schoolId,
          cls: c.cls,
          section: c.section,
          day: DAYS[d],
          period: PERIODS[p],
          subject,
          room: `${200 + p}`,
          staffId: teacherForSubject.get(subject)?.id || null,
        });
      }
    }
  }
  await bulkInsert("TimetableEntry", ttRows, ["schoolId", "staffId"]);

  // ---------------- Attendance (~45k/school) ----------------
  const attDays = workingDays("2024-09-02", "2025-01-31").slice(0, 45);
  const attDocs = [];
  for (const s of students) {
    for (const date of attDays) {
      const rr = r();
      attDocs.push({
        schoolId,
        studentId: s.id,
        cls: s.cls,
        section: s.section,
        date,
        status: rr < 0.9 ? "P" : rr < 0.97 ? "A" : "L",
      });
    }
  }
  await bulkInsert("AttendanceRecord", attDocs, ["schoolId", "studentId"]);

  // ---------------- Exam marks (4 terms x 8 subjects x 1000) ----------------
  const EXAM_TERMS_1 = ["Term 1", "Mid-Term", "Term 2", "Final"];
  const examRows = [];
  for (const s of students) {
    for (const term of EXAM_TERMS_1) {
      for (const sub of SUBJECTS) {
        const isFinal = term === "Final";
        const maxMarks = ["Physical Education", "Arts"].includes(sub) ? 50 : 100;
        const pct = isFinal ? randInt(r, 25, 98) : randInt(r, 30, 96);
        const marks = Math.round((maxMarks * pct) / 100);
        examRows.push({
          schoolId,
          studentId: s.id,
          session: SESSION,
          term,
          cls: s.cls,
          section: s.section,
          subject: sub,
          marksObtained: marks,
          maxMarks,
          grade: gradeFor(marks, maxMarks),
          remarks: pick(FEEDBACK, r),
        });
      }
    }
  }
  await bulkInsert("ExamMark", examRows, ["schoolId", "studentId"]);

  // ---------------- Payroll (6 months x staff) ----------------
  const months = ["July 2024", "August 2024", "September 2024", "October 2024", "November 2024", "December 2024"];
  const payRows = [];
  for (const st of staffById.values()) {
    for (const month of months) {
      const basic = st.salary || 35000;
      const allowances = Math.round(basic * 0.15);
      const deductions = Math.round(basic * 0.08);
      payRows.push({
        schoolId,
        staffId: st.staffId,
        staffName: st.name,
        role: st.jobTitle,
        month,
        basicSalary: basic,
        allowances,
        deductions,
        netSalary: basic + allowances - deductions,
        status: "PAID",
        paymentDate: new Date(`${month.split(" ")[0]} 28, 2024`),
        paymentMode: pick(["BANK_TRANSFER", "CHEQUE", "ONLINE"], r),
      });
    }
  }
  await bulkInsert("PayrollRecord", payRows, ["schoolId"]);

  // ---------------- Income & Expense ----------------
  const incomeRows = [];
  for (const c of classes) {
    incomeRows.push({
      schoolId,
      type: "INCOME",
      category: "Tuition Fees",
      title: `${c.cls}-${c.section} Term 1 fee collection`,
      amount: amountForClass(c.cls) * 20,
      date: new Date(2024, 7, 10),
      voucherNo: `INC-${code}-${100 + c.cls.split("").reduce((a, b) => a + b.charCodeAt(0), 0) + (c.section === "A" ? 0 : 1)}`,
      paymentMethod: "ONLINE",
      recordedBy: "Finance Office",
      notes: "Bulk term fee collection",
    });
  }
  const expenseRows = [];
  for (const cat of ["Maintenance", "Utilities", "Salaries", "Events"]) {
    expenseRows.push({
      schoolId,
      type: "EXPENSE",
      category: cat,
      title: `${cat} expenses - ${code}`,
      amount: randInt(r, 150000, 800000),
      date: new Date(2024, 7 + randInt(r, 0, 4), 15),
      voucherNo: `EXP-${code}-${randInt(r, 100, 999)}`,
      paymentMethod: "BANK_TRANSFER",
      recordedBy: "Finance Office",
    });
  }
  await chunked([...incomeRows, ...expenseRows], 100, (e) => prisma.incomeExpenseRecord.create({ data: { ...e, date: new Date(e.date) } }));

  // ---------------- Certificates ----------------
  const CERT_TYPES = ["Transfer Certificate", "Character Certificate", "Bonafide Certificate", "Merit Certificate"];
  const certRows = [];
  for (let i = 0; i < 60; i++) {
    const s = students[Math.floor(r() * students.length)];
    certRows.push({
      schoolId,
      studentId: s.admNo,
      studentName: s.name,
      cls: s.cls,
      section: s.section,
      type: pick(CERT_TYPES, r),
      certificateNo: `${code}-CERT-${String(i + 1).padStart(4, "0")}`,
      issueDate: new Date(2024, 8 + (i % 4), randInt(r, 1, 28)),
      status: "ISSUED",
      conduct: pick(["Good", "Very Good", "Excellent"], r),
      remarks: "Issued as per policy",
      issuedBy: "School Office",
    });
  }
  await chunked(certRows, 100, (c) => prisma.certificateRecord.create({ data: { ...c, issueDate: new Date(c.issueDate) } }));

  // ---------------- Leave balances + requests ----------------
  const LEAVE_TYPES = ["Sick", "Casual", "Earned", "Privilege"];
  const leaveBalRows = [];
  for (const st of staffById.values()) {
    for (const lt of LEAVE_TYPES) {
      const entitled = lt === "Sick" ? 12 : lt === "Casual" ? 14 : lt === "Earned" ? 20 : 18;
      leaveBalRows.push({
        schoolId,
        staffId: st.id,
        staffName: st.name,
        year: 2024,
        leaveType: lt,
        entitled,
        used: randInt(r, 0, Math.min(6, entitled)),
      });
    }
  }
  await chunked(leaveBalRows, 100, (l) => prisma.leaveBalance.upsert({
    where: { schoolId_staffId_year_leaveType: { schoolId, staffId: l.staffId, year: 2024, leaveType: l.leaveType } },
    create: l,
    update: { used: l.used },
  }));

  const leaveReqRows = [];
  for (let i = 0; i < 30; i++) {
    const st = staffPool[Math.floor(r() * staffPool.length)];
    const rec = staffById.get(st.staffId);
    const start = new Date(2024, 8 + randInt(r, 0, 3), randInt(r, 1, 20));
    const days = randInt(r, 1, 4);
    const end = new Date(start.getTime() + (days - 1) * DAY_MS);
    const statusR = r();
    leaveReqRows.push({
      schoolId,
      applicantType: "STAFF",
      applicantId: rec.id,
      applicantName: rec.name,
      roleOrClass: rec.jobTitle,
      leaveType: pick(["Sick", "Casual", "Privilege", "Emergency"], r),
      startDate: start,
      endDate: end,
      totalDays: days,
      reason: pick(["Medical appointment", "Family function", "Personal work", "Travel plans"], r),
      status: statusR < 0.5 ? "APPROVED" : statusR < 0.8 ? "PENDING" : "REJECTED",
      actionBy: "admin",
      actionComment: statusR < 0.8 ? null : "Insufficient notice",
    });
  }
  for (let i = 0; i < 12; i++) {
    const s = students[Math.floor(r() * students.length)];
    const start = new Date(2024, 8 + randInt(r, 0, 3), randInt(r, 1, 20));
    leaveReqRows.push({
      schoolId,
      applicantType: "STUDENT",
      applicantId: s.id,
      applicantName: s.name,
      roleOrClass: `${s.cls}-${s.section}`,
      leaveType: pick(["Sick", "Casual"], r),
      startDate: start,
      endDate: new Date(start.getTime() + randInt(r, 0, 2) * DAY_MS),
      totalDays: randInt(r, 1, 3),
      reason: pick(["Fever", "Family function", "Exam preparation"], r),
      status: "PENDING",
    });
  }
  await chunked(leaveReqRows, 100, (l) => prisma.leaveRequest.create({ data: l }));

  // ---------------- Events & Notices & Tasks ----------------
  const eventRows = [
    ["Annual Sports Day", "Annual sports meet with athletics and team games", "Sports", "2024-12-20"],
    ["Independence Day", "Flag hoisting ceremony and cultural program", "Event", "2024-08-15"],
    ["Republic Day", "March past and cultural celebration", "Event", "2025-01-26"],
    ["Diwali Break", "School holiday for Diwali", "Holiday", "2024-10-31"],
    ["Parent Teacher Meeting", "Term 1 PTM for all classes", "Event", "2024-12-05"],
    ["Science Fair", "Inter-class science exhibition", "Event", "2025-01-18"],
    ["Foundation Day", "School founding day celebration", "Event", "2024-11-15"],
    ["Winter Break", "School closed for winter vacation", "Holiday", "2024-12-25"],
  ];
  for (const [title, sub, type, date] of eventRows) {
    await prisma.schoolEvent.create({ data: { schoolId, title, sub, date: new Date(date), type } });
  }

  const noticeRows = [];
  for (let i = 0; i < 14; i++) {
    noticeRows.push({
      schoolId,
      title: pick(["Fee payment reminder", "PTM schedule", "PTA meeting", "Exam time table", "School uniform update", "Library timings", "Bus route change"], r),
      body: pick(["Please ensure all dues are cleared before the deadline.", "All parents are requested to attend the meeting.", "Please follow the updated schedule on the notice board.", "Kindly reach school 10 minutes early on exam days."], r),
      audience: r() > 0.5 ? "all" : "class",
      cls: r() > 0.5 ? null : String(randInt(r, 1, 12)),
      section: r() > 0.5 ? null : (r() > 0.5 ? "A" : "B"),
      createdById: adminUser.id,
    });
  }
  await chunked(noticeRows, 50, (n) => prisma.notice.create({ data: n }));

  const taskRows = [];
  for (let i = 0; i < 18; i++) {
    taskRows.push({
      schoolId,
      title: pick(["Prepare month-end report", "Update student records", "Organize sports equipment", "Coordinate PTM logistics", "Review payroll sheets", "Update notice board"], r),
      description: "Routine school management task.",
      assigneeName: staffPool[Math.floor(r() * staffPool.length)].name,
      assignedByName: adminName,
      dueDate: new Date(2024, 9 + randInt(r, 0, 3), randInt(r, 1, 28)),
      priority: pick(["LOW", "MEDIUM", "HIGH"], r),
      status: pick(["PENDING", "IN_PROGRESS", "COMPLETED"], r),
      category: pick(["Operations", "Finance", "Academics", "Admin"], r),
    });
  }
  await chunked(taskRows, 50, (t) => prisma.task.create({ data: { ...t, dueDate: new Date(t.dueDate) } }));

  // ---------------- Library ----------------
  const TITLES = [
    "Mathematics Textbook", "Physics Essentials", "Chemistry in Context", "Biology Explorer",
    "English Grammar & Composition", "World History", "Geography Atlas", "Computer Science Basics",
    "Hindi Sahitya", "Art of Drawing", "Physical Fitness Guide", "General Science",
    "Civics and Polity", "Quantitative Aptitude", "Verbal Ability", "Environmental Studies",
  ];
  const AUTHORS = ["R.K. Verma", "S.L. Arora", "Neeraj Sinha", "Anita Deshpande", "David Hall", "Meera Nair", "Rohit Mehra", "Priya Ananth"];
  const bookRows = [];
  for (let i = 0; i < 400; i++) {
    const title = `${pick(TITLES, r)} Vol ${randInt(r, 1, 9)}`;
    bookRows.push({
      schoolId,
      isbn: `${code}-${String(i + 1).padStart(4, "0")}`,
      title,
      author: pick(AUTHORS, r),
      category: pick(["Textbook", "Reference", "Fiction", "Non-fiction", "Magazine"], r),
      totalCopies: randInt(r, 2, 12),
      availableCopies: randInt(r, 0, 12),
      location: `Shelf-${randInt(r, 1, 20)}`,
    });
  }
  await bulkInsert("Book", bookRows, ["schoolId"]);

  const issuedBooks = await prisma.book.findMany({ where: { schoolId, availableCopies: { gt: 0 } }, take: 60 });
  await chunked(issuedBooks.slice(0, 40), 20, (b) =>
    prisma.bookIssue.create({
      data: {
        schoolId,
        bookId: b.id,
        studentId: students[Math.floor(r() * students.length)].id,
        issueDate: new Date(2024, 8 + randInt(r, 0, 3), randInt(r, 1, 25)),
        dueDate: new Date(2025, 0, 15),
        status: "ISSUED",
      },
    })
  );

  // ---------------- Transport ----------------
  const routesData = [
    ["Route A", "Sector 32", "Galleria", "Tower 7"],
    ["Route B", "Old Fort Colony", "City Center", "Lake Park"],
    ["Route C", "University Road", "Model Town", "Green Hills"],
    ["Route D", "Railway Colony", "Bus Stand", "Jharsa Chowk"],
    ["Route E", "Cyber City", "DLF Phase 2", "Sikanderpur"],
    ["Route F", "Airport Road", "Cantonment", "Mall Road"],
  ];
  const vehiclesData = [];
  for (let i = 0; i < 6; i++) {
    vehiclesData.push({
      schoolId,
      plateNumber: `${code}-${1000 + i}`,
      type: i === 5 ? "Van" : "Bus",
      capacity: i === 5 ? 24 : 48,
      driverName: `${pick(FIRST, r)} ${pick(LAST, r)}`,
      driverPhone: `+91 9${randInt(r, 100000000, 999999999)}`,
      permitExpiry: new Date(2025, 2, 31),
      insuranceExpiry: new Date(2025, 2, 31),
      status: "Active",
    });
  }
  const vehicles = [];
  for (const v of vehiclesData) {
    const existing = await prisma.vehicle.findFirst({ where: { schoolId, plateNumber: v.plateNumber } });
    if (existing) await prisma.vehicle.update({ where: { id: existing.id }, data: { ...v } });
    else vehicles.push(await prisma.vehicle.create({ data: v }));
  }
  const vids = vehicles;
  const routeIds = [];
  for (let i = 0; i < routesData.length; i++) {
    const [rName, s1, s2, s3] = routesData[i];
    const existing = await prisma.transportRoute.findFirst({ where: { schoolId, name: rName } });
    const data = {
      schoolId,
      name: rName,
      stops: [
        { name: s1, time: "07:30" },
        { name: s2, time: "07:45" },
        { name: s3, time: "08:00" },
        { name: "School", time: "08:20" },
      ],
      vehicleId: vids[i]?.id || null,
    };
    if (existing) {
      await prisma.transportRoute.update({ where: { id: existing.id }, data });
      routeIds.push(existing.id);
    } else {
      const nr = await prisma.transportRoute.create({ data });
      routeIds.push(nr.id);
    }
  }
  const assignRows = [];
  for (let i = 0; i < 200; i++) {
    const s = students[Math.floor(r() * students.length)];
    const routeIdx = Math.floor(r() * routeIds.length);
    assignRows.push({
      schoolId,
      studentId: s.id,
      routeId: routeIds[routeIdx],
      stopName: routesData[routeIdx][1 + Math.floor(r() * 3)],
      monthlyFee: randInt(r, 500, 1200),
    });
  }
  await bulkInsert("StudentRoute", assignRows, ["schoolId", "studentId", "routeId"]);

  // ---------------- Hostel ----------------
  const bNames = ["Boys Hostel", "Girls Hostel", "Residential Block"];
  await chunked(bNames, 1, (bName) => prisma.building.create({ data: { schoolId, name: bName, type: "Hostel", floors: 3 } }));
  const buildings = await prisma.building.findMany({ where: { schoolId } });
  const rooms = [];
  for (const b of buildings) {
    for (let fl = 1; fl <= 3; fl++) {
      for (let rn = 1; rn <= 6; rn++) {
        rooms.push({
          buildingId: b.id,
          floor: fl,
          roomNumber: `${fl}0${rn}`,
          bedCount: 2,
          roomType: b.name === "Residential Block" ? "Premium" : "Standard",
          status: r() > 0.75 ? "AVAILABLE" : "OCCUPIED",
        });
      }
    }
  }
  await chunked(rooms, 100, (room) => prisma.hostelRoom.create({ data: room }));
  const availRooms = await prisma.hostelRoom.findMany({ where: { building: { schoolId } }, take: 60 });
  const bedRows = [];
  for (let i = 0; i < Math.min(availRooms.length, 50); i++) {
    bedRows.push({
      roomId: availRooms[i].id,
      bedNumber: 1,
      studentId: students[i].id,
      session: SESSION,
    });
  }
  await chunked(bedRows, 50, (bed) => prisma.bedAssignment.create({ data: { ...bed, bedNumber: 2 } }));
  await chunked(bedRows, 50, (bed) => prisma.bedAssignment.create({ data: bed }));

  // ---------------- Inventory ----------------
  const INV = [
    ["Whiteboard Markers", "Stationery", 240], ["Printer Paper (reams)", "Stationery", 300],
    ["Chalk Sticks (boxes)", "Stationery", 200], ["Notebooks", "Stationery", 500],
    ["Sports Balls", "Sports", 40], ["Chess Boards", "Sports", 15], ["Badminton Rackets", "Sports", 20],
    ["Science Lab Chemicals", "Lab", 30], ["Microscopes", "Lab", 12], ["Test Tubes (pks)", "Lab", 80],
    ["Desktop Computers", "Electronics", 25], ["Printers", "Electronics", 8], ["Projectors", "Electronics", 10],
    ["Fans", "Furniture", 40], ["Desks", "Furniture", 120], ["Chairs", "Furniture", 300],
    ["Cleaning Supplies", "Housekeeping", 60], ["First Aid Kits", "Medical", 20],
    ["Uniforms (sets)", "Apparel", 150], ["Shoes", "Apparel", 120],
  ];
  const items = [];
  for (const [iname, cat, stock] of INV) {
    items.push(await prisma.inventoryItem.create({
      data: { schoolId, name: iname, category: cat, currentStock: stock, reorderLevel: 10, unitPrice: randInt(r, 20, 3000), unit: "pcs", location: `Store ${randInt(r, 1, 5)}` },
    }));
  }
  await chunked(items.slice(0, 10), 5, (it) => prisma.purchaseRecord.create({
    data: { schoolId, itemId: it.id, quantity: 20, vendorName: pick(["Stationery Hub", "Office Mart", "Lab Equip Co", "School Supply"], r), invoiceNo: `INV-${randInt(r, 1000, 9999)}`, totalCost: 20 * it.unitPrice, purchaseDate: new Date(2024, 7, randInt(r, 1, 28)), recordedBy: "Store Keeper" },
  }));

  // ---------------- Front Office (visitors) ----------------
  const visitorRows = [];
  for (let i = 0; i < 28; i++) {
    visitorRows.push({
      schoolId,
      name: `${pick(FIRST, r)} ${pick(LAST, r)}`,
      phone: `+91 9${randInt(r, 100000000, 999999999)}`,
      purpose: pick(["Meeting Principal", "Campus Visit", "Fee Inquiry", "Deliver Documents", "Parent Meeting"], r),
      hostStaffName: staffPool[Math.floor(r() * staffPool.length)].name,
      checkInTime: new Date(2024, 9 + randInt(r, 0, 2), randInt(r, 1, 28), 9, randInt(r, 0, 59)),
      checkOutTime: r() > 0.2 ? new Date() : null,
      status: r() > 0.2 ? "CHECKED_OUT" : "CHECKED_IN",
    });
  }
  await chunked(visitorRows, 50, (v) => prisma.visitor.create({ data: v }));

  // ---------------- Copy Checking ----------------
  const batchRows = [];
  for (const c of classes) {
    const subject = pick(SUBJECTS, r);
    batchRows.push({
      schoolId,
      subject,
      cls: c.cls,
      section: c.section,
      term: pick(["Term 1", "Term 2"], r),
      totalCopies: 40,
      assignedToName: teacherStaff[Math.floor(r() * teacherStaff.length)].name,
      dueDate: new Date(2024, 10 + randInt(r, 0, 2), 15),
      completedCount: randInt(r, 5, 38),
      status: r() > 0.3 ? "IN_PROGRESS" : "COMPLETED",
    });
  }
  const batches = [];
  for (const b of batchRows) batches.push(await prisma.copyCheckBatch.create({ data: b }));
  await chunked(batches.slice(0, 12), 3, async (b) => {
    const st = students[Math.floor(r() * students.length)];
    await prisma.copyCheckEntry.create({
      data: { batchId: b.id, studentId: st.id, studentName: st.name, marks: randInt(r, 55, 98), maxMarks: 100, checkedAt: new Date() },
    });
  });

  // ---------------- Digital Diary ----------------
  const diaryRows = [];
  for (let i = 0; i < 300; i++) {
    const c = classes[Math.floor(r() * classes.length)];
    const t = teacherStaff[Math.floor(r() * teacherStaff.length)];
    const subject = t.subject || pick(SUBJECTS, r);
    diaryRows.push({
      schoolId,
      cls: c.cls,
      section: c.section,
      subject,
      note: pick(["Completed worksheet on the topic covered.", "Chapter revised with practice questions.", "Group activity for better understanding.", "Overview of the next unit shared.", "Doubt clearing session held."], r),
      homework: r() > 0.4 ? pick(["Solve exercise 5.2 (Q1-10)", "Write a 200-word essay", "Learn spellings for Friday", "Complete the given worksheet", "Revise chapters 3 & 4"], r) : null,
      authorId: t.id,
      authorName: t.name,
      createdAt: new Date(2024, 8 + randInt(r, 0, 4), randInt(r, 1, 28)),
    });
  }
  await bulkInsert("DiaryEntry", diaryRows.map((d) => ({ ...d, createdAt: new Date(d.createdAt) })), ["schoolId", "authorId"]);

  // ---------------- Homework + submissions ----------------
  const hwRows = [];
  for (let i = 0; i < 120; i++) {
    const c = classes[Math.floor(r() * classes.length)];
    const t = teacherStaff[Math.floor(r() * teacherStaff.length)];
    const subject = t.subject || pick(SUBJECTS, r);
    hwRows.push({
      schoolId,
      cls: c.cls,
      section: c.section,
      subject,
      title: pick(["Assignment: Equations", "Essay on Environment", "Chapter Revision", "Practical Lab Report", "Grammar Worksheet", "Map Work"], r),
      description: pick(["Complete and submit by due date.", "Write neatly and highlight key points.", "Submit on notebook or A4 sheet."], r),
      dueDate: new Date(2024, 9 + randInt(r, 0, 2), randInt(r, 5, 28)),
      assignedById: t.id,
      assignedByName: t.name,
      createdAt: new Date(2024, 8 + randInt(r, 0, 4), randInt(r, 1, 25)),
    });
  }
  const homeworks = [];
  for (const hw of hwRows) {
    homeworks.push({
      id: new ObjectId().toString(),
      cls: hw.cls,
      section: hw.section,
      subject: hw.subject,
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      assignedById: hw.assignedById,
      assignedByName: hw.assignedByName,
      createdAt: hw.createdAt,
    });
  }
  if (homeworks.length) {
    await ignoreDuplicates(() =>
      mongoDb.collection("Homework").insertMany(
        homeworks.map((h) => ({
          _id: new ObjectId(h.id),
          schoolId: new ObjectId(schoolId),
          cls: h.cls,
          section: h.section,
          subject: h.subject,
          title: h.title,
          description: h.description,
          dueDate: new Date(h.dueDate),
          assignedById: new ObjectId(h.assignedById),
          assignedByName: h.assignedByName,
          createdAt: new Date(h.createdAt),
          updatedAt: new Date(),
        })),
        { ordered: false }
      )
    );
  }

  const classStudents = new Map();
  for (const s of students) {
    const key = `${s.cls}-${s.section}`;
    if (!classStudents.has(key)) classStudents.set(key, []);
    classStudents.get(key).push(s);
  }
  const subRows = [];
  for (const hw of homeworks) {
    const pool = classStudents.get(`${hw.cls}-${hw.section}`) || [];
    const chosen = pool.slice(0, Math.floor(pool.length * (0.3 + r() * 0.3)));
    for (const s of chosen) {
      subRows.push({
        homeworkId: hw.id,
        studentId: s.id,
        studentName: s.name,
        status: r() > 0.3 ? "Submitted" : "Pending",
        submittedAt: r() > 0.3 ? new Date() : null,
      });
    }
  }
  await bulkInsert("HomeworkSubmission", subRows, ["homeworkId", "studentId"]);

  // ---------------- Syllabus topics ----------------
  const topicRows = [];
  for (const c of classes) {
    for (const sub of SUBJECTS) {
      for (let t = 0; t < 2; t++) {
        topicRows.push({
          schoolId,
          subject: sub,
          cls: c.cls,
          section: c.section,
          topicName: `${sub} topic ${t + 1} - chapter summary`,
          targetDate: new Date(2024, 9 + randInt(r, 0, 2), randInt(r, 1, 28)),
          status: r() > 0.5 ? "COMPLETED" : "PENDING",
        });
      }
    }
  }
  await bulkInsert("SyllabusTopic", topicRows.map((tp) => ({ ...tp, targetDate: new Date(tp.targetDate) })), ["schoolId"]);

  // ---------------- Admissions ----------------
  const STAGES = ["inquiry", "docs", "interaction", "enrolled", "rejected"];
  const inquiryRows = [];
  const firstNames = [...FIRST];
  for (let i = 0; i < 60; i++) {
    inquiryRows.push({
      schoolId,
      name: `${pick(firstNames, r)} ${pick(LAST, r)}`,
      classApplied: String(randInt(r, 1, 12)),
      parentName: `${pick(FIRST, r)} ${pick(LAST, r)}`,
      phone: `+91 9${randInt(r, 100000000, 999999999)}`,
      email: `inquiry${i + 1}-${code}@example.com`,
      prevSchool: pick(["Sunrise Public School", "Greenwood School", "Mount Academy", "Bhagirathi Vidyalaya"], r),
      stage: pick(STAGES, r),
      status: "Active",
    });
  }
  await chunked(inquiryRows, 100, (inq) => prisma.admissionInquiry.create({ data: inq }));

  console.log(
    `  [${code}] done -> students ${students.length}, staff ${staffById.size}, ledger ${ledgerRows.length}, payments ${paymentRows.length}, attendance ${attDocs.length}, exam marks ${examRows.length}, payroll ${payRows.length}, books ${bookRows.length}, diary ${diaryRows.length}, homework ${homeworks.length}`
  );
}

async function main() {
  console.log("Starting Vidyaloop DEMO DATA seed...");
  await connectMongo();
  await wipeAllCollections();

  const getHash = hashCache();

  const existingSuper = await prisma.user.findFirst({ where: { OR: [{ role: "superAdmin" }, { email: (env.superAdmin.email || "superadmin@vidyaloop.in").toLowerCase() }] } });
  const superHash = await getHash(env.superAdmin.password || "Super@1234");
  if (existingSuper) {
    await prisma.user.update({ where: { id: existingSuper.id }, data: { passwordHash: superHash, isActive: true, mustChangePassword: false } });
  } else {
    await prisma.user.create({ data: { name: env.superAdmin.name || "Vidyaloop Super Admin", email: (env.superAdmin.email || "superadmin@vidyaloop.in").toLowerCase(), username: (env.superAdmin.email || "superadmin@vidyaloop.in").toLowerCase(), passwordHash: superHash, role: "superAdmin", isActive: true, mustChangePassword: false } });
  }
  console.log("Super admin ready.");

  for (const cfg of SCHOOLS) {
    console.log(`Seeding ${cfg.name} (${cfg.code})...`);
    await seedSchool(cfg, getHash);
  }

  console.log("\n=======================================================================");
  console.log("   VIDYALOOP DEMO DATA SEED COMPLETE    ");
  console.log("=======================================================================\n");
  console.log("Super Admin : superadmin@vidyaloop.in / Super@1234");
  for (const cfg of SCHOOLS) {
    console.log(`\n${cfg.code} - ${cfg.name}`);
    console.log(`   School Admin : admin-${cfg.code} / admin123`);
    console.log(`   Teacher      : teacher-${cfg.code} / teacher123`);
    console.log(`   Accountant   : accountant-${cfg.code} / accountant123`);
    console.log(`   Front Office : frontoffice-${cfg.code} / frontoffice123`);
    console.log(`   Transport    : transport-${cfg.code} / transport123`);
    console.log(`   Librarian    : librarian-${cfg.code} / librarian123`);
    console.log(`   HR           : hr-${cfg.code} / hr123`);
    console.log(`   Admissions   : admissions-${cfg.code} / admissions123`);
    console.log(`   Parent       : ${cfg.code}0001-p / parent123 (and 999 more)`);
  }
  console.log("\n=======================================================================\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongoClient.close().catch(() => {});
  });