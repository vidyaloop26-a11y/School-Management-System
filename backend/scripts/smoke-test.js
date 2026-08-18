// End-to-end smoke test against the running API (requires seeded DB + server on :5000).
// Run: node scripts/smoke-test.js
const BASE = process.env.API_URL || "http://localhost:5000/api";

let passed = 0;
let failed = 0;
const results = [];

function check(name, cond, extra) {
  if (cond) {
    passed += 1;
    results.push(`PASS  ${name}`);
  } else {
    failed += 1;
    results.push(`FAIL  ${name} ${extra ? "-> " + JSON.stringify(extra) : ""}`);
  }
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const login = (identifier, password) =>
  api("POST", "/auth/login", { body: { identifier, password } });

async function main() {
  // 1. Super admin login
  const sa = await login("superadmin@vidyaloop.in", "Super@1234");
  check("superadmin login", sa.status === 200 && sa.json.user.role === "superAdmin", sa.json.message);

  // 2. Super admin creates a second school (unique code per run)
  const stamp = Date.now().toString().slice(-6);
  const school = await api("POST", "/schools", {
    token: sa.json.accessToken,
    body: {
      name: `Springdale High ${stamp}`,
      code: `SPR${stamp}`,
      adminName: "Priya Nair",
      adminEmail: `admin2.${stamp}@vidyaloop.in`,
      adminPassword: "Admin@5678",
    },
  });
  check("superadmin creates school + school admin creds", school.status === 201 && school.json.credentials, school.json);
  const admin2 = await login(`admin2.${stamp}@vidyaloop.in`, "Admin@5678");
  check("new school admin can login", admin2.status === 200);

  // 3. School admin (Vidyaloop) logins
  const adm = await login("admin@vidyaloop.in", "Admin@1234");
  check("school admin login", adm.status === 200 && adm.json.user.role === "schoolAdmin");

  // 4. List students & get one
  const list = await api("GET", "/students?cls=8", { token: adm.json.accessToken });
  check("school admin lists students", list.status === 200 && list.json.students.length >= 4);
  const firstStudent = list.json.students[0];
  const one = await api("GET", `/students/${firstStudent ? firstStudent.id : ""}`, { token: adm.json.accessToken });
  check("get single student", one.status === 200 && one.json.student.cls && one.json.student.section);

  // 5. Create a student -> parent creds generated
  const newStu = await api("POST", "/students", {
    token: adm.json.accessToken,
    body: {
      admNo: `VL2024${stamp}`,
      name: "Test Child",
      cls: "8",
      section: "A",
      roll: 30,
      parentName: "Test Parent",
      parentEmail: `test.parent.${stamp}@email.com`,
    },
  });
  check("school admin adds student + parent creds", newStu.status === 201 && newStu.json.parentAccount && newStu.json.parentAccount.username, newStu.json.message);

  // 6. Teacher login & RBAC
  const teacher = await login("vls-101", "VLS-101@1234");
  check("teacher login", teacher.status === 200 && teacher.json.user.role === "teacher");

  const deniedCreate = await api("POST", "/students", {
    token: teacher.json.accessToken,
    body: { admNo: "X1", cls: "8", section: "A", roll: 1, name: "Nope" },
  });
  check("teacher CANNOT create students (403)", deniedCreate.status === 403, deniedCreate.json.message);

  const editName = await api("PUT", `/students/${firstStudent.id}`, {
    token: teacher.json.accessToken,
    body: { name: "Aarav Sharma (corrected)" },
  });
  check("teacher CAN correct student name", editName.status === 200 && editName.json.student.name.includes("corrected"), editName.json.message);

  const editRoll = await api("PUT", `/students/${firstStudent.id}`, {
    token: teacher.json.accessToken,
    body: { roll: 99 },
  });
  check("teacher CANNOT change structural fields (422)", editRoll.status === 422, editRoll.json.message);

  // 7. Teacher mark attendance + view
  const mark = await api("POST", "/attendance/mark", {
    token: teacher.json.accessToken,
    body: { cls: "8", section: "A", date: "2026-08-08", attendance: [{ studentId: firstStudent.id, status: "P" }] },
  });
  check("teacher marks attendance", mark.status === 200 && mark.json.summary.present === 1, mark.json);
  const roster = await api("GET", "/attendance?cls=8&section=A&date=2026-08-08", { token: teacher.json.accessToken });
  check("attendance roster shows marked status", roster.status === 200 && roster.json.roster.some((r) => r.studentId === firstStudent.id && r.status === "P"), roster.json.message);

  // 8. Timetable
  const tt = await api("GET", "/timetable?cls=8&section=A", { token: adm.json.accessToken });
  check("class timetable grid", tt.status === 200 && tt.json.grid && tt.json.grid.P1, tt.json.message);
  const ttStaff = await api("GET", "/timetable/teacher?staffId=", { token: adm.json.accessToken });
  check("teacher timetable query exists", ttStaff.status === 422 || ttStaff.status === 200);

  // 9. Parent view own child
  const seededParent = await login("vl2024001-parent", "VL2024001@1234");
  check("parent login", seededParent.status === 200 && seededParent.json.user.role === "parent", seededParent.json.message);
  const kids = await api("GET", "/students", { token: seededParent.json.accessToken });
  check("parent lists (contains own child)", kids.status === 200 && kids.json.students.length === 1 && kids.json.students[0].admNo === "VL2024001", kids.json.message);

  const parentDash = await api("GET", "/dashboard", { token: seededParent.json.accessToken });
  check("parent dashboard shows child", parentDash.status === 200 && parentDash.json.child, parentDash.json.message);

  // clean up: revert teacher's name edit
  await api("PUT", `/students/${firstStudent.id}`, {
    token: teacher.json.accessToken,
    body: { name: firstStudent.name },
  });

  console.log(results.join("\n"));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});