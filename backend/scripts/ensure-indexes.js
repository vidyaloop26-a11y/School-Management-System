// Ensures MongoDB indexes required by the app but not expressible in the
// Prisma schema. Prisma creates NON-sparse unique indexes for optional
// `@unique` fields, which makes every `null`/missing value collide after the
// first document (MongoDB unique indexes treat missing fields as `null`).
// We need SPARSE unique indexes on `User.studentId` / `User.staffId` so that
// multiple users (super admins, school admins, teachers) can coexist without
// a linked student/staff while a student/staff still maps to at most one user.
// Run AFTER `prisma db push` (see `npm run db:setup`).
const { MongoClient } = require("mongodb");

const uri = process.env.DATABASE_URL || "mongodb://127.0.0.1:27018/vidyaloop";

// Prisma appends /?... options we must strip before connecting with the driver.
const baseUri = uri.split("?")[0];

const TARGETS = [
  { field: "studentId", name: "User_studentId_key" },
  { field: "staffId", name: "User_staffId_key" },
];

async function main() {
  const client = new MongoClient(baseUri, { directConnection: true });
  try {
    await client.connect();
    const db = client.db();
    const col = db.collection("User");

    for (const { field, name } of TARGETS) {
      const existing = (await col.indexes()).find((i) => i.name === name);
      if (existing && existing.sparse && existing.unique) {
        console.log(`Index ${name} already sparse+unique, skipping`);
        continue;
      }
      if (existing) await col.dropIndex(name);
      await col.createIndex({ [field]: 1 }, { name, unique: true, sparse: true });
      console.log(`Created sparse unique index ${name} on User.${field}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Failed to ensure sparse indexes:", err.message);
  process.exitCode = 1;
});
