const { MongoClient, ObjectId } = require("mongodb");
const env = require("../src/config/env");

const OBJECT_ID_FIELDS = {
  SchoolSettings: ["schoolId"],
  SchoolEvent: ["schoolId"],
  SchoolClass: ["schoolId"],
  SchoolSubject: ["schoolId"],
  ExamConfig: ["schoolId"],
  AdmissionInquiry: ["schoolId"],
  Notice: ["schoolId", "createdById"],
  User: ["schoolId", "studentId", "staffId"],
  RefreshToken: ["userId"],
  AuditLog: ["schoolId"],
  Student: ["schoolId"],
  Staff: ["schoolId"],
  FeeComponent: ["schoolId"],
  FeeStructure: ["schoolId"],
  StudentFeeLedger: ["schoolId", "studentId"],
  Payment: ["schoolId", "studentId"],
  TimetableEntry: ["schoolId", "staffId"],
  AttendanceRecord: ["schoolId", "studentId"],
  ExamMark: ["schoolId", "studentId"],
  PayrollRecord: ["schoolId"],
  IncomeExpenseRecord: ["schoolId"],
  CertificateRecord: ["schoolId"],
  LeaveRequest: ["schoolId"],
  Task: ["schoolId", "assigneeId", "assignedById"],
  SyllabusTopic: ["schoolId"],
  LessonProgress: ["topicId", "teacherId"],
  Album: ["schoolId"],
  Photo: ["albumId"],
  Book: ["schoolId"],
  BookIssue: ["schoolId", "bookId", "studentId", "staffId"],
  TransportRoute: ["schoolId", "vehicleId"],
  Vehicle: ["schoolId"],
  StudentRoute: ["schoolId", "studentId", "routeId"],
  Visitor: ["schoolId", "hostStaffId", "studentId"],
  GatePass: ["schoolId", "visitorId", "studentId"],
  HostMapping: ["schoolId"],
  InventoryItem: ["schoolId"],
  PurchaseRecord: ["schoolId", "itemId"],
  IssueLog: ["schoolId", "itemId"],
  Building: ["schoolId"],
  HostelRoom: ["buildingId"],
  BedAssignment: ["roomId", "studentId"],
  MaintenanceRequest: ["schoolId", "roomId"],
  CopyCheckBatch: ["schoolId", "assignedToId"],
  CopyCheckEntry: ["batchId", "studentId"],
  DiaryEntry: ["schoolId", "authorId"],
  Homework: ["schoolId", "assignedById"],
  HomeworkSubmission: ["homeworkId", "studentId"],
  LeaveBalance: ["schoolId", "staffId"],
};

const HEX_OBJECT_ID = /^[a-fA-F0-9]{24}$/;

async function repairField(collection, field, db) {
  const cursor = db.collection(collection).find(
    { [field]: { $type: "string", $regex: HEX_OBJECT_ID.source } },
    { projection: { _id: 1, [field]: 1 } }
  );

  let changed = 0;
  let batch = [];

  for await (const doc of cursor) {
    const value = doc[field];
    if (!HEX_OBJECT_ID.test(value)) continue;

    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { [field]: new ObjectId(value) } },
      },
    });

    if (batch.length >= 500) {
      const result = await db.collection(collection).bulkWrite(batch, { ordered: false });
      changed += result.modifiedCount;
      batch = [];
    }
  }

  if (batch.length) {
    const result = await db.collection(collection).bulkWrite(batch, { ordered: false });
    changed += result.modifiedCount;
  }

  return changed;
}

async function repairObjectIdFields(db) {
  const summary = {};

  for (const [collection, fields] of Object.entries(OBJECT_ID_FIELDS)) {
    for (const field of fields) {
      const changed = await repairField(collection, field, db);
      if (changed > 0) {
        summary[collection] = summary[collection] || {};
        summary[collection][field] = changed;
      }
    }
  }

  return summary;
}

async function main() {
  const client = new MongoClient(env.databaseUrl);
  await client.connect();

  try {
    const summary = await repairObjectIdFields(client.db());
    console.log(JSON.stringify({ success: true, repaired: summary }, null, 2));
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { repairObjectIdFields };
