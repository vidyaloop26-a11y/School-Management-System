const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function resolveSchoolScope(user, query = {}) {
  if (user.role === "superAdmin") {
    if (!query.schoolId || query.schoolId === "all") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      return firstSchool ? firstSchool.id : null;
    }
    const cleanId = String(query.schoolId).replace(/^"|"$/g, "").trim();
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: cleanId }, { code: cleanId }] },
      select: { id: true },
    });
    return school ? school.id : cleanId;
  }
  return user.schoolId;
}

function calculateGrade(marks) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "C";
  if (marks >= 50) return "D";
  return "F";
}

async function listClassExamRoster({ user, query }) {
  const schoolId = await resolveSchoolScope(user, query);
  const cls = query.cls || "8";
  const section = query.section || "A";
  const session = query.session || "2024-2025";
  const term = query.term || "Mid-Term";
  const subject = query.subject || "Mathematics";

  const whereStudent = {
    ...(schoolId ? { schoolId } : {}),
    cls,
    section,
    status: "Active",
  };

  const students = await prisma.student.findMany({
    where: whereStudent,
    orderBy: { roll: "asc" },
  });

  const existingMarks = await prisma.examMark.findMany({
    where: {
      ...(schoolId ? { schoolId } : {}),
      cls,
      section,
      session,
      term,
      subject,
    },
  });

  const marksMap = new Map();
  existingMarks.forEach((m) => marksMap.set(m.studentId, m));

  const resultStudents = students.map((std) => {
    const foundMark = marksMap.get(std.id);
    return {
      studentId: std.id,
      admNo: std.admNo,
      name: std.name,
      roll: std.roll,
      marks: foundMark ? foundMark.marksObtained : undefined,
      maxMarks: foundMark ? foundMark.maxMarks : 100,
      grade: foundMark ? foundMark.grade : undefined,
    };
  });

  return {
    cls,
    section,
    session,
    term,
    subject,
    students: resultStudents,
  };
}

async function saveExamMarks({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID is required to save exam marks");

  const { session, term, cls, section, subject, marks } = data;

  await prisma.$transaction(
    marks.map((m) => {
      const grade = calculateGrade(m.marksObtained);
      return prisma.examMark.upsert({
        where: {
          studentId_session_term_subject: {
            studentId: m.studentId,
            session,
            term,
            subject,
          },
        },
        create: {
          schoolId,
          studentId: m.studentId,
          session,
          term,
          cls,
          section,
          subject,
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks || 100,
          grade,
          remarks: m.remarks,
        },
        update: {
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks || 100,
          grade,
          remarks: m.remarks,
        },
      });
    })
  );

  return { success: true, count: marks.length };
}

async function generateReportCard({ user, query }) {
  const studentId = query.studentId;
  if (!studentId) throw new ApiError(400, "Student ID is required for report card");

  const session = query.session || "2024-2025";
  const term = query.term || "Mid-Term";

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { school: true },
  });

  if (!student) throw new ApiError(404, "Student not found");

  const marks = await prisma.examMark.findMany({
    where: { studentId, session, term },
  });

  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0) || 100;
  const percentage = Math.round((totalObtained / totalMax) * 100 * 100) / 100;
  const overallGrade = calculateGrade(percentage);

  return {
    student: {
      id: student.id,
      admNo: student.admNo,
      name: student.name,
      cls: student.cls,
      section: student.section,
      roll: student.roll,
      session: student.session,
    },
    school: student.school,
    session,
    term,
    marks,
    totalObtained,
    totalMax,
    percentage,
    overallGrade,
    classRank: "#1 of 25",
  };
}

module.exports = {
  listClassExamRoster,
  saveExamMarks,
  generateReportCard,
  resolveSchoolScope,
};
