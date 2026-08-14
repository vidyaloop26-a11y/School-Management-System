const env = require("../config/env");
const prisma = require("../lib/prisma");

// Generates a random temporary password for generated credentials.
function generateTempPassword(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const buf = [];
  for (let i = 0; i < len; i++) {
    buf.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return buf.join("");
}

// Builds a deterministic unique username for a user, guaranteeing no duplicates.
async function generateUsername(base, prisma) {
  let candidate = (base || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!candidate) candidate = "user";
  let finalUsername = candidate;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    suffix += 1;
    finalUsername = `${candidate}${suffix}`;
  }
  return finalUsername;
}

// Guarantees that an email address is unique in the User collection.
async function ensureUniqueEmail(emailBase, prisma) {
  let candidate = (emailBase || "").toLowerCase().trim();
  if (!candidate || !candidate.includes("@")) {
    candidate = "user@vidyaloop.local";
  }
  let [local, domain] = candidate.split("@");
  let finalEmail = candidate;
  let counter = 0;
  while (await prisma.user.findUnique({ where: { email: finalEmail } })) {
    counter++;
    finalEmail = `${local}${counter}@${domain}`;
  }
  return finalEmail;
}

module.exports = { generateTempPassword, generateUsername, ensureUniqueEmail };