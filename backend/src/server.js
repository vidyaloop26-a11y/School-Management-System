const app = require("./app");
const env = require("./config/env");
const prisma = require("./lib/prisma");

const authService = require("./modules/auth/auth.service");

async function ensureSuperAdmin() {
  try {
    const email = (env.superAdmin.email || "superadmin@vidyaloop.in").toLowerCase().trim();
    const password = env.superAdmin.password || "Super@1234";
    const name = env.superAdmin.name || "Vidyaloop Super Admin";
    const passwordHash = await authService.hashPassword(password);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { role: "superAdmin" },
          { email: { equals: email, mode: "insensitive" } },
          { username: { equals: email, mode: "insensitive" } },
        ],
      },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          name,
          email,
          username: email,
          passwordHash,
          role: "superAdmin",
          isActive: true,
          mustChangePassword: false,
        },
      });
      console.log(`✔ Super admin created: ${email}`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name || name,
          email: existing.email || email,
          username: existing.username || email,
          passwordHash,
          role: "superAdmin",
          isActive: true,
          mustChangePassword: false,
        },
      });
      console.log(`✔ Super admin synced: ${existing.email || email}`);
    }
  } catch (err) {
    console.error("⚠ Warning: Could not auto-sync super admin on startup:", err.message);
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log("✔ Connected to MongoDB");
    await ensureSuperAdmin();
  } catch (err) {
    console.error("✘ Could not connect to database. Check DATABASE_URL in backend/.env");
    console.error(err.message);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`✔ Vidyaloop API listening on http://localhost:${env.port}/api`);
  });
}

main();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("unhandledRejection", async (reason) => {
  console.error("💥 Unhandled Rejection at Promise:", reason);
  await prisma.$disconnect();
  process.exit(1);
});
process.on("uncaughtException", async (err) => {
  console.error("💥 Uncaught Exception thrown:", err);
  await prisma.$disconnect();
  process.exit(1);
});