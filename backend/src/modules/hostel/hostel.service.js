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

async function getBuildings(user) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) return [];

  return prisma.building.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { rooms: true } },
    },
  });
}

async function createBuilding({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.building.create({
    data: {
      schoolId,
      name: data.name,
      type: data.type,
      floors: data.floors,
    },
  });
}

async function updateBuilding({ id, data, user }) {
  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) throw new ApiError(404, "Building not found");
  if (user.schoolId && building.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.building.update({
    where: { id },
    data,
  });
}

async function deleteBuilding({ id, user }) {
  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) throw new ApiError(404, "Building not found");
  if (user.schoolId && building.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.building.delete({ where: { id } });
}

async function getRooms(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = {};

  if (filters.buildingId) {
    where.buildingId = filters.buildingId;
  }

  if (filters.floor !== undefined && filters.floor !== null) {
    where.floor = filters.floor;
  }

  if (filters.roomType) {
    where.roomType = filters.roomType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  // If buildingId is provided, verify it belongs to the school
  if (filters.buildingId) {
    const building = await prisma.building.findUnique({
      where: { id: filters.buildingId },
      select: { schoolId: true },
    });
    if (!building || building.schoolId !== schoolId) {
      throw new ApiError(403, "Access denied to this building");
    }
  } else {
    // Filter rooms to only those in school buildings
    const schoolBuildings = await prisma.building.findMany({
      where: { schoolId },
      select: { id: true },
    });
    where.buildingId = { in: schoolBuildings.map((b) => b.id) };
  }

  return prisma.hostelRoom.findMany({
    where,
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    include: {
      building: { select: { id: true, name: true } },
      assignments: {
        include: { student: { select: { id: true, name: true, admNo: true } } },
      },
    },
  });
}

async function createRoom({ user, data }) {
  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
  });
  if (!building) throw new ApiError(404, "Building not found");
  if (user.schoolId && building.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const existing = await prisma.hostelRoom.findUnique({
    where: { buildingId_roomNumber: { buildingId: data.buildingId, roomNumber: data.roomNumber } },
  });
  if (existing) throw new ApiError(409, "Room number already exists in this building");

  return prisma.hostelRoom.create({
    data: {
      buildingId: data.buildingId,
      floor: data.floor,
      roomNumber: data.roomNumber,
      bedCount: data.bedCount,
      roomType: data.roomType,
    },
    include: { building: { select: { id: true, name: true } } },
  });
}

async function assignBed({ user, data }) {
  const room = await prisma.hostelRoom.findUnique({
    where: { id: data.roomId },
    include: { building: { select: { schoolId: true } } },
  });
  if (!room) throw new ApiError(404, "Room not found");
  if (user.schoolId && room.building.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  if (data.bedNumber < 1 || data.bedNumber > room.bedCount) {
    throw new ApiError(400, `Bed number must be between 1 and ${room.bedCount}`);
  }

  const existing = await prisma.bedAssignment.findUnique({
    where: { roomId_bedNumber: { roomId: data.roomId, bedNumber: data.bedNumber } },
  });
  if (existing) throw new ApiError(409, "Bed is already assigned in this room");

  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) throw new ApiError(404, "Student not found");

  if (user.schoolId && student.schoolId !== user.schoolId) {
    throw new ApiError(403, "Student belongs to a different school");
  }

  const assignment = await prisma.bedAssignment.create({
    data: {
      roomId: data.roomId,
      bedNumber: data.bedNumber,
      studentId: data.studentId,
      session: data.session || undefined,
    },
    include: {
      student: { select: { id: true, name: true, admNo: true } },
      room: { select: { id: true, roomNumber: true } },
    },
  });

  // Update room status
  const assignedCount = await prisma.bedAssignment.count({
    where: { roomId: data.roomId },
  });
  await prisma.hostelRoom.update({
    where: { id: data.roomId },
    data: { status: assignedCount >= room.bedCount ? "FULL" : "PARTIAL" },
  });

  return assignment;
}

async function unassignBed({ id, user }) {
  const assignment = await prisma.bedAssignment.findUnique({
    where: { id },
    include: {
      room: { include: { building: { select: { schoolId: true } } } },
    },
  });
  if (!assignment) throw new ApiError(404, "Bed assignment not found");
  if (user.schoolId && assignment.room.building.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  await prisma.bedAssignment.delete({ where: { id } });

  // Update room status
  const remaining = await prisma.bedAssignment.count({
    where: { roomId: assignment.roomId },
  });
  const room = await prisma.hostelRoom.findUnique({ where: { id: assignment.roomId } });
  await prisma.hostelRoom.update({
    where: { id: assignment.roomId },
    data: { status: remaining === 0 ? "AVAILABLE" : "PARTIAL" },
  });

  return assignment;
}

async function getMaintenanceRequests(user, filters = {}) {
  const schoolId = await resolveSchoolScope(user, filters);
  if (!schoolId) return [];

  const where = { schoolId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.roomId) {
    where.roomId = filters.roomId;
  }

  return prisma.maintenanceRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          building: { select: { id: true, name: true } },
        },
      },
    },
  });
}

async function createMaintenanceRequest({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  if (data.roomId) {
    const room = await prisma.hostelRoom.findUnique({
      where: { id: data.roomId },
      include: { building: { select: { schoolId: true } } },
    });
    if (!room) throw new ApiError(404, "Room not found");
    if (room.building.schoolId !== schoolId) {
      throw new ApiError(403, "Room belongs to a different school");
    }
  }

  return prisma.maintenanceRequest.create({
    data: {
      schoolId,
      roomId: data.roomId || null,
      description: data.description,
      priority: data.priority,
      reportedBy: user.name || user.email,
    },
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          building: { select: { id: true, name: true } },
        },
      },
    },
  });
}

async function updateMaintenanceRequest({ id, data, user }) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request) throw new ApiError(404, "Maintenance request not found");
  if (user.schoolId && request.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updateData = {};
  if (data.status) updateData.status = data.status;
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;

  return prisma.maintenanceRequest.update({
    where: { id },
    data: updateData,
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          building: { select: { id: true, name: true } },
        },
      },
    },
  });
}

module.exports = {
  resolveSchoolScope,
  getBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getRooms,
  createRoom,
  assignBed,
  unassignBed,
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
};
