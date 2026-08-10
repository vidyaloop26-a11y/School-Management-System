const { PrismaClient } = require("@prisma/client");

// Singleton Prisma client — all DB access goes through this layer so that
// switching providers (MongoDB -> PostgreSQL) never touches controllers/routes.
const prisma = new PrismaClient();

module.exports = prisma;
