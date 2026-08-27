const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { notFound } = require("./lib/errors");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./modules/auth/auth.routes");
const schoolsRoutes = require("./modules/schools/schools.routes");
const studentsRoutes = require("./modules/students/students.routes");
const staffRoutes = require("./modules/staff/staff.routes");
const timetableRoutes = require("./modules/timetable/timetable.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const examinationRoutes = require("./modules/examination/examination.routes");
const admissionsRoutes = require("./modules/admissions/admissions.routes");
const communicationRoutes = require("./modules/communication/communication.routes");
const payrollRoutes = require("./modules/payroll/payroll.routes");
const financeRoutes = require("./modules/finance/finance.routes");
const certificatesRoutes = require("./modules/certificates/certificates.routes");
const leaveRoutes = require("./modules/leave/leave.routes");
const supportRoutes = require("./modules/support/support.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const transportRoutes = require("./modules/transport/transport.routes");
const hostelRoutes = require("./modules/hostel/hostel.routes");
const tasksRoutes = require("./modules/tasks/tasks.routes");
const syllabusRoutes = require("./modules/syllabus/syllabus.routes");
const galleryRoutes = require("./modules/gallery/gallery.routes");
const libraryRoutes = require("./modules/library/library.routes");
const frontofficeRoutes = require("./modules/frontoffice/frontoffice.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");
const copycheckingRoutes = require("./modules/copychecking/copychecking.routes");

const app = express();
const api = express.Router();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) =>
      env.isAllowedOrigin(origin)
        ? cb(null, true)
        : cb(new Error(`Origin not allowed by CORS: ${origin}`)),
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
if (env.nodeEnv !== "test") app.use(morgan("dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const prisma = require("./lib/prisma");
api.get("/health", async (req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ success: true, database: "connected", message: "Vidyaloop API up" });
  } catch (err) {
    res.status(500).json({ success: false, database: "disconnected", error: err.message });
  }
});
api.use("/auth", authLimiter, authRoutes);
api.use("/schools", schoolsRoutes);
api.use("/students", studentsRoutes);
api.use("/staff", staffRoutes);
api.use("/timetable", timetableRoutes);
api.use("/attendance", attendanceRoutes);
api.use("/dashboard", dashboardRoutes);
api.use("/examination", examinationRoutes);
api.use("/admissions", admissionsRoutes);
api.use("/communication", communicationRoutes);
api.use("/notices", communicationRoutes);
api.use("/payroll", payrollRoutes);
api.use("/finance", financeRoutes);
api.use("/income", financeRoutes);
api.use("/certificates", certificatesRoutes);
api.use("/leave", leaveRoutes);
api.use("/support", supportRoutes);
api.use("/settings", settingsRoutes);
api.use("/transport", transportRoutes);
api.use("/hostel", hostelRoutes);
api.use("/tasks", tasksRoutes);
api.use("/syllabus", syllabusRoutes);
api.use("/gallery", galleryRoutes);
api.use("/library", libraryRoutes);
api.use("/frontoffice", frontofficeRoutes);
api.use("/inventory", inventoryRoutes);
api.use("/copychecking", copycheckingRoutes);

app.use("/api", api);
app.use(notFound);
app.use(require("./middleware/errorHandler").errorHandler);

module.exports = app;