// Seed script: `npm run db:setup` (db push + seed) or `npm run seed`.
//
// Creates (only when the DB is empty):
//  - the first super admin
//  - one demo school + its school admin login
//  - teaching staff (+ teacher portal logins)
//  - students (+ parent portal logins)
//  - weekly timetables for a few class sections
//  - attendance marks for the current month
//
// Generated credentials are printed once on stdout.
const prisma = require("../src/lib/prisma");
const authService = require("../src/modules/auth/auth.service");
const {
  generateTempPassword,
  generateUsername,
} = require("../src/utils/credentials");

const SUPER = {
  name: "Vidyaloop Super Admin",
  email: "superadmin@vidyaloop.in",
  password: "Super@1234",
};

const SCHOOL = {
  name: "Vidyaloop Public School",
  code: "VLPS",
  board: "CBSE",
  address: "Sector 45, Gurugram, Haryana - 122003",
  adminName: "Rajesh Director",
  adminEmail: "admin@vidyaloop.in",
  adminPassword: "Admin@1234",
};

const STAFF = [
  { staffId: "VLS-101", name: "Neha Kulkarni",  jobTitle: "Teacher",        dept: "Mathematics",  subject: "Mathematics"  },
  { staffId: "VLS-102", name: "Arjun Rao",      jobTitle: "Teacher",        dept: "Science",      subject: "Science"      },
  { staffId: "VLS-103", name: "Meera Iyer",     jobTitle: "Teacher",        dept: "English",      subject: "English"      },
  { staffId: "VLS-104", name: "Vikram Singh",   jobTitle: "Vice Principal", dept: "Administration"                        },
  { staffId: "VLS-105", name: "Sunita Joshi",   jobTitle: "Front Office",   dept: "Administration"                        },
  { staffId: "VLS-106", name: "Deepak Chawla",  jobTitle: "Accountant",     dept: "Finance"                               },
];

