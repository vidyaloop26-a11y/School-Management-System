// Multi-Tenant Database Seed Script
// Usage: node prisma/seed.js (or npm run seed)
const prisma = require("../src/lib/prisma");
const env = require("../src/config/env");
const authService = require("../src/modules/auth/auth.service");

const SUPER = {
  name: env.superAdmin.name || "Vidyaloop Super Admin",
  email: env.superAdmin.email || "superadmin@vidyaloop.in",
  password: env.superAdmin.password || "Super@1234",
};

// 3 Distinct Multi-Tenant Schools with unique credentials & data
const SCHOOLS_DATA = [
  {
    name: "Vidyaloop Public School",
    code: "VLPS",
    board: "CBSE",
    address: "Sector 45, Gurugram, Haryana - 122003",
    session: "2024-2025",
    adminName: "Rajesh Director",
    adminEmail: "admin@vidyaloop.in",
    adminPassword: "Admin@1234",
    staff: [
      { staffId: "VLS-101", name: "Neha Kulkarni", jobTitle: "Teacher", dept: "Mathematics", subject: "Mathematics" },
      { staffId: "VLS-102", name: "Arjun Rao", jobTitle: "Teacher", dept: "Science", subject: "Science" },
      { staffId: "VLS-103", name: "Meera Iyer", jobTitle: "Teacher", dept: "English", subject: "English" },
      { staffId: "VLS-104", name: "Vikram Singh", jobTitle: "Vice Principal", dept: "Administration" },
      { staffId: "VLS-105", name: "Sunita Joshi", jobTitle: "Front Office", dept: "Administration" },
      { staffId: "VLS-106", name: "Deepak Chawla", jobTitle: "Accountant", dept: "Finance" },
    ],
    students: [
      { admNo: "VL2024001", name: "Aarav Sharma", cls: "8", section: "A", roll: 12, parentName: "Rajesh Sharma", parentEmail: "rajesh.sharma@email.com", fatherName: "Rajesh Sharma", motherName: "Priya Sharma", bloodGroup: "B+", emergency: "+91 98xxxxxx01", dob: "2012-03-14" },
      { admNo: "VL2024002", name: "Ishita Verma", cls: "8", section: "A", roll: 13, parentName: "Verma Ji", parentEmail: "ishita.parent@email.com" },
      { admNo: "VL2024003", name: "Kabir Mehta", cls: "9", section: "B", roll: 5, parentName: "Mehta Ji", parentEmail: "kabir.parent@email.com" },
      { admNo: "VL2024004", name: "Ananya Nair", cls: "6", section: "C", roll: 21 },
      { admNo: "VL2024005", name: "Rohan Gupta", cls: "10", section: "A", roll: 9, status: "Inactive" },
      { admNo: "VL2024006", name: "Sanya Kapoor", cls: "7", section: "B", roll: 17 },
      { admNo: "VL2024007", name: "Dev Malhotra", cls: "8", section: "A", roll: 14 },
      { admNo: "VL2024008", name: "Riya Chopra", cls: "8", section: "A", roll: 15 },
      { admNo: "VL2024009", name: "Yash Bansal", cls: "8", section: "A", roll: 16 },
    ],
  },
  {
    name: "St. Xavier International School",
    code: "SXIS",
    board: "ICSE",
    address: "Vasant Kunj, New Delhi - 110070",
    session: "2024-2025",
    adminName: "Sister Clara",
    adminEmail: "admin@stxaviers.edu.in",
    adminPassword: "Admin@1234",
    staff: [
      { staffId: "SXIS-101", name: "Priya Sharma", jobTitle: "Teacher", dept: "Science", subject: "Physics" },
      { staffId: "SXIS-102", name: "Rajesh Kulkarni", jobTitle: "Teacher", dept: "Humanities", subject: "History" },
      { staffId: "SXIS-103", name: "Sunita Patel", jobTitle: "Teacher", dept: "Science", subject: "Chemistry" },
    ],
    students: [
      { admNo: "SX2024001", name: "Vivaan Joshi", cls: "8", section: "A", roll: 1, parentName: "Sanjay Joshi", parentEmail: "vivaan.parent@email.com" },
      { admNo: "SX2024002", name: "Ananya Sen", cls: "8", section: "A", roll: 2 },
      { admNo: "SX2024003", name: "Rohan Mehta", cls: "10", section: "A", roll: 3 },
      { admNo: "SX2024004", name: "Myra Patel", cls: "9", section: "B", roll: 4 },
    ],
  },
  {
    name: "Delhi Public Academy",
    code: "DPA",
    board: "CBSE",
    address: "Sector 62, Noida, Uttar Pradesh - 201301",
    session: "2024-2025",
    adminName: "Dr. Amit Singhania",
    adminEmail: "admin@dpa.edu.in",
    adminPassword: "Admin@1234",
    staff: [
      { staffId: "DPA-101", name: "Ritu Singhania", jobTitle: "Teacher", dept: "Biology", subject: "Biology" },
      { staffId: "DPA-102", name: "Kavita Nair", jobTitle: "Teacher", dept: "Computer Science", subject: "Computer" },
    ],
    students: [
      { admNo: "DPA2024001", name: "Aditya Kumar", cls: "7", section: "A", roll: 10, parentName: "Kumar Ji", parentEmail: "aditya.parent@email.com" },
      { admNo: "DPA2024002", name: "Diya Verma", cls: "7", section: "A", roll: 11 },
      { admNo: "DPA2024003", name: "Tanvi Shah", cls: "8", section: "B", roll: 12 },
    ],
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["P1", "P2", "P3", "P4", "P5"];

const SUBJECT_GRID = [
  ["Mathematics", "English", "Science", "Mathematics", "Social Sci."],
  ["English", "Mathematics", "Social Sci.", "Science", "Mathematics"],
  ["Science", "Hindi", "Mathematics", "English", "Computer"],
  ["Social Sci.", "Science", "English", "Hindi", "Science"],
  ["Computer", "Social Sci.", "Hindi", "Mathematics", "English"],
];

async function main() {
  console.log("Starting Vidyaloop Multi-Tenant Database Seed...");

  const log = [];
  const record = (label, creds) => log.push({ label, ...creds });

  // 1. Super Admin
  const superAdminUser = await prisma.user.findFirst({ where: { role: "superAdmin" } });
  if (!superAdminUser) {
    await authService.createSuperAdmin(SUPER);
    record("Super Admin", { username: SUPER.email, password: SUPER.password });
  } else {
    record("Super Admin (Existing)", { username: SUPER.email, password: SUPER.password });
  }

  // 2. Loop over Schools
  for (const sData of SCHOOLS_DATA) {
    let school = await prisma.school.findUnique({ where: { code: sData.code } });
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: sData.name,
          code: sData.code,
          board: sData.board,
          address: sData.address,
          session: sData.session,
        },
      });
    }

    // School Admin User
    const adminEmail = sData.adminEmail.toLowerCase();
    const existingAdmin = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: sData.adminName,
          email: adminEmail,
          username: adminEmail,
          passwordHash: await authService.hashPassword(sData.adminPassword),
          role: "schoolAdmin",
          schoolId: school.id,
          mustChangePassword: false,
        },
      });
    }
    record(`School Admin [${sData.code}]`, { email: sData.adminEmail, password: sData.adminPassword });

    // Staff
    const staffByName = {};
    for (const stf of sData.staff) {
      let staffObj = await prisma.staff.findUnique({
        where: { schoolId_staffId: { schoolId: school.id, staffId: stf.staffId } },
      });
      if (!staffObj) {
        staffObj = await prisma.staff.create({
          data: {
            schoolId: school.id,
            staffId: stf.staffId,
            name: stf.name,
            jobTitle: stf.jobTitle,
            dept: stf.dept,
            subject: stf.subject,
          },
        });
      }
      staffByName[stf.name] = staffObj;

      if (stf.jobTitle === "Teacher") {
        const email = `${stf.staffId.toLowerCase()}@vidyaloop.local`;
        const username = stf.staffId.toLowerCase();
        const existingTeacherUser = await prisma.user.findFirst({
          where: { email },
        });

        if (!existingTeacherUser) {
          const password = `${stf.staffId}@1234`;
          await prisma.user.create({
            data: {
              name: stf.name,
              email,
              username,
              passwordHash: await authService.hashPassword(password),
              role: "teacher",
              schoolId: school.id,
              staffId: staffObj.id,
              mustChangePassword: false,
            },
          });
          record(`Teacher [${sData.code}]`, { name: stf.name, username, password });
        } else {
          record(`Teacher [${sData.code}]`, { name: stf.name, username, password: `${stf.staffId}@1234` });
        }
      }
    }

    // Students
    for (const std of sData.students) {
      let studentObj = await prisma.student.findUnique({
        where: { schoolId_admNo: { schoolId: school.id, admNo: std.admNo } },
      });

      if (!studentObj) {
        studentObj = await prisma.student.create({
          data: {
            schoolId: school.id,
            admNo: std.admNo,
            name: std.name,
            cls: std.cls,
            section: std.section,
            roll: std.roll,
            dob: std.dob || null,
            bloodGroup: std.bloodGroup || null,
            fatherName: std.fatherName || null,
            motherName: std.motherName || null,
            emergency: std.emergency || null,
            status: std.status || "Active",
          },
        });
      }

      if (std.parentName || std.parentEmail) {
        const parentEmail = std.parentEmail || `${std.admNo.toLowerCase()}-parent@vidyaloop.local`;
        const username = `${std.admNo.toLowerCase()}-parent`;
        const existingParentUser = await prisma.user.findFirst({
          where: { email: parentEmail },
        });

        if (!existingParentUser) {
          const password = `${std.admNo}@1234`;
          await prisma.user.create({
            data: {
              name: std.parentName || `Parent of ${std.name}`,
              email: parentEmail,
              username,
              passwordHash: await authService.hashPassword(password),
              role: "parent",
              schoolId: school.id,
              studentId: studentObj.id,
              mustChangePassword: false,
            },
          });
          record(`Parent [${sData.code}]`, { child: std.name, username, password });
        } else {
          record(`Parent [${sData.code}]`, { child: std.name, username, password: `${std.admNo}@1234` });
        }
      }
    }

    // Timetables
    const activeClasses = Array.from(new Set(sData.students.map((st) => `${st.cls}-${st.section}`)));
    for (const cs of activeClasses) {
      const [clsVal, secVal] = cs.split("-");
      for (let p = 0; p < PERIODS.length; p++) {
        for (let d = 0; d < DAYS.length; d++) {
          const subject = SUBJECT_GRID[p][d];
          const matchedTeacher = Object.values(staffByName).find((s) => s.jobTitle === "Teacher");
          const key = {
            schoolId_cls_section_day_period: {
              schoolId: school.id,
              cls: clsVal,
              section: secVal,
              day: DAYS[d],
              period: PERIODS[p],
            },
          };
          await prisma.timetableEntry.upsert({
            where: key,
            create: {
              schoolId: school.id,
              cls: clsVal,
              section: secVal,
              day: DAYS[d],
              period: PERIODS[p],
              subject,
              room: `${200 + p}`,
              staffId: matchedTeacher ? matchedTeacher.id : null,
            },
            update: {},
          });
        }
      }
    }

    // Attendance
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const schoolStudents = await prisma.student.findMany({
      where: { schoolId: school.id, status: "Active" },
    });
    const today = now.getUTCDate();
    for (let d = 1; d <= Math.min(today, 10); d++) {
      const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      for (const student of schoolStudents) {
        await prisma.attendanceRecord.upsert({
          where: { studentId_date: { studentId: student.id, date: new Date(Date.UTC(y, m - 1, d)) } },
          create: {
            schoolId: school.id,
            studentId: student.id,
            cls: student.cls,
            section: student.section,
            date: new Date(Date.UTC(y, m - 1, d)),
            status: d % 7 === 0 ? "A" : "P",
          },
          update: {},
        });
      }
    }
  }

  console.log("\n=======================================================================");
  console.log("   VIDYALOOP MULTI-TENANT DATABASE SEED COMPLETE                     ");
  console.log("=======================================================================\n");
  console.log("---- Multi-Tenant Accounts & Passwords ----\n");
  for (const row of log) {
    const who = row.label;
    const id = row.username || row.email;
    const child = row.child ? ` (child: ${row.child})` : "";
    console.log(`${who.padEnd(28)}${child.padEnd(28)} ${id.padEnd(35)} / ${row.password}`);
  }
  console.log("\n=======================================================================\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());