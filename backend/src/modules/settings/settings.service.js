const prisma = require("../../lib/prisma");
const { ApiError } = require("../../lib/errors");

async function getSettings(user) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  let settings = await prisma.schoolSettings.findUnique({
    where: { schoolId },
  });

  if (!settings) {
    settings = await prisma.schoolSettings.create({
      data: { schoolId },
    });
  }

  return settings;
}

async function updateSettings(user, data) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const existing = await prisma.schoolSettings.findUnique({
    where: { schoolId },
  });

  if (!existing) {
    return prisma.schoolSettings.create({
      data: { schoolId, ...data },
    });
  }

  return prisma.schoolSettings.update({
    where: { schoolId },
    data,
  });
}

async function listEvents(user, query = {}) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const where = { schoolId };
  if (query.type) where.type = query.type;

  return prisma.schoolEvent.findMany({
    where,
    orderBy: { date: "asc" },
  });
}

async function createEvent(user, data) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.schoolEvent.create({
    data: {
      schoolId,
      title: data.title,
      sub: data.sub || null,
      date: new Date(data.date),
      type: data.type || "Event",
    },
  });
}

async function deleteEvent(user, id) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const event = await prisma.schoolEvent.findUnique({ where: { id } });
  if (!event) throw new ApiError(404, "Event not found");
  if (event.schoolId !== schoolId) throw new ApiError(403, "Access denied");

  return prisma.schoolEvent.delete({ where: { id } });
}

async function syncHolidays(user, year, countryCode) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const country = countryCode || "IN";
  const targetYear = year || new Date().getFullYear();

  const url = `https://date.nager.at/api/v3/PublicHolidays/${targetYear}/${country}`;
  let holidays;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Nager.Date API returned ${response.status}`);
    holidays = await response.json();
  } catch (err) {
    throw new ApiError(502, `Failed to fetch holidays from calendar API: ${err.message}`);
  }

  if (!Array.isArray(holidays)) {
    throw new ApiError(502, "Invalid response from calendar API");
  }

  let imported = 0;
  let skipped = 0;

  for (const h of holidays) {
    const dateStr = h.date;
    if (!dateStr) { skipped++; continue; }

    const existing = await prisma.schoolEvent.findFirst({
      where: {
        schoolId,
        title: h.localName || h.name,
        date: new Date(dateStr),
      },
    });

    if (existing) { skipped++; continue; }

    await prisma.schoolEvent.create({
      data: {
        schoolId,
        title: h.localName || h.name,
        sub: `${h.name || ""} · ${country} Public Holiday`.trim(),
        date: new Date(dateStr),
        type: "Holiday",
      },
    });
    imported++;
  }

  return { imported, skipped, total: holidays.length, year: targetYear, country };
}

async function listSubjects(user) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.schoolSubject.findMany({
    where: { schoolId },
    orderBy: { order: "asc" },
  });
}

async function createSubject(user, data) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const existing = await prisma.schoolSubject.findFirst({
    where: { schoolId, name: data.name },
  });
  if (existing) throw new ApiError(409, `Subject '${data.name}' already exists`);

  const maxOrder = await prisma.schoolSubject.aggregate({
    where: { schoolId },
    _max: { order: true },
  });

  return prisma.schoolSubject.create({
    data: {
      schoolId,
      name: data.name,
      code: data.code || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
}

async function deleteSubject(user, id) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const subject = await prisma.schoolSubject.findUnique({ where: { id } });
  if (!subject) throw new ApiError(404, "Subject not found");
  if (subject.schoolId !== schoolId) throw new ApiError(403, "Access denied");

  return prisma.schoolSubject.delete({ where: { id } });
}

async function reorderSubjects(user, subjectIds) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.$transaction(
    subjectIds.map((id, index) =>
      prisma.schoolSubject.update({
        where: { id },
        data: { order: index },
      })
    )
  );
}

module.exports = {
  getSettings,
  updateSettings,
  listEvents,
  createEvent,
  deleteEvent,
  syncHolidays,
  listSubjects,
  createSubject,
  deleteSubject,
  reorderSubjects,
};
