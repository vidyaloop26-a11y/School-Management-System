const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { CERT_TYPES } = require("../src/modules/certificates/certificates.service");

// ---------------------------------------------------------------------------
// Demo accounts seeded by backend/prisma/seed-demo.js for school VLPS.
// ---------------------------------------------------------------------------
const CREDS = {
  superAdmin: { identifier: "superadmin@vidyaloop.in", password: "Super@1234", role: "superAdmin" },
  admin: { identifier: "admin-VLPS", password: "admin123", role: "schoolAdmin" },
  teacher: { identifier: "teacher-VLPS", password: "teacher123", role: "staff" },
  accountant: { identifier: "accountant-VLPS", password: "accountant123", role: "staff" },
  frontoffice: { identifier: "frontoffice-VLPS", password: "frontoffice123", role: "staff" },
  transport: { identifier: "transport-VLPS", password: "transport123", role: "staff" },
  librarian: { identifier: "librarian-VLPS", password: "librarian123", role: "staff" },
  hr: { identifier: "hr-VLPS", password: "hr123", role: "staff" },
  admissions: { identifier: "admissions-VLPS", password: "admissions123", role: "staff" },
  parent: { identifier: "VLPS0001-p", password: "parent123", role: "parent" },
};

const tokens = {};
const ctx = { counts: {} };

function deepArray(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 4) return null;
  if (Array.isArray(node)) return node;
  for (const k of Object.keys(node)) {
    const found = deepArray(node[k], depth + 1);
    if (found) return found;
  }
  return null;
}

function okStatus(res) {
  assert.ok(res.status < 400, `expected 2xx/3xx got ${res.status} body=${JSON.stringify(res.body)}`);
  return res.body;
}

function get(role, path) {
  return request(app).get(path).set("Authorization", `Bearer ${tokens[role]}`);
}
function post(role, path) {
  return request(app).post(path).set("Authorization", `Bearer ${tokens[role]}`);
}
function put(role, path) {
  return request(app).put(path).set("Authorization", `Bearer ${tokens[role]}`);
}
function del(role, path) {
  return request(app).delete(path).set("Authorization", `Bearer ${tokens[role]}`);
}

const MODEL_COUNTS = [
  "Student", "Staff", "TimetableEntry", "AttendanceRecord", "AdmissionInquiry", "Notice",
  "PayrollRecord", "IncomeExpenseRecord", "CertificateRecord", "LeaveRequest", "Task",
  "SyllabusTopic", "Album", "Photo", "Book", "BookIssue", "TransportRoute", "Vehicle",
  "StudentRoute", "Visitor", "GatePass", "HostMapping", "InventoryItem", "Building",
  "HostelRoom", "BedAssignment", "MaintenanceRequest", "CopyCheckBatch", "CopyCheckEntry",
  "FeeComponent", "FeeStructure", "StudentFeeLedger", "Payment", "SchoolEvent", "SchoolSubject",
];

before(async () => {
  await prisma.$connect();

  for (const [key, cred] of Object.entries(CREDS)) {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: cred.identifier, password: cred.password });
    assert.equal(res.status, 200, `login ${cred.identifier} failed: ${JSON.stringify(res.body)}`);
    tokens[key] = res.body.accessToken;
  }

  const school = await prisma.school.findFirst({ where: { code: "VLPS" } });
  if (!school) {
    throw new Error("VLPS school missing - start backend then run: node prisma/seed-demo.js");
  }
  assert.ok(school, "seed data missing: no school found—run node prisma/seed-demo.js");
  ctx.school = school;

  const student = await prisma.student.findFirst({
    where: { schoolId: school.id, status: "Active" },
    orderBy: { admNo: "asc" },
  });
  assert.ok(student, "seed data missing: no active student");
  ctx.student = student;

  const staff = await prisma.staff.findFirst({ where: { schoolId: school.id } });
  assert.ok(staff, "seed data missing: no staff");
  ctx.staff = staff;

  const teacherStaff = await prisma.staff.findFirst({
    where: { schoolId: school.id, duties: { has: "teacher" } },
  });
  ctx.teacherStaff = teacherStaff || staff;

  const parentUser = await prisma.user.findFirst({
    where: { username: "VLPS0001-p" },
  });
  ctx.child = parentUser?.studentId || student.id;

  const att = await prisma.attendanceRecord.findFirst({ where: { schoolId: school.id } });
  ctx.cls = att?.cls || student.cls || "5";
  ctx.section = att?.section || student.section || "A";
  ctx.attDate = att?.date ? att.date.toISOString().slice(0, 10) : "2025-01-15";
  ctx.month = att?.date ? att.date.getUTCMonth() + 1 : 1;
  ctx.year = att?.date ? att.date.getUTCFullYear() : 2025;

  const activeStudents = await prisma.student.findMany({
    where: { schoolId: school.id, cls: ctx.cls, section: ctx.section, status: "Active" },
    take: 2,
  });
  ctx.roster = activeStudents.length
    ? activeStudents.map((s) => ({ studentId: s.id, status: "P" }))
    : [{ studentId: student.id, status: "P" }];

  for (const model of MODEL_COUNTS) {
    try {
      ctx.counts[model] = await prisma[model].count({ where: { schoolId: school.id } });
    } catch {
      try {
        ctx.counts[model] = await prisma[model].count();
      } catch {
        ctx.counts[model] = 0;
      }
    }
  }
  ctx.counts.Student = await prisma.student.count({ where: { schoolId: school.id } });
  ctx.counts.Staff = await prisma.staff.count({ where: { schoolId: school.id } });
});

