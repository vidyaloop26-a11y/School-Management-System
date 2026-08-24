const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const rawPort = String(process.env.PORT || "5000").split(" ")[0].split("|")[0].trim();

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(rawPort, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/vidyaloop",
  accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10),
  corsOrigins,
  secretKey: process.env.CREDENTIAL_SECRET_KEY || "change-me-credential-secret-32bytes!!",
  superAdmin: {
    name: process.env.SUPER_ADMIN_NAME || "Vidyaloop Super Admin",
    email: process.env.SUPER_ADMIN_EMAIL || "superadmin@vidyaloop.in",
    password: process.env.SUPER_ADMIN_PASSWORD || "Super@1234",
  },
};

const matchOrigin = (origin, allowed) => {
  if (!allowed.includes("*")) return allowed === origin;
  let a;
  let o;
  try {
    a = new URL(allowed);
    o = new URL(origin);
  } catch {
    return false;
  }
  const [prefix, suffix] = a.host.split("*");
  return (
    o.protocol === a.protocol &&
    o.hostname.startsWith(prefix) &&
    o.hostname.endsWith(suffix) &&
    o.hostname.length > prefix.length + suffix.length
  );
};

const isAllowedOrigin = (origin) =>
  !origin || env.corsOrigins.some((allowed) => matchOrigin(origin, allowed));

if (env.nodeEnv === "production") {
  const problems = [];
  if (!process.env.DATABASE_URL || /\/\/(127\.0\.0\.1|localhost)/.test(env.databaseUrl)) {
    problems.push("DATABASE_URL must point to your production database");
  }
  if (!process.env.JWT_ACCESS_SECRET || env.accessSecret === "dev-access-secret") {
    problems.push("JWT_ACCESS_SECRET must be set to a strong random value");
  }
  if (!process.env.JWT_REFRESH_SECRET || env.refreshSecret === "dev-refresh-secret") {
    problems.push("JWT_REFRESH_SECRET must be set to a strong random value");
  }
  if (corsOrigins.some((o) => /\/\/(127\.0\.0\.1|localhost)/.test(o))) {
    problems.push(`CORS_ORIGINS contains localhost entries (${corsOrigins.join(", ")}) — add your frontend URL, e.g. https://your-app.vercel.app (no trailing slash). Wildcards like https://project-*.vercel.app are supported.`);
  }
  if (problems.length) {
    throw new Error(
      `Refusing to start in production with unsafe config:\n  - ${problems.join("\n  - ")}`
    );
  }
}

module.exports = { ...env, isAllowedOrigin };