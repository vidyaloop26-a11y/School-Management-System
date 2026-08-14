const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const { DAYS, PERIODS } = require("./timetable.schema");

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

async function getClassTimetable({ user, cls, section, query = {} }) {
  const schoolId = await resolveSchoolScope(user, query);
  if (!schoolId) return { entries: [], classSection: `${cls}-${section}`, grid: {} };

  const entries = await prisma.timetableEntry.findMany({
    where: { schoolId, cls, section },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: { staff: { select: { id: true, name: true, staffId: true } } },
  });

  const grid = {};
  for (const period of PERIODS) {
    grid[period] = {};
    for (const day of DAYS) {
      const found = entries.find((e) => e.period === period && e.day === day);
      grid[period][day] = found
        ? {
            subject: found.subject,
            room: found.room,
            teacher: found.staff ? found.staff.name : null,
            staffId: found.staffId,
          }
        : { subject: null, room: null, teacher: null, staffId: null };
    }
  }

  return {
    classSection: `${cls}-${section}`,
    grid,
    entries,
  };
}

async function getStaffTimetable({ user, staffId: paramStaffId }) {
  let targetStaffId = paramStaffId || user.staffId;
  if (!targetStaffId && user.role === "teacher") {
    targetStaffId = user.staffId;
  }
  if (!targetStaffId) {
    const firstTeacher = await prisma.staff.findFirst({
      where: { jobTitle: { contains: "Teacher", mode: "insensitive" } },
    });
    if (firstTeacher) targetStaffId = firstTeacher.id;
  }

  if (!targetStaffId) throw new ApiError(404, "Teacher profile not found");

  const entries = await prisma.timetableEntry.findMany({
    where: { staffId: targetStaffId },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: { school: { select: { name: true } } },
  });

  const grid = {};
  for (const period of PERIODS) {
    grid[period] = {};
    for (const day of DAYS) {
      const found = entries.find((e) => e.period === period && e.day === day);
      grid[period][day] = found
        ? {
            cls: found.cls,
            section: found.section,
            classSection: `${found.cls}-${found.section}`,
            subject: found.subject,
            room: found.room,
          }
        : { cls: null, section: null, classSection: null, subject: null, room: null };
    }
  }

  return { staffId: targetStaffId, grid, entries };
}

async function upsertSlot({ user, data }) {
  const schoolId = user.schoolId || data.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const key = {
    schoolId_cls_section_day_period: {
      schoolId,
      cls: data.cls,
      section: data.section,
      day: data.day,
      period: data.period,
    },
  };

  return prisma.timetableEntry.upsert({
    where: key,
    create: {
      schoolId,
      cls: data.cls,
      section: data.section,
      day: data.day,
      period: data.period,
      subject: data.subject,
      room: data.room,
      staffId: data.staffId || null,
    },
    update: {
      subject: data.subject,
      room: data.room,
      staffId: data.staffId || null,
    },
  });
}

async function deleteEntry({ user, id }) {
  const entry = await prisma.timetableEntry.findUnique({ where: { id } });
  if (!entry) throw new ApiError(404, "Timetable entry not found");
  if (user.schoolId && entry.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.timetableEntry.delete({ where: { id } });
}

module.exports = {
  getClassTimetable,
  getStaffTimetable,
  upsertSlot,
  deleteEntry,
  resolveSchoolScope,
};