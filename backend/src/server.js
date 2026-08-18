const app = require("./app");
const env = require("./config/env");
const prisma = require("./lib/prisma");

async function main() {
  try {
    await prisma.$connect();
    console.log("✔ Connected to MongoDB");
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