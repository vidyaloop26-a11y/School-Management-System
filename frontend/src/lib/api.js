// API Client for Vidyaloop Backend (Express + Prisma + MongoDB)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("vidyaloop_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();

    if (res.status === 401 && endpoint !== "/auth/login") {
      // 401 Unauthorized: Clear invalid token & prompt re-login
      console.warn("Session unauthorized (401). Clearing token...");
      localStorage.removeItem("vidyaloop_user");
      localStorage.removeItem("vidyaloop_token");
      localStorage.removeItem("vidyaloop_login_time");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error(data.message || "Unauthorized (401). Please log in again.");
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    console.warn(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getMe: () => request("/auth/me"),
  logout: (refreshToken) =>
    request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),

  // Students
  getStudents: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.cls && params.cls !== "all") query.append("cls", params.cls);
    if (params.section && params.section !== "all") query.append("section", params.section);
    if (params.session && params.session !== "all") query.append("session", params.session);
    if (params.status && params.status !== "all") query.append("status", params.status);
    const qStr = query.toString();
    return request(`/students${qStr ? `?${qStr}` : ""}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
  createStudent: (studentData) =>
    request("/students", { method: "POST", body: JSON.stringify(studentData) }),
  bulkCreateStudents: (students) =>
    request("/students/bulk", { method: "POST", body: JSON.stringify({ students }) }),
  updateStudent: (id, studentData) =>
    request(`/students/${id}`, { method: "PUT", body: JSON.stringify(studentData) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: "DELETE" }),

  // Staff
  getStaff: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.dept && params.dept !== "all") query.append("dept", params.dept);
    if (params.status && params.status !== "all") query.append("status", params.status);
    const qStr = query.toString();
    return request(`/staff${qStr ? `?${qStr}` : ""}`);
  },
  getStaffById: (id) => request(`/staff/${id}`),
  createStaff: (staffData) =>
    request("/staff", { method: "POST", body: JSON.stringify(staffData) }),
  bulkCreateStaff: (staffMembers) =>
    request("/staff/bulk", { method: "POST", body: JSON.stringify({ staffMembers }) }),
  updateStaff: (id, staffData) =>
    request(`/staff/${id}`, { method: "PUT", body: JSON.stringify(staffData) }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: "DELETE" }),

  // Timetable
  getTimetable: (cls = "8", section = "A") =>
    request(`/timetable?cls=${cls}&section=${section}`),
  getTeacherTimetable: (staffId) =>
    request(`/timetable/teacher?staffId=${staffId}`),
  upsertTimetable: (timetableData) =>
    request("/timetable/upsert", { method: "POST", body: JSON.stringify(timetableData) }),

  // Attendance
  getAttendanceRoster: (cls = "8", section = "A", date) => {
    const dStr = date ? `&date=${date}` : "";
    return request(`/attendance?cls=${cls}&section=${section}${dStr}`);
  },
  markAttendance: (attendanceData) =>
    request("/attendance/mark", { method: "POST", body: JSON.stringify(attendanceData) }),
  getStudentAttendance: (studentId, month, year) => {
    const query = new URLSearchParams({ studentId });
    if (month) query.append("month", month);
    if (year) query.append("year", year);
    return request(`/attendance/student?${query.toString()}`);
  },

  // Examinations
  getExaminationRoster: (params = {}) => {
    const query = new URLSearchParams();
    if (params.cls) query.append("cls", params.cls);
    if (params.section) query.append("section", params.section);
    if (params.session) query.append("session", params.session);
    if (params.term) query.append("term", params.term);
    if (params.subject) query.append("subject", params.subject);
    const qStr = query.toString();
    return request(`/examination${qStr ? `?${qStr}` : ""}`);
  },
  saveExamMarks: (examData) =>
    request("/examination/marks", { method: "POST", body: JSON.stringify(examData) }),
  getStudentReportCard: (params = {}) => {
    const query = new URLSearchParams();
    if (params.studentId) query.append("studentId", params.studentId);
    if (params.session) query.append("session", params.session);
    if (params.term) query.append("term", params.term);
    const qStr = query.toString();
    return request(`/examination/report-card${qStr ? `?${qStr}` : ""}`);
  },

  // Schools (Super Admin)
  getSchools: () => request("/schools"),
  getSchoolById: (id) => request(`/schools/${id}`),
  createSchool: (schoolData) =>
    request("/schools", { method: "POST", body: JSON.stringify(schoolData) }),
  updateSchool: (id, schoolData) =>
    request(`/schools/${id}`, { method: "PUT", body: JSON.stringify(schoolData) }),
  deleteSchool: (id) => request(`/schools/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboardStats: () => request("/dashboard"),
};

export default api;
