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

async function getRoutes(user) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) return [];

  return prisma.transportRoute.findMany({
    where: { schoolId },
    include: {
      vehicle: { select: { id: true, plateNumber: true, type: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: { name: "asc" },
  });
}

async function getRouteById(id, user) {
  const route = await prisma.transportRoute.findUnique({
    where: { id },
    include: {
      vehicle: true,
      assignments: {
        include: {
          student: { select: { id: true, name: true, studentId: true } },
        },
      },
    },
  });
  if (!route) throw new ApiError(404, "Transport route not found");
  if (user.schoolId && route.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return route;
}

async function createRoute({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.transportRoute.create({
    data: {
      schoolId,
      name: data.name,
      stops: data.stops,
      vehicleId: data.vehicleId || null,
    },
    include: { vehicle: true },
  });
}

async function updateRoute({ id, data, user }) {
  const route = await prisma.transportRoute.findUnique({ where: { id } });
  if (!route) throw new ApiError(404, "Transport route not found");
  if (user.schoolId && route.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  return prisma.transportRoute.update({
    where: { id },
    data: {
      name: data.name,
      stops: data.stops,
      vehicleId: data.vehicleId,
    },
    include: { vehicle: true },
  });
}

async function deleteRoute({ id, user }) {
  const route = await prisma.transportRoute.findUnique({ where: { id } });
  if (!route) throw new ApiError(404, "Transport route not found");
  if (user.schoolId && route.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.transportRoute.delete({ where: { id } });
}

async function getVehicles(user) {
  const schoolId = await resolveSchoolScope(user);
  if (!schoolId) return [];

  const now = new Date();
  const vehicles = await prisma.vehicle.findMany({
    where: { schoolId },
    orderBy: { plateNumber: "asc" },
  });

  return vehicles.map((v) => ({
    ...v,
    permitExpired: v.permitExpiry ? v.permitExpiry < now : null,
    insuranceExpired: v.insuranceExpiry ? v.insuranceExpiry < now : null,
  }));
}

async function createVehicle({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  return prisma.vehicle.create({
    data: {
      schoolId,
      plateNumber: data.plateNumber,
      type: data.type || "Bus",
      capacity: data.capacity || null,
      driverName: data.driverName || null,
      driverPhone: data.driverPhone || null,
      permitExpiry: data.permitExpiry ? new Date(data.permitExpiry) : null,
      insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
    },
  });
}

async function updateVehicle({ id, data, user }) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (user.schoolId && vehicle.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }

  const updateData = {};
  if (data.plateNumber !== undefined) updateData.plateNumber = data.plateNumber;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.driverName !== undefined) updateData.driverName = data.driverName;
  if (data.driverPhone !== undefined) updateData.driverPhone = data.driverPhone;
  if (data.permitExpiry !== undefined) updateData.permitExpiry = data.permitExpiry ? new Date(data.permitExpiry) : null;
  if (data.insuranceExpiry !== undefined) updateData.insuranceExpiry = data.insuranceExpiry ? new Date(data.insuranceExpiry) : null;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.vehicle.update({ where: { id }, data: updateData });
}

async function deleteVehicle({ id, user }) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (user.schoolId && vehicle.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.vehicle.delete({ where: { id } });
}

async function assignStudent({ user, data }) {
  const schoolId = user.schoolId;
  if (!schoolId) throw new ApiError(400, "School ID required");

  const route = await prisma.transportRoute.findUnique({ where: { id: data.routeId } });
  if (!route) throw new ApiError(404, "Transport route not found");
  if (schoolId !== route.schoolId) throw new ApiError(403, "Route belongs to a different school");

  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) throw new ApiError(404, "Student not found");
  if (schoolId !== student.schoolId) throw new ApiError(403, "Student belongs to a different school");

  const existing = await prisma.studentRoute.findFirst({
    where: { studentId: data.studentId, routeId: data.routeId },
  });
  if (existing) throw new ApiError(409, "Student already assigned to this route");

  return prisma.studentRoute.create({
    data: {
      schoolId,
      studentId: data.studentId,
      routeId: data.routeId,
      stopName: data.stopName,
      monthlyFee: data.monthlyFee ?? 0,
    },
    include: {
      student: { select: { id: true, name: true, studentId: true } },
      route: { select: { id: true, name: true } },
    },
  });
}

async function removeStudent({ id, user }) {
  const assignment = await prisma.studentRoute.findUnique({ where: { id } });
  if (!assignment) throw new ApiError(404, "Student route assignment not found");
  if (user.schoolId && assignment.schoolId !== user.schoolId) {
    throw new ApiError(403, "Access denied");
  }
  return prisma.studentRoute.delete({ where: { id } });
}

module.exports = {
  resolveSchoolScope,
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignStudent,
  removeStudent,
};
