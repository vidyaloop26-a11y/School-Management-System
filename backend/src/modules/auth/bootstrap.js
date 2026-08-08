// CLI/script: `npm run bootstrap` — creates the first super admin if none exists.
// Uses SUPERVISOR env vars from .env, or prints a generated credential.
const prisma = require("../../lib/prisma");
const env = require("../../config/env");
const authService = require("./auth.service");

async function main() {
  const existing = await prisma.user.count({ where: { role: "superAdmin" } });
  if (existing > 0) {
    console.log("A super admin already exists — nothing to do.");
    return;
  }
  const user = await authService.createSuperAdmin({
    name: env.superAdmin.name,
    email: env.superAdmin.email,
    password: env.superAdmin.password,
  });
  console.log("Super admin created:");
  console.log(`  Email    : ${user.email}`);
  console.log(`  Password : ${env.superAdmin.password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
