// One-time migration: Role enum "teacher" → "staff" + duties ["teacher"].
//
// Prisma cannot rewrite existing documents when an enum value is renamed, so
// this script runs against MongoDB directly. Idempotent — safe to re-run.
//
// Usage: node scripts/migrate-role-duties.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { MongoClient } = require("mongodb");

const uri = process.env.DATABASE_URL || "mongodb://127.0.0.1:27018/vidyaloop";
const baseUri = uri.split("?")[0];

const ALL_DUTIES = [
  "principal",
  "vicePrincipal",
  "hod",
  "teacher",
  "examCoordinator",
  "accountant",
  "frontOffice",
  "librarian",
  "transportIncharge",
  "warden",
  "hrManager",
  "admissionsOfficer",
  "itAdmin",
];

async function main() {
  const client = new MongoClient(baseUri);
  await client.connect();
  const db = client.db();

  // 1. Migrate teacher-role users to staff + duty
  const teachers = await db.collection("User").countDocuments({ role: "teacher" });
  if (teachers > 0) {
    const res = await db
      .collection("User")
      .updateMany(
        { role: "teacher" },
        {
          $set: { role: "staff" },
          $addToSet: { duties: "teacher" },
        }
      );
    console.log(`Migrated ${res.modifiedCount} user(s) from role "teacher" to role "staff" + duty "teacher"`);
  } else {
    console.log('No legacy "teacher" role users found');
  }

  // 2. Ensure every user has a duties array (empty default)
  const noDuties = await db
    .collection("User")
    .countDocuments({ duties: { $exists: false } });
  if (noDuties > 0) {
    const res = await db
      .collection("User")
      .updateMany({ duties: { $exists: false } }, { $set: { duties: [] } });
    console.log(`Initialized empty duties array on ${res.modifiedCount} user(s)`);
  }

  // 3. Sanity report
  const byRole = await db
    .collection("User")
    .aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
    .toArray();
  console.log("Current role distribution:", byRole.map((r) => `${r._id}: ${r.count}`).join(", "));

  const invalidDuties = await db
    .collection("User")
    .countDocuments({ duties: { $elemMatch: { $nin: ALL_DUTIES } } });
  if (invalidDuties > 0) {
    console.warn(`WARNING: ${invalidDuties} user(s) hold unrecognized duty values — review manually`);
  }

  await client.close();
  console.log("Migration complete");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
});