after(async () => {
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Auth: every demo account can log in and fetch its own profile.
// ---------------------------------------------------------------------------
describe("Auth: demo accounts", () => {
  for (const [key, cred] of Object.entries(CREDS)) {
    it(`GET /api/auth/me works for ${key}`, async () => {
      const res = await get(key, "/api/auth/me");
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.role, cred.role);
    });
  }

  it("rejects a bad password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "admin-VLPS", password: "wrong" });
    assert.equal(res.status, 401);
  });
});

// ---------------------------------------------------------------------------
// Read smoke tests: every screen's backing endpoint returns DB data.
// Each case: [role, label, method, path, query?, modelForRows(optional)].
// When counts[model] > 0 the response must contain a non-empty array.
// ---------------------------------------------------------------------------
const READ_CASES = [
  ["admin", "students list", "get", "/students", {}, "Student"],
  ["admin", "student detail", "get", "/students/:id", {}, null],
  ["admin", "staff list", "get", "/staff", {}, "Staff"],
  ["admin", "staff detail", "get", "/staff/:id", {}, null],
  ["admin", "class timetable", "get", "/timetable", { cls: "{{cls}}", section: "{{section}}" }, "TimetableEntry"],
  ["admin", "teacher timetable", "get", "/timetable/teacher", { staffId: "{{staffId}}" }, null],
  ["admin", "attendance roster", "get", "/attendance", { cls: "{{cls}}", section: "{{section}}", date: "{{date}}" }, null],
  ["admin", "attendance markers", "get", "/attendance/markers", { cls: "{{cls}}", section: "{{section}}", date: "{{date}}" }, null],
  ["admin", "student attendance", "get", "/attendance/student", { studentId: "{{studentId}}", month: "{{month}}", year: "{{year}}" }, null],
  ["admin", "exam roster", "get", "/examination", { cls: "{{cls}}", section: "{{section}}", session: "2024-2025" }, null],
  ["admin", "report card", "get", "/examination/report-card", { studentId: "{{studentId}}", session: "2024-2025" }, null],
  ["admin", "admissions list", "get", "/admissions", {}, "AdmissionInquiry"],
  ["admin", "notices list", "get", "/communication", {}, "Notice"],
  ["admin", "payroll list", "get", "/payroll", {}, "PayrollRecord"],
  ["admin", "finance records", "get", "/finance", {}, "IncomeExpenseRecord"],
  ["admin", "finance summary", "get", "/finance/summary", {}, null],
  ["admin", "certificates list", "get", "/certificates", {}, "CertificateRecord"],
  ["admin", "leave list", "get", "/leave", {}, "LeaveRequest"],
  ["admin", "tasks list", "get", "/tasks", {}, "Task"],
  ["admin", "syllabus topics", "get", "/syllabus", {}, "SyllabusTopic"],
  ["admin", "syllabus dashboard", "get", "/syllabus/dashboard", {}, null],
  ["admin", "gallery albums", "get", "/gallery", {}, "Album"],
  ["admin", "library books", "get", "/library", {}, "Book"],
  ["admin", "library issues", "get", "/library/issues", {}, "BookIssue"],
  ["admin", "transport routes", "get", "/transport/routes", {}, "TransportRoute"],
  ["admin", "transport vehicles", "get", "/transport/vehicles", {}, "Vehicle"],
  ["admin", "inventory items", "get", "/inventory", {}, "InventoryItem"],
  ["admin", "inventory low-stock", "get", "/inventory/low-stock", {}, null],
  ["admin", "front office visitors", "get", "/frontoffice/visitors", {}, "Visitor"],
  ["admin", "gate passes", "get", "/frontoffice/gate-passes", {}, "GatePass"],
  ["admin", "host mappings", "get", "/frontoffice/host-mappings", {}, "HostMapping"],
  ["admin", "hostel buildings", "get", "/hostel/buildings", {}, "Building"],
  ["admin", "hostel rooms", "get", "/hostel/rooms", {}, "HostelRoom"],
  ["admin", "hostel maintenance", "get", "/hostel/maintenance", {}, "MaintenanceRequest"],
  ["admin", "copy checking batches", "get", "/copychecking", {}, "CopyCheckBatch"],
  ["admin", "fee components", "get", "/fees/components", {}, "FeeComponent"],
  ["admin", "fee structures", "get", "/fees/structures", {}, "FeeStructure"],
  ["admin", "fee ledger", "get", "/fees/ledger", {}, "StudentFeeLedger"],
  ["admin", "fee summary", "get", "/fees/summary", {}, null],
  ["admin", "student fee history", "get", "/fees/students/:studentId", {}, null],
  ["admin", "settings", "get", "/settings", {}, null],
  ["admin", "events & holidays", "get", "/settings/events", {}, "SchoolEvent"],
  ["admin", "school subjects", "get", "/settings/subjects", {}, "SchoolSubject"],
  ["admin", "dashboard", "get", "/dashboard", {}, null],
  ["teacher", "students list (teacher)", "get", "/students", {}, "Student"],
  ["teacher", "staff list (teacher)", "get", "/staff", {}, "Staff"],
  ["teacher", "class timetable (teacher)", "get", "/timetable", { cls: "{{cls}}", section: "{{section}}" }, "TimetableEntry"],
  ["teacher", "attendance roster (teacher)", "get", "/attendance", { cls: "{{cls}}", section: "{{section}}" }, null],
  ["teacher", "exam roster (teacher)", "get", "/examination", { cls: "{{cls}}", section: "{{section}}" }, null],
  ["teacher", "diary (teacher)", "get", "/diary", { cls: "{{cls}}", section: "{{section}}" }, null],
  ["teacher", "homework (teacher)", "get", "/homework", {}, null],
  ["teacher", "tasks (teacher)", "get", "/tasks", {}, null],
  ["accountant", "finance (accountant)", "get", "/finance", {}, "IncomeExpenseRecord"],
  ["accountant", "payroll (accountant)", "get", "/payroll", {}, "PayrollRecord"],
  ["frontoffice", "visitors (frontoffice)", "get", "/frontoffice/visitors", {}, "Visitor"],
  ["admissions", "admissions (admissions officer)", "get", "/admissions", {}, "AdmissionInquiry"],
  ["librarian", "library (librarian)", "get", "/library", {}, "Book"],
  ["librarian", "library issues (librarian)", "get", "/library/issues", {}, "BookIssue"],
  ["transport", "routes (transport)", "get", "/transport/routes", {}, "TransportRoute"],
  ["transport", "vehicles (transport)", "get", "/transport/vehicles", {}, "Vehicle"],
  ["hr", "staff list (hr)", "get", "/staff", {}, "Staff"],
];

