const env = require("../config/env");
const prisma = require("../lib/prisma");
const { ApiError, catchAsync } = require("../lib/errors");

// Generates a random temporary password for generated credentials.
function generateTempPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const buf = [];
  for (let i = 0; i < len; i++) {
    buf.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return buf.join("");
}

// Builds a deterministic-ish unique username for a credential holder.
async function generateUsername(base, prisma) {
  let candidate = base.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!candidate) candidate = "user";
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base.toLowerCase().replace(/[^a-z0-9]/g, "")}${suffix}`;
  }
  return candidate;
}

module.exports = { generateTempPassword, generateUsername };