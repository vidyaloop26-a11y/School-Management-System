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

const app = express();
const api = express.Router();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
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

app.use("/api", api);
app.use(notFound);
app.use(require("./middleware/errorHandler").errorHandler);

module.exports = app;