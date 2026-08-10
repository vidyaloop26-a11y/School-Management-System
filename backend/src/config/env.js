const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/vidyaloop",
  accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim()),
  superAdmin: {
    name: process.env.SUPER_ADMIN_NAME || "Vidyaloop Super Admin",
    email: process.env.SUPER_ADMIN_EMAIL || "superadmin@vidyaloop.in",
    password: process.env.SUPER_ADMIN_PASSWORD || "Super@1234",
  },
};

module.exports = env;