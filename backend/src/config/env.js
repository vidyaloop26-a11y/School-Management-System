const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Copy backend/.env.example to backend/.env and set it."
    );
  }
  return value.trim();
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: required("DATABASE_URL"),
  accessSecret: required("JWT_ACCESS_SECRET"),
  refreshSecret: required("JWT_REFRESH_SECRET"),
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim()),
  superAdmin: {
    name: process.env.SUPER_ADMIN_NAME,
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
  },
  seedSchool: {
    name: process.env.SEED_SCHOOL_NAME,
    code: process.env.SEED_SCHOOL_CODE,
    board: process.env.SEED_SCHOOL_BOARD,
    address: process.env.SEED_SCHOOL_ADDRESS,
    session: process.env.SEED_SCHOOL_SESSION,
    adminName: process.env.SEED_SCHOOL_ADMIN_NAME,
    adminEmail: process.env.SEED_SCHOOL_ADMIN_EMAIL,
    adminPassword: process.env.SEED_SCHOOL_ADMIN_PASSWORD,
  },
};

module.exports = env;