const STUDENTS = [
  { admNo: "VL2024001", name: "Aarav Sharma", cls: "8",  section: "A", roll: 12, parentName: "Rajesh Sharma", parentEmail: "rajesh.sharma@email.com", fatherName: "Rajesh Sharma", motherName: "Priya Sharma", bloodGroup: "B+", emergency: "+91 98xxxxxx01", dob: "2012-03-14" },
  { admNo: "VL2024002", name: "Ishita Verma", cls: "8",  section: "A", roll: 13 },
  { admNo: "VL2024003", name: "Kabir Mehta",  cls: "9",  section: "B", roll: 5,  parentName: "Mehta Ji", parentEmail: "kabir.parent@email.com" },
  { admNo: "VL2024004", name: "Ananya Nair",  cls: "6",  section: "C", roll: 21 },
  { admNo: "VL2024005", name: "Rohan Gupta",  cls: "10", section: "A", roll: 9,  status: "Inactive" },
  { admNo: "VL2024006", name: "Sanya Kapoor", cls: "7",  section: "B", roll: 17 },
  { admNo: "VL2024007", name: "Dev Malhotra", cls: "8",  section: "A", roll: 14 },
  { admNo: "VL2024008", name: "Riya Chopra",  cls: "8",  section: "A", roll: 15 },
  { admNo: "VL2024009", name: "Yash Bansal",  cls: "8",  section: "A", roll: 16 },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5"];

const SUBJECT_TEACHER = {
  Mathematics: "Neha Kulkarni",
  English: "Meera Iyer",
  Science: "Arjun Rao",
  "Social Sci.": "Vikram Singh",
  Hindi: "Meera Iyer",
  Computer: "Deepak Chawla",
};

// [period][day] grid of subject names
const SUBJECT_GRID = [
  ["Mathematics", "English", "Science", "Mathematics", "Social Sci."],
  ["English", "Mathematics", "Social Sci.", "Science", "Mathematics"],
  ["Science", "Hindi", "Mathematics", "English", "Computer"],
  ["Social Sci.", "Science", "English", "Hindi", "Science"],
  ["Computer", "Social Sci.", "Hindi", "Mathematics", "English"],
];

function classEntries(cls, section) {
  const entries = [];
  for (let p = 0; p < PERIODS.length; p++) {
    for (let d = 0; d < DAYS.length; d++) {
      const subject = SUBJECT_GRID[p][d];
      entries.push({
        cls,
        section,
        day: DAYS[d],
        period: PERIODS[p],
        subject,
        room: subject === "Computer" ? "Lab 1" : `${200 + p}`,
        teacherName: SUBJECT_TEACHER[subject],
      });
    }
  }
  return entries;
}

async function main() {
  const existingSchools = await prisma.school.count();
  if (existingSchools > 0) {
    console.log("Schools already exist — seed skipped (DB not empty).");
    return;
  }

  const log = [];
  const record = (label, creds) => log.push({ label, ...creds });

  // 1. First super admin
  if ((await prisma.user.count({ where: { role: "superAdmin" } })) === 0) {
    await authService.createSuperAdmin(SUPER);
    record("Super Admin", { username: SUPER.email, password: SUPER.password });
  }

  // 2. Demo school + school admin
  const school = await prisma.school.create({
    data: {
      name: SCHOOL.name,
      code: SCHOOL.code,
      board: SCHOOL.board,
      address: SCHOOL.address,
      session: SCHOOL.session,
    },
  });
  await prisma.user.create({
    data: {
      name: SCHOOL.adminName,
      email: SCHOOL.adminEmail,
      username: SCHOOL.adminEmail,
      passwordHash: await authService.hashPassword(SCHOOL.adminPassword),
      role: "schoolAdmin",
      schoolId: school.id,
      mustChangePassword: true,
    },
  });
  record("School Admin", { email: SCHOOL.adminEmail, password: SCHOOL.adminPassword });

  // 3. Staff + teacher portal logins
  const staffByName = {};
  for (const s of STAFF) {
    const staff = await prisma.staff.create({
      data: {
        schoolId: school.id,
        staffId: s.staffId,
        name: s.name,
        jobTitle: s.jobTitle,
        dept: s.dept,
        subject: s.subject,
      },
    });
    staffByName[s.name] = staff;

    if (s.jobTitle === "Teacher") {
      const password = generateTempPassword();
      const username = await generateUsername(s.staffId, prisma);
      await prisma.user.create({
        data: {
          name: s.name,
          email: `${s.staffId.toLowerCase()}@vidyaloop.local`,
          username,
          passwordHash: await authService.hashPassword(password),
          role: "teacher",
          schoolId: school.id,
          staffId: staff.id,
          mustChangePassword: true,
        },
      });
      record("Teacher", { name: s.name, username, password });
    }
  }

  // 4. Students + parent logins
  for (const st of STUDENTS) {
    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        admNo: st.admNo,
        name: st.name,
        cls: st.cls,
        section: st.section,
        roll: st.roll,
        dob: st.dob || null,
        bloodGroup: st.bloodGroup || null,
        fatherName: st.fatherName || null,
        motherName: st.motherName || null,
        emergency: st.emergency || null,
        status: st.status || "Active",
      },
    });

    if (st.parentName || st.parentEmail) {
      const password = generateTempPassword();
      const username = await generateUsername(`${st.admNo}-parent`, prisma);
      await prisma.user.create({
        data: {
          name: st.parentName || `Parent of ${st.name}`,
          email: st.parentEmail || `${st.admNo.toLowerCase()}-parent@vidyaloop.local`,
          username,
          passwordHash: await authService.hashPassword(password),
          role: "parent",
          schoolId: school.id,
          studentId: student.id,
          mustChangePassword: true,
        },
      });
      record("Parent", { child: st.name, username, password });
    }
  }

  // 5. Timetables
  for (const { cls, section } of [{ cls: "8", section: "A" }, { cls: "9", section: "B" }, { cls: "6", section: "C" }]) {
    for (const e of classEntries(cls, section)) {
      const staff = staffByName[e.teacherName];
      await prisma.timetableEntry.create({
        data: {
          schoolId: school.id,
          cls: e.cls,
          section: e.section,
          day: e.day,
          period: e.period,
          subject: e.subject,
          room: e.room,
          staffId: staff ? staff.id : null,
        },
      });
    }
  }

  // 6. Attendance: mark 8-A for all school days so far this month
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const eightA = await prisma.student.findMany({
    where: { schoolId: school.id, cls: "8", section: "A", status: "Active" },
  });
  const today = now.getUTCDate();
  for (let d = 1; d <= today; d++) {
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const student of eightA) {
      const status = (d === 8 || d === 21) && student.roll === 12 ? "A" : "P";
      await prisma.attendanceRecord.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          cls: "8",
          section: "A",
          date: new Date(Date.UTC(y, m - 1, d)),
          status,
        },
      });
    }
  }

  console.log("\n===== Vidyaloop seed complete =====\n");
  console.log(`School: ${SCHOOL.name} (${SCHOOL.code})`);
  console.log("---- Accounts ----");
  for (const row of log) {
    const who = row.label;
    const id = row.username || row.email;
    const child = row.child ? ` (child: ${row.child})` : "";
    console.log(`${who.padEnd(14)}${child.padEnd(28)} ${id} / ${row.password}`);
  }
  console.log("\nTip: ask these users to change their password on first login (mustChangePassword).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());