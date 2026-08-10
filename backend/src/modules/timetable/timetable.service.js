const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");
const { DAYS, PERIODS } = require("./timetable.schema");

function resolveSchool(user, body = {}) {
  return user.role === "superAdmin" ? body.schoolId || null : user.schoolId;
}

async function getClassTimetable({ user, cls, section }) {
  const schoolId = user.schoolId;
  if (user.role === "superAdmin") return { entries: [], classSection: `${cls}-${section}` };
  if (!schoolId) throw new ApiError(403, "No school scope");

  const entries = await prisma.timetableEntry.findMany({
    where: { schoolId, cls, section },
    orderBy: [{ day: "asc" }, { period: "asc" }],
    include: { staff: { select: { id: true, name: true, staffId: true } } },
  });

  // Frontend-friendly shape: grid of [period][day] -> { subject, room, teacher }
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
            teacherId: found.staffId,
          }
        : null;
    }
  }

  return { entries, grid, classSection: `${cls}-${section}` };
}

async function getStaffTimetable({ user, staffId }) {
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) throw new ApiError(404, "Staff member not found");
  if (user.schoolId && staff.schoolId !== user.schoolId) {
    throw new ApiError(403, "Staff member does not belong to your school");
  }

  const entries = await prisma.timetableEntry.findMany({
    where: { staffId },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });

  return entries.map((e) => ({
    id: e.id,
    day: e.day,
    period: e.period,
    subject: e.subject,
    room: e.room,
    classSection: `${e.cls}-${e.section}`,
  }));
}

// Upserts a full class timetable. School admin only.
async function upsertClassTimetable({ user, data }) {
  const schoolId = user.role === "superAdmin" ? data.schoolId : user.schoolId;
  if (!schoolId) throw new ApiError(400, "A school is required");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found");

  const ops = [];
  for (const entry of data.entries) {
    const key = {
      schoolId_cls_section_day_period: {
        schoolId,
        cls: data.cls,
        section: data.section,
        day: entry.day,
        period: entry.period,
      },
    };
    ops.push(
      prisma.timetableEntry.upsert({
        where: key,
        create: {
          schoolId,
          cls: data.cls,
          section: data.section,
          day: entry.day,
          period: entry.period,
          subject: entry.subject,
          room: entry.room,
          staffId: entry.staffId || null,
        },
        update: {
          subject: entry.subject,
          room: entry.room,
          staffId: entry.staffId || null,
        },
      })
    );
  }

  await prisma.$transaction(ops);
  return getClassTimetable({ user: { schoolId }, cls: data.cls, section: data.section });
}

async function deleteEntry({ user, id }) {
  const entry = await prisma.timetableEntry.findUnique({ where: { id } });
  if (!entry) throw new ApiError(404, "Timetable entry not found");
  if (user.schoolId && entry.schoolId !== user.schoolId) {
    throw new ApiError(403, "Entry does not belong to your school");
  }
  await prisma.timetableEntry.delete({ where: { id } });
  return entry;
}

module.exports = { getClassTimetable, getStaffTimetable, upsertClassTimetable, deleteEntry };