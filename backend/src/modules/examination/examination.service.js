const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") return query.schoolId || null;
  return user.schoolId;
}

function calculateGrade(marks, max = 100) {
  const pct = (marks / max) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

async function listClassExamRoster({ user, query }) {
  const schoolId = resolveSchoolScope(user, query);
  if (user.role !== "superAdmin" && !schoolId) throw new ApiError(403, "No school scope");

  const cls = query.cls || "8";
  const section = query.section || "A";
  const session = query.session || "2024-2025";
  const term = query.term || "Mid-Term";

  // Fetch active students in class section
  const students = await prisma.student.findMany({
    where: { schoolId, cls, section, status: "Active" },
    orderBy: { roll: "asc" },
    select: { id: true, admNo: true, name: true, roll: true },
  });

  // Fetch exam marks for this class section, session & term
  const marksList = await prisma.examMark.findMany({
    where: { schoolId, session, term, cls, section },
  });

  // Map student marks by studentId -> subject -> markRecord
  const studentMarksMap = new Map();
  marksList.forEach((m) => {
    if (!studentMarksMap.has(m.studentId)) {
      studentMarksMap.set(m.studentId, []);
    }
    studentMarksMap.get(m.studentId).push(m);
  });

  const roster = students.map((s) => {
    const sMarks = studentMarksMap.get(s.id) || [];
    let totalObtained = 0;
    let totalMax = 0;
    sMarks.forEach((m) => {
      totalObtained += m.marksObtained;
      totalMax += m.maxMarks;
    });

    const percent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : null;

    return {
      studentId: s.id,
      roll: s.roll,
      name: s.name,
      admNo: s.admNo,
      session,
      term,
      marks: sMarks,
      totalObtained,
      totalMax,
      percent,
      overallGrade: percent !== null ? calculateGrade(percent) : "N/A",
    };
  });

  return {
    session,
    term,
    classSection: `${cls}-${section}`,
    roster,
  };
}

// Upsert student exam marks by teachers or school admin
async function saveExamMarks({ user, data }) {
  const schoolId = user.role === "superAdmin" ? (data.schoolId || user.schoolId) : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required to enter exam marks");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const ops = data.marks.map((m) => {
    const calculatedG = m.grade || calculateGrade(m.marksObtained, m.maxMarks || 100);
    return prisma.examMark.upsert({
      where: {
        studentId_session_term_subject: {
          studentId: m.studentId,
          session: data.session || "2024-2025",
          term: data.term || "Mid-Term",
          subject: m.subject,
        },
      },
      create: {
        schoolId,
        studentId: m.studentId,
        session: data.session || "2024-2025",
        term: data.term || "Mid-Term",
        cls: data.cls,
        section: data.section,
        subject: m.subject,
        marksObtained: Number(m.marksObtained),
        maxMarks: Number(m.maxMarks) || 100,
        grade: calculatedG,
        remarks: m.remarks || null,
        enteredById: user.id,
      },
      update: {
        marksObtained: Number(m.marksObtained),
        maxMarks: Number(m.maxMarks) || 100,
        grade: calculatedG,
        remarks: m.remarks || null,
        enteredById: user.id,
      },
    });
  });

  await prisma.$transaction(ops);

  return listClassExamRoster({
    user: { schoolId, role: user.role },
    query: { cls: data.cls, section: data.section, session: data.session, term: data.term },
  });
}

// Fetch complete Report Card & Grade Sheet for an individual student across any year and term
async function getStudentReportCard({ user, query }) {
  const targetStudentId = query.studentId || user.studentId;
  if (!targetStudentId) throw new ApiError(400, "Student ID is required");

  const student = await prisma.student.findUnique({
    where: { id: targetStudentId },
    include: { school: { select: { name: true, code: true, board: true, address: true } } },
  });

  if (!student) throw new ApiError(404, "Student not found");

  if (user.role === "parent" && user.studentId !== student.id) {
    throw new ApiError(403, "You may only view your own child's report card");
  }
  if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student does not belong to your school");
  }

  const session = query.session || student.session || "2024-2025";
  const term = query.term || "Mid-Term";

  const marks = await prisma.examMark.findMany({
    where: { studentId: student.id, session, term },
    orderBy: { subject: "asc" },
  });

  let totalObtained = 0;
  let totalMax = 0;
  marks.forEach((m) => {
    totalObtained += m.marksObtained;
    totalMax += m.maxMarks;
  });

  const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  const overallGrade = calculateGrade(percentage);

  // Calculate Class Rank
  const classMarks = await prisma.examMark.findMany({
    where: { schoolId: student.schoolId, cls: student.cls, section: student.section, session, term },
  });

  const studentTotals = new Map();
  classMarks.forEach((m) => {
    const cur = studentTotals.get(m.studentId) || 0;
    studentTotals.set(m.studentId, cur + m.marksObtained);
  });

  const sortedTotals = Array.from(studentTotals.values()).sort((a, b) => b - a);
  const studentTotal = studentTotals.get(student.id) || totalObtained;
  const rank = sortedTotals.indexOf(studentTotal) + 1;

  return {
    student: {
      id: student.id,
      admNo: student.admNo,
      name: student.name,
      cls: student.cls,
      section: student.section,
      classSection: `${student.cls}-${student.section}`,
      roll: student.roll,
      dob: student.dob,
      fatherName: student.fatherName,
      schoolName: student.school?.name,
      schoolBoard: student.school?.board,
    },
    session,
    term,
    subjects: marks.map((m) => ({
      id: m.id,
      subject: m.subject,
      marksObtained: m.marksObtained,
      maxMarks: m.maxMarks,
      grade: m.grade,
      remarks: m.remarks,
    })),
    summary: {
      totalObtained,
      totalMax,
      percentage,
      overallGrade,
      rank: rank > 0 ? rank : 1,
      totalStudentsInClass: Math.max(sortedTotals.length, 1),
    },
  };
}

module.exports = {
  listClassExamRoster,
  saveExamMarks,
  getStudentReportCard,
};
