const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  for (const m of ["School","Student","AttendanceRecord","ExamMark","StudentFeeLedger","Payment","Homework","TimetableEntry","SyllabusTopic","Staff","DiaryEntry","LeaveRequest","FeeComponent","FeeStructure","Teacher","Book","Vehicle","TransportRoute","Visitor","InventoryItem","Building"]) {
    try { console.log(m, await p[m].count()); } catch (e) { console.log(m, "ERR"); }
  }
  const att = await p.attendanceRecord.findFirst();
  console.log("sample attendance:", JSON.stringify({ schoolId: att?.schoolId, cls: att?.cls }));
  const sch = await p.school.findFirst({ where: { code: "VLPS" } });
  console.log("VLPS id:", sch.id);
  console.log("VLPS attendance via raw equality:", await p.attendanceRecord.count({ where: { schoolId: String(sch.id) } }));
  await p.$disconnect();
})();