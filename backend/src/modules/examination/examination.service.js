const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

const ALL_SUBJECTS = ["Mathematics", "Science", "English", "Social Sci.", "Hindi", "Computer Sci."];

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

function calculateGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

async function listClassExamRoster({ user, query }) {
  // Parents never get the class-wide marks roster; they use the report card
  // endpoint which is scoped to their own child.
  if (user && user.role === "parent") {
    throw new ApiError(403, "Access denied. Parents cannot view the class examination roster.");
  }

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
  let schoolId = await resolveSchoolScope(user, data);
  const { session, term, cls, section, subject, marks } = data;

  if (!Array.isArray(marks) || marks.length === 0) {
    return { success: true, count: 0 };
  }

  // Fallback to student's own schoolId if superAdmin didn't pass explicit schoolId
  if (!schoolId) {
    const firstMark = marks[0];
    if (firstMark && firstMark.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: firstMark.studentId },
        select: { schoolId: true },
      });
      if (student) schoolId = student.schoolId;
    }
  }

  if (!schoolId) {
    throw new ApiError(400, "School ID is required to save exam marks");
  }

  await prisma.$transaction(
    marks.map((m) => {
      const marksVal = typeof m.marksObtained === "number" ? m.marksObtained : (parseFloat(m.marksObtained) || 0);
      const maxVal = typeof m.maxMarks === "number" ? m.maxMarks : 100;
      const percentage = (marksVal / Math.max(maxVal, 1)) * 100;
      const grade = calculateGrade(percentage);

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
          marksObtained: marksVal,
          maxMarks: maxVal,
          grade,
          remarks: m.remarks,
        },
        update: {
          schoolId,
          cls,
          section,
          marksObtained: marksVal,
          maxMarks: maxVal,
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

  if (!student) throw new ApiError(404, "Student not found in database");

  // Parent isolation: a parent can ONLY view their own child's report card.
  if (user && user.role === "parent") {
    if (student.id !== user.studentId) {
      throw new ApiError(403, "Access denied. Parents can only view their own child.");
    }
  } else if (user && user.role !== "superAdmin" && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied to other school's student");
  }

  const savedMarks = await prisma.examMark.findMany({
    where: { studentId, session, term },
  });

  const marksMap = new Map();
  savedMarks.forEach((m) => marksMap.set(m.subject, m));

  const subjects = ALL_SUBJECTS.map((sub) => {
    const found = marksMap.get(sub);
    const marksObtained = found ? (typeof found.marksObtained === "number" ? found.marksObtained : parseFloat(found.marksObtained) || 0) : 0;
    const maxMarks = found ? (found.maxMarks || 100) : 100;
    const percentage = (marksObtained / Math.max(maxMarks, 1)) * 100;
    const grade = found ? found.grade || calculateGrade(percentage) : "—";

    return {
      subject: sub,
      marksObtained,
      maxMarks,
      grade,
      isEntered: Boolean(found),
    };
  });

  const enteredSubjects = subjects.filter((s) => s.isEntered);
  const evaluatedList = enteredSubjects.length > 0 ? enteredSubjects : subjects;

  const totalObtained = evaluatedList.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = evaluatedList.reduce((sum, m) => sum + m.maxMarks, 0) || 100;
  const percentage = Math.round((totalObtained / totalMax) * 100 * 100) / 100;
  const overallGrade = calculateGrade(percentage);

  // Calculate the actual class rank
  const classmates = await prisma.student.findMany({
    where: { schoolId: student.schoolId, cls: student.cls, section: student.section, status: "Active" },
    select: { id: true },
  });

  const classmatesMarks = await prisma.examMark.findMany({
    where: {
      studentId: { in: classmates.map((c) => c.id) },
      session,
      term,
    },
  });

  const studentScores = classmates.map((cm) => {
    const cmMarks = classmatesMarks.filter((m) => m.studentId === cm.id);
    const totalObt = cmMarks.reduce((sum, m) => {
      const val = typeof m.marksObtained === "number" ? m.marksObtained : parseFloat(m.marksObtained) || 0;
      return sum + val;
    }, 0);
    return { studentId: cm.id, totalObt };
  });

  studentScores.sort((a, b) => b.totalObt - a.totalObt);
  const rankIndex = studentScores.findIndex((s) => s.studentId === student.id);
  const rankNumber = rankIndex !== -1 ? rankIndex + 1 : 1;
  const classRank = `#${rankNumber} of ${classmates.length}`;

  return {
    studentName: student.name,
    admNo: student.admNo,
    cls: student.cls,
    section: student.section,
    roll: student.roll || "—",
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
    subjects,
    marks: subjects,
    totalObtained,
    totalMax,
    percentage,
    overallGrade: enteredSubjects.length === 0 ? "Pending" : overallGrade,
    status: enteredSubjects.length === 0 ? "GRADES PENDING" : (percentage >= 33 ? "PASSED" : "NEEDS IMPROVEMENT"),
    classRank,
  };
}

module.exports = {
  listClassExamRoster,
  saveExamMarks,
  generateReportCard,
  resolveSchoolScope,
};