describe("Read: every screen endpoint serves seeded DB data", () => {
  for (const [role, label, verb, path, q, model] of READ_CASES) {
    it(`[${role}] GET ${path}${Object.keys(q).length ? " (...)" : ""} — ${label}`, async () => {
      const query = {};
      for (const [k, v] of Object.entries(q)) {
        query[k] = String(v)
          .replaceAll("{{cls}}", ctx.cls)
          .replaceAll("{{section}}", ctx.section)
          .replaceAll("{{date}}", ctx.attDate)
          .replaceAll("{{month}}", String(ctx.month))
          .replaceAll("{{year}}", String(ctx.year))
          .replaceAll("{{studentId}}", ctx.student.id)
          .replaceAll("{{staffId}}", ctx.teacherStaff.id || ctx.staff.id);
      }
      const p = path.replace(":id", ctx.student.id).replace(":studentId", ctx.student.id);
      const url = p + (Object.keys(query).length ? `?${new URLSearchParams(query)}` : "");
      const res = await get(role, url);
      assert.equal(res.status, 200, `GET ${url} -> ${res.status}: ${JSON.stringify(res.body)}`);
      if (model && ctx.counts[model] > 0) {
        const arr = deepArray(res.body);
        assert.ok(arr && arr.length > 0, `GET ${url} returned no rows for ${model}`);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Super admin (platform console)
// ---------------------------------------------------------------------------
describe("Super admin platform console", () => {
  it("lists schools", async () => {
    const res = await get("superAdmin", "/api/schools");
    assert.equal(res.status, 200);
    assert.ok(deepArray(res.body).length >= 3, "expected at least 3 seeded schools");
  });

  it("reads a school profile", async () => {
    const res = await get("superAdmin", `/api/schools/${ctx.school.id}`);
    assert.equal(res.status, 200);
  });

  it("gets support stats + school summaries", async () => {
    const stats = await get("superAdmin", "/api/support/stats");
    assert.equal(stats.status, 200);
    const schools = await get("superAdmin", "/api/support/schools");
    assert.equal(schools.status, 200);
    assert.ok(deepArray(schools.body).length >= 3);
    const profile = await get("superAdmin", `/api/support/school/${ctx.school.id}`);
    assert.equal(profile.status, 200);
  });
});

// ---------------------------------------------------------------------------
// Parent portal: child-scoped reads.
// ---------------------------------------------------------------------------
describe("Parent portal (VLPS0001-p)", () => {
  it("dashboard renders", async () => {
    const res = await get("parent", "/api/dashboard");
    assert.equal(res.status, 200);
  });

  it("sees ONLY their own child in /students", async () => {
    const res = await get("parent", "/api/students");
    assert.equal(res.status, 200);
    const rows = deepArray(res.body);
    assert.ok(rows.length <= 1, `parent must see at most own child, got ${rows.length}`);
  });

  it("child fee history", async () => {
    const res = await get("parent", `/api/fees/students/${ctx.child}`);
    assert.equal(res.status, 200);
  });

  it("child fee ledger", async () => {
    const res = await get("parent", `/api/fees/ledger?studentId=${ctx.child}`);
    assert.equal(res.status, 200);
  });

  it("child attendance", async () => {
    const res = await get("parent", `/api/attendance/student?studentId=${ctx.child}&month=${ctx.month}&year=${ctx.year}`);
    assert.equal(res.status, 200);
  });

  it("class homework + diary + notices + events + leave", async () => {
    for (const path of [
      `/api/homework?cls=${ctx.cls}&section=${ctx.section}`,
      `/api/diary?cls=${ctx.cls}&section=${ctx.section}`,
      "/api/communication",
      "/api/settings/events",
      "/api/leave",
    ]) {
      const res = await get("parent", path);
      assert.equal(res.status, 200, `GET ${path} -> ${res.status}`);
    }
  });

  it("cannot read other student's fee history", async () => {
    const other = await prisma.student.findFirst({
      where: { schoolId: ctx.school.id, id: { not: ctx.child } },
    });
    if (other) {
      const res = await get("parent", `/api/fees/students/${other.id}`);
      assert.equal(res.status, 403);
    }
  });
});

// ---------------------------------------------------------------------------
// RBAC enforcement.
// ---------------------------------------------------------------------------
describe("RBAC: forbidden access is rejected", () => {
  const cases = [
    ["superAdmin", "get", "/api/students", 403],
    ["superAdmin", "get", "/api/staff", 403],
    ["teacher", "post", "/api/students", 403],
    ["teacher", "post", "/api/students/bulk", 403],
    ["parent", "post", "/api/students", 403],
    ["parent", "put", "/api/students/:id", 403],
    ["parent", "post", "/api/staff", 403],
    ["parent", "post", "/api/homework", 403],
    ["parent", "post", "/api/diary", 403],
    ["teacher", "post", "/api/payroll/process", 403],
    ["teacher", "post", "/api/finance", 403],
    ["teacher", "post", "/api/library", 403],
    ["teacher", "post", "/api/hostel/buildings", 403],
    ["accountant", "post", "/api/transport/routes", 403],
    ["accountant", "post", "/api/copychecking", 403],
    ["accountant", "post", "/api/students", 403],
    ["librarian", "post", "/api/inventory", 403],
    ["parent", "get", "/api/admissions", 403],
    ["parent", "get", "/api/support/stats", 403],
    ["teacher", "get", "/api/support/schools", 403],
    ["admin", "get", "/api/schools", 403],
    ["admin", "get", "/api/support/stats", 403],
  ];
  for (const [role, verb, path, expected] of cases) {
    it(`[${role}] ${verb.toUpperCase()} ${path} -> ${expected}`, async () => {
      const p = path.replace(":id", ctx.student.id);
      const builder = verb === "get" ? get : verb === "post" ? post : verb === "put" ? put : del;
      const res = await builder(role, p).send({});
      assert.equal(res.status, expected, `[${role}] ${verb.toUpperCase()} ${p} -> ${res.status}`);
    });
  }
});

// ---------------------------------------------------------------------------
// Write flows per module (create -> mutate -> read -> cleanup where possible)
// ---------------------------------------------------------------------------
const TS = Date.now().toString().slice(-6);

describe("Write: Students + Staff", () => {
  it("admin creates, teacher corrects, admin deletes a student", async () => {
    const admNo = `TST${TS}`;
    const create = await post("admin", "/api/students").send({
      admNo,
      name: "QA Test Student",
      cls: ctx.cls,
      section: ctx.section,
      roll: 999,
      dob: "2012-01-01",
    });
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const id = create.body.student?.id || create.body.id; 
    assert.ok(id);

    const found = await get("admin", `/api/students/${id}`);
    assert.equal(found.status, 200);

    const correct = await put("teacher", `/api/students/${id}`).send({ name: "QA Test Student Corrected" });
    assert.equal(correct.status, 200, JSON.stringify(correct.body));

    const delRes = await del("admin", `/api/students/${id}`);
    assert.equal(delRes.status, 200);
  });

  it("admin creates and deletes a staff member", async () => {
    const staffId = `QA${TS}`;
    const create = await post("admin", "/api/staff").send({
      staffId,
      name: "QA Test Staff",
      jobTitle: "Tester",
      dept: "Administration",
      salary: 5000,
    });
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const id = create.body.staff?.id || create.body.id;
    assert.ok(id);
    const found = await get("admin", `/api/staff/${id}`);
    assert.equal(found.status, 200);
    const delRes = await del("admin", `/api/staff/${id}`);
    assert.equal(delRes.status, 200);
  });
});

describe("Write: Diary + Homework + Leave", () => {
  it("teacher posts a diary entry (DB-backed)", async () => {
    const res = await post("teacher", "/api/diary").send({
      cls: ctx.cls,
      section: ctx.section,
      subject: "Mathematics",
      note: `QA diary note ${TS}`,
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    const list = await get("teacher", `/api/diary?cls=${ctx.cls}&section=${ctx.section}`);
    const lenBefore = deepArray(list.body)?.length || 0;
    assert.ok(lenBefore > 0);
  });

  it("teacher assigns, parent submits, admin deletes homework", async () => {
    const create = await post("teacher", "/api/homework").send({
      cls: ctx.cls,
      section: ctx.section,
      subject: "Science",
      title: `QA HW ${TS}`,
      description: "solve",
      dueDate: "2026-12-31",
    });
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const id = create.body.homework?.id || create.body.id;
    assert.ok(id);

    const list = await get("teacher", "/api/homework");
    assert.equal(list.status, 200);

    const submit = await post("parent", `/api/homework/${id}/submit`).send({
      studentId: ctx.child,
      notes: "done",
    });
    assert.equal(submit.status, 201, JSON.stringify(submit.body));

    const subs = await get("teacher", `/api/homework/${id}/submissions`);
    assert.equal(subs.status, 200);

    const update = await put("teacher", `/api/homework/${id}`).send({ description: "updated" });
    assert.equal(update.status, 200);

    const delRes = await del("admin", `/api/homework/${id}`);
    assert.equal(delRes.status, 200);
  });

  it("teacher applies leave, admin approves", async () => {
    const create = await post("teacher", "/api/leave")
      .send({ startDate: "2026-10-01", endDate: "2026-10-02", applicantType: "STAFF", leaveType: "Casual", reason: `QA ${TS}` });
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const id = create.body.leave?.id || create.body.request?.id || create.body.id;
    assert.ok(id, "leave created without id");

    const list = await get("teacher", "/api/leave?applicantType=STAFF");
    assert.equal(list.status, 200);

    const balance = await get("teacher", `/api/leave/balance?staffId=${ctx.teacherStaff.id}`).send();
    assert.equal(balance.status, 200);

    const approve = await put("admin", `/api/leave/${id}/status`).send({ status: "APPROVED", comment: "ok" });
    assert.equal(approve.status, 200, JSON.stringify(approve.body));
  });
});

describe("Write: Fees", () => {
  it("component + structure + ledger + payment + receipt round trip", async () => {
    const comp = await post("admin", "/api/fees/components").send({ name: `QA Component ${TS}`, code: `QAC${TS}`, type: "Annual" });
    assert.equal(comp.status, 201, JSON.stringify(comp.body));

    const struct = await post("admin", "/api/fees/structures").send({ cls: ctx.cls, session: "2024-2025", amount: 999 });
    assert.equal(struct.status, 201, JSON.stringify(struct.body));

    const ledger = await post("admin", "/api/fees/ledger").send({
      studentId: ctx.student.id,
      session: "2024-2025",
      term: "QA-Term",
      amount: 500,
      dueDate: "2026-11-30",
    });
    assert.equal(ledger.status, 201, JSON.stringify(ledger.body));

    const pay = await post("admin", "/api/fees/pay").send({
      studentId: ctx.student.id,
      amount: 100,
      paymentMode: "CASH",
      ledgerId: ledger.body.entry?.id || ledger.body.ledgerEntry?.id || undefined,
    });
    assert.equal(pay.status, 201, JSON.stringify(pay.body));
    const paymentId = pay.body.payment?.id || pay.body.paid?.id || pay.body.id;
    if (paymentId) {
      const receipt = await get("admin", `/api/fees/receipt/${paymentId}`);
      assert.equal(receipt.status, 200);
    }

    const summary = await get("admin", "/api/fees/summary");
    assert.equal(summary.status, 200);
    const components = await get("admin", "/api/fees/components");
    assert.equal(components.status, 200);
  });
});

describe("Write: Transport", () => {
  it("transport manager: vehicle + route + assign + unassign", async () => {
    const vehicle = await post("transport", "/api/transport/vehicles").send({
      plateNumber: `QA-${TS}`,
      type: "Bus",
      capacity: 40,
      driverName: "QA Driver",
    });
    assert.equal(vehicle.status, 201, JSON.stringify(vehicle.body));
    const vehicleId = vehicle.body.vehicle?.id || vehicle.body.id;
    assert.ok(vehicleId);

    const route = await post("transport", "/api/transport/routes").send({
      name: `QA Route ${TS}`,
      stops: [{ name: "QA Stop 1", time: "07:30" }],
      vehicleId,
    });
    assert.equal(route.status, 201, JSON.stringify(route.body));
    const routeId = route.body.route?.id || route.body.id;
    assert.ok(routeId);

    const assign = await post("transport", "/api/transport/assign").send({
      studentId: ctx.student.id,
      routeId,
      stopName: "QA Stop 1",
      monthlyFee: 500,
    });
    assert.equal(assign.status, 201, JSON.stringify(assign.body));
    const assignmentId = assign.body.assignment?.id || assign.body.id;
    assert.ok(assignmentId);

    const detail = await get("transport", `/api/transport/routes/${routeId}`);
    assert.equal(detail.status, 200);

    await del("transport", `/api/transport/assign/${assignmentId}`);
    await del("admin", `/api/transport/routes/${routeId}`);
    await del("admin", `/api/transport/vehicles/${vehicleId}`);
  });
});

describe("Write: Library", () => {
  it("librarian: book + issue + return + admin deletes", async () => {
    const book = await post("librarian", "/api/library").send({
      title: `QA Book ${TS}`,
      author: "QA",
      category: "QA",
      totalCopies: 2,
    });
    assert.equal(book.status, 201, JSON.stringify(book.body));
    const bookId = book.body.book?.id || book.body.id;
    assert.ok(bookId);

    const issue = await post("librarian", "/api/library/issue").send({
      bookId,
      studentId: ctx.student.id,
      dueDate: "2026-12-31",
    });
    assert.equal(issue.status, 201, JSON.stringify(issue.body));
    const issueId = issue.body.issue?.id || issue.body.id;

    const issues = await get("librarian", "/api/library/issues");
    assert.equal(issues.status, 200);

    const ret = await post("librarian", `/api/library/${issueId || bookId}/return`).send({ fineAmount: 0 });
    assert.equal(ret.status, 200, JSON.stringify(ret.body));

    await del("admin", `/api/library/${bookId}`);
  });
});

describe("Write: Inventory", () => {
  it("admin: item + purchase + issue + delete", async () => {
    const item = await post("admin", "/api/inventory").send({
      name: `QA Item ${TS}`,
      category: "QA",
      currentStock: 5,
      reorderLevel: 2,
      unitPrice: 10,
    });
    assert.equal(item.status, 201, JSON.stringify(item.body));
    const itemId = item.body.item?.id || item.body.id;
    assert.ok(itemId);

    const pur = await post("admin", "/api/inventory/purchase").send({ itemId, quantity: 10, vendorName: "QA Vendor" });
    assert.equal(pur.status, 201, JSON.stringify(pur.body));

    const iss = await post("admin", "/api/inventory/issue").send({ itemId, quantity: 2, department: "QA" });
    assert.equal(iss.status, 201, JSON.stringify(iss.body));

    const got = await get("admin", `/api/inventory/${itemId}`);
    assert.equal(got.status, 200);

    await del("admin", `/api/inventory/${itemId}`);
  });
});

describe("Write: Front Office", () => {
  it("frontoffice: host mapping + visitor check-in/out + gate pass", async () => {
    const mapping = await post("frontoffice", "/api/frontoffice/host-mappings").send({
      visitType: "QA Visit",
      notifyStaffId: ctx.staff.id,
    });
    assert.equal(mapping.status, 201, JSON.stringify(mapping.body));
    const mappingId = mapping.body.mapping?.id || mapping.body.id;
    assert.ok(mappingId);

    const checkin = await post("frontoffice", "/api/frontoffice/visitors/check-in").send({
      name: `QA Visitor ${TS}`,
      phone: "9999999999",
      purpose: "QA Purpose",
      hostStaffName: "QA Host",
    });
    assert.equal(checkin.status, 201, JSON.stringify(checkin.body));
    const visitorId = checkin.body.visitor?.id || checkin.body.id;
    assert.ok(visitorId);

    const gp = await post("frontoffice", "/api/frontoffice/gate-passes").send({ visitorId, purpose: "exit" });
    assert.equal(gp.status, 201, JSON.stringify(gp.body));

    const checkout = await post("frontoffice", `/api/frontoffice/visitors/${visitorId}/check-out`);
    assert.equal(checkout.status, 200, JSON.stringify(checkout.body));

    const visitors = await get("frontoffice", "/api/frontoffice/visitors");
    assert.equal(visitors.status, 200);

    await del("frontoffice", `/api/frontoffice/host-mappings/${mappingId}`);
  });
});

describe("Write: Hostel", () => {
  it("admin creates building + room + assignment + maintenance", async () => {
    const building = await post("admin", "/api/hostel/buildings").send({ name: `QA Hostel ${TS}`, type: "Hostel", floors: 2 });
    assert.equal(building.status, 201, JSON.stringify(building.body));
    const buildingId = building.body.building?.id || building.body.id;
    assert.ok(buildingId);

    const room = await post("admin", "/api/hostel/rooms").send({ buildingId, floor: 1, roomNumber: `QA${TS}`, bedCount: 2, roomType: "Standard" });
    assert.equal(room.status, 201, JSON.stringify(room.body));
    const roomId = room.body.room?.id || room.body.id;
    assert.ok(roomId);

    const assign = await post("admin", "/api/hostel/assign").send({ roomId, bedNumber: 1, studentId: ctx.student.id, session: "2024-2025" });
    assert.equal(assign.status, 201, JSON.stringify(assign.body));
    const assignmentId = assign.body.assignment?.id || assign.body.id;
    assert.ok(assignmentId);

    const maint = await post("admin", "/api/hostel/maintenance").send({ roomId, description: `QA maint ${TS}`, priority: "LOW" });
    assert.equal(maint.status, 201, JSON.stringify(maint.body));
    const maintId = maint.body.request?.id || maint.body.maintenance?.id || maint.body.id;
    assert.ok(maintId);

    const upd = await put("admin", `/api/hostel/maintenance/${maintId}`).send({ status: "IN_PROGRESS" });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));

    await del("admin", `/api/hostel/assign/${assignmentId}`);
    await del("admin", `/api/hostel/buildings/${buildingId}`);
  });
});

describe("Write: Tasks + Communication + Gallery", () => {
  it("teacher creates + updates task, admin deletes", async () => {
    const created = await post("teacher", "/api/tasks").send({ title: `QA Task ${TS}`, priority: "HIGH", category: "GENERAL" });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.task?.id || created.body.id;
    assert.ok(id);
    const upd = await put("teacher", `/api/tasks/${id}`).send({ status: "COMPLETED" });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));
    const delRes = await del("admin", `/api/tasks/${id}`);
    assert.equal(delRes.status, 200);
  });

  it("teacher creates notice, admin edits + deletes", async () => {
    const created = await post("teacher", "/api/communication").send({ title: `QA Notice ${TS}`, body: "QA body", audience: "all" });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.notice?.id || created.body.id;
    assert.ok(id);
    const upd = await put("admin", `/api/communication/${id}`).send({ title: `QA Notice ${TS} v2` });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));
    const delRes = await del("admin", `/api/communication/${id}`);
    assert.equal(delRes.status, 200);
  });

  it("admin creates album + photo + deletes", async () => {
    const created = await post("admin", "/api/gallery").send({ title: `QA Album ${TS}`, visibility: "PUBLIC" });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const albumId = created.body.album?.id || created.body.id;
    assert.ok(albumId);

    const photo = await post("admin", `/api/gallery/${albumId}/photos`).send({ url: "https://example.com/q.jpg", caption: "QA" });
    assert.equal(photo.status, 201, JSON.stringify(photo.body));
    const photoId = photo.body.photo?.id || photo.body.id;

    const detail = await get("admin", `/api/gallery/${albumId}`);
    assert.equal(detail.status, 200);

    if (photoId) await del("admin", `/api/gallery/photos/${photoId}`);
    const delRes = await del("admin", `/api/gallery/${albumId}`);
    assert.equal(delRes.status, 200);
  });
});

describe("Write: Copy Checking + Syllabus", () => {
  it("teacher creates batch + entries + entry update", async () => {
    const created = await post("teacher", "/api/copychecking").send({
      subject: "Mathematics",
      cls: ctx.cls,
      section: ctx.section,
      term: "QA Term",
      totalCopies: 10,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const batchId = created.body.batch?.id || created.body.id;
    assert.ok(batchId);

    const entry = await post("teacher", `/api/copychecking/${batchId}/entries`).send({ studentId: ctx.student.id, maxMarks: 100 });
    assert.equal(entry.status, 201, JSON.stringify(entry.body));
    const entryId = entry.body.entry?.id || entry.body.id;
    assert.ok(entryId);

    const upd = await put("teacher", `/api/copychecking/entries/${entryId}`).send({ marks: 87 });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));

    const detail = await get("teacher", `/api/copychecking/${batchId}`);
    assert.equal(detail.status, 200);

    const delRes = await del("admin", `/api/copychecking/${batchId}`);
    assert.equal(delRes.status, 200);
  });

  it("syllabus topic + progress round trip (no delete route)", async () => {
    const created = await post("teacher", "/api/syllabus").send({
      subject: "Science",
      cls: ctx.cls,
      section: ctx.section,
      topicName: `QA Topic ${TS}`,
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.topic?.id || created.body.id;
    assert.ok(id);

    const upd = await put("teacher", `/api/syllabus/${id}`).send({ status: "IN_PROGRESS" });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));

    const prog = await post("teacher", `/api/syllabus/${id}/progress`).send({ notes: "started" });
    assert.equal(prog.status, 200, JSON.stringify(prog.body));

    const dash = await get("teacher", "/api/syllabus/dashboard");
    assert.equal(dash.status, 200);
  });
});

describe("Write: Attendance + Examination", () => {
  it("teacher marks attendance on a QA day, admin clears it", async () => {
    const date = "2026-09-07";
    const mark = await post("teacher", "/api/attendance/mark").send({
      cls: ctx.cls,
      section: ctx.section,
      date,
      attendance: ctx.roster,
    });
    assert.equal(mark.status, 200, JSON.stringify(mark.body));

    const roster = await get("teacher", `/api/attendance?cls=${ctx.cls}&section=${ctx.section}&date=${date}`);
    assert.equal(roster.status, 200);

    const clear = await del("admin", `/api/attendance/clear?cls=${ctx.cls}&section=${ctx.section}&date=${date}`);
    assert.equal(clear.status, 200, JSON.stringify(clear.body));
  });

  it("teacher saves exam marks for a QA term", async () => {
    const res = await post("teacher", "/api/examination/marks").send({
      session: "2024-2025",
      term: `QA Term ${TS}`,
      cls: ctx.cls,
      section: ctx.section,
      subject: "Mathematics",
      marks: [{ studentId: ctx.student.id, marksObtained: 88, maxMarks: 100 }],
    });
    assert.equal(res.status, 200, JSON.stringify(res.body));

    const roster = await get("teacher", `/api/examination?cls=${ctx.cls}&section=${ctx.section}&session=2024-2025`);
    assert.equal(roster.status, 200);

    const rc = await get("admin", `/api/examination/report-card?studentId=${ctx.student.id}&session=2024-2025`);
    assert.equal(rc.status, 200);
  });
});

describe("Write: Admissions + Certificates", () => {
  it("admissions officer creates + updates + enrolls + deletes inquiry", async () => {
    const created = await post("admissions", "/api/admissions").send({
      name: `QA Inquiry ${TS}`,
      classApplied: ctx.cls,
      parentName: "QA Parent",
      phone: "9898989898",
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const id = created.body.inquiry?.id || created.body.id;
    assert.ok(id);

    const upd = await put("admissions", `/api/admissions/${id}`).send({ stage: "interaction" });
    assert.equal(upd.status, 200, JSON.stringify(upd.body));

    const enroll = await post("admissions", `/api/admissions/${id}/enroll`).send({ section: "A", roll: 999 });
    assert.equal(enroll.status, 201, JSON.stringify(enroll.body));

    const delRes = await del("admissions", `/api/admissions/${id}`);
    assert.equal(delRes.status, 200);
  });

  it("admin issues a certificate; parent can request one", async () => {
    const issued = await post("admin", "/api/certificates/issue").send({
      studentId: ctx.student.id,
      studentName: ctx.student.name,
      cls: ctx.student.cls,
      section: ctx.student.section,
      type: CERT_TYPES[0],
      reason: "QA test",
    });
    assert.equal(issued.status, 201, JSON.stringify(issued.body));

    const list = await get("admin", "/api/certificates");
    assert.equal(list.status, 200);

    const req = await post("parent", "/api/certificates/request").send({
      studentId: ctx.child,
      studentName: "QA Child",
      cls: ctx.cls,
      section: ctx.section,
      type: CERT_TYPES[0],
    });
    assert.equal(req.status, 201, JSON.stringify(req.body));
  });
});

describe("Write: Payroll + Finance + Settings", () => {
  it("admin processes payroll for a staff member", async () => {
    const res = await post("admin", "/api/payroll/process").send({
      month: `QA Payroll ${TS}`,
      staffMembers: [{ id: ctx.staff.id, name: ctx.staff.name, jobTitle: ctx.staff.jobTitle || "Staff", basicSalary: 10000 }],
      markPaid: false,
    });
    assert.equal(res.status, 200, JSON.stringify(res.body) || `status ${res.status}`);
    const list = await get("accountant", `/api/payroll?month=QA Payroll ${TS}`);
    assert.equal(list.status, 200);
  });

  it("admin creates a finance record + reads it back", async () => {
    const created = await post("admin", "/api/finance").send({
      title: `QA Expense ${TS}`,
      type: "EXPENSE",
      category: "QA Category",
      amount: 25,
      notes: "qa",
    });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    const list = await get("accountant", "/api/finance?category=QA Category");
    assert.equal(list.status, 200);
  });

  it("settings read/write + events + subjects", async () => {
    const settings = await get("admin", "/api/settings");
    assert.equal(settings.status, 200);

    const update = await put("admin", "/api/settings").send({ academicSession: "2024-2025" });
    assert.equal(update.status, 200, JSON.stringify(update.body));

    const event = await post("admin", "/api/settings/events").send({ title: `QA Event ${TS}`, date: "2026-12-31", type: "Event" });
    assert.equal(event.status, 201, JSON.stringify(event.body));
    const eventId = event.body.event?.id || event.body.id;
    if (eventId) await del("admin", `/api/settings/events/${eventId}`);

    const subject = await post("admin", "/api/settings/subjects").send({ name: `QA Subject ${TS}` });
    assert.equal(subject.status, 201, JSON.stringify(subject.body));
    const subjectId = subject.body.subject?.id || subject.body.id;
    if (subjectId) await del("admin", `/api/settings/subjects/${subjectId}`);

    const subjects = await get("admin", "/api/settings/subjects");
    assert.equal(subjects.status, 200);
  });
});