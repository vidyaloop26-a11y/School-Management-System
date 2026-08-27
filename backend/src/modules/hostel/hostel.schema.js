const { z } = require("zod");

const BUILDING_TYPES = ["Hostel", "Academic", "Admin"];
const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];
const PRIORITY_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const MAINTENANCE_STATUS = ["PENDING", "IN_PROGRESS", "COMPLETED"];

const createBuildingSchema = z.object({
  name: z.string().min(1),
  type: z.enum(BUILDING_TYPES).default("Hostel"),
  floors: z.number().int().min(1).default(1),
});

const createRoomSchema = z.object({
  buildingId: z.string().min(1),
  floor: z.number().int().min(0).default(0),
  roomNumber: z.string().min(1),
  bedCount: z.number().int().min(1).default(2),
  roomType: z.enum(ROOM_TYPES).default("Standard"),
});

const assignBedSchema = z.object({
  roomId: z.string().min(1),
  bedNumber: z.number().int().min(1),
  studentId: z.string().min(1),
  session: z.string().optional(),
});

const createMaintenanceSchema = z.object({
  roomId: z.string().optional(),
  description: z.string().min(1),
  priority: z.enum(PRIORITY_LEVELS).default("MEDIUM"),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(MAINTENANCE_STATUS).optional(),
  assignedTo: z.string().optional(),
});

const hostelQuerySchema = z.object({
  buildingId: z.string().optional(),
  floor: z.coerce.number().int().optional(),
  roomType: z.string().optional(),
  status: z.string().optional(),
  schoolId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = {
  BUILDING_TYPES,
  ROOM_TYPES,
  PRIORITY_LEVELS,
  MAINTENANCE_STATUS,
  createBuildingSchema,
  createRoomSchema,
  assignBedSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  hostelQuerySchema,
};
