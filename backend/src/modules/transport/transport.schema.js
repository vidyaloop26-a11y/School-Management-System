const { z } = require("zod");

const stopSchema = z.object({
  name: z.string().min(1),
  time: z.string().min(1),
});

const createRouteSchema = z.object({
  name: z.string().min(1),
  stops: z.array(stopSchema).min(1),
  vehicleId: z.string().optional(),
});

const updateRouteSchema = z.object({
  name: z.string().min(1).optional(),
  stops: z.array(stopSchema).min(1).optional(),
  vehicleId: z.string().optional(),
});

const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  type: z.enum(["Bus", "Van", "Auto"]).default("Bus"),
  capacity: z.number().int().positive().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  permitExpiry: z.string().optional(),
  insuranceExpiry: z.string().optional(),
});

const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1).optional(),
  type: z.enum(["Bus", "Van", "Auto"]).optional(),
  capacity: z.number().int().positive().optional(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  permitExpiry: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  status: z.string().optional(),
});

const assignStudentSchema = z.object({
  studentId: z.string().min(1),
  routeId: z.string().min(1),
  stopName: z.string().min(1),
  monthlyFee: z.number().default(0),
});

const transportQuerySchema = z.object({
  schoolId: z.string().optional(),
  search: z.string().optional(),
  vehicleId: z.string().optional(),
});

const idParam = z.object({ id: z.string().min(1) });

module.exports = {
  createRouteSchema,
  updateRouteSchema,
  createVehicleSchema,
  updateVehicleSchema,
  assignStudentSchema,
  transportQuerySchema,
  idParam,
};
