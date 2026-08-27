import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Bearer token to every API call
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("vidyaloop_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to auto-refresh access token
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/me") || originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("vidyaloop_token", accessToken);
        if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
        apiInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("vidyaloop_token");
        localStorage.removeItem("user");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getActiveSchoolId() {
  const raw = localStorage.getItem("vidyaloop_active_school_id") || localStorage.getItem("vidyaloop_active_school") || "";
  const cleaned = String(raw).replace(/^"|"$/g, "").trim();
  return cleaned === "all" ? "" : cleaned;
}

const api = apiInstance;

// Helper API methods attached to Axios instance
api.getStudents = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.cls && params.cls !== "all") query.append("cls", params.cls);
  if (params.section && params.section !== "all") query.append("section", params.section);
  if (params.session && params.session !== "all") query.append("session", params.session);
  if (params.status && params.status !== "all") query.append("status", params.status);

  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);

  const qStr = query.toString();
  const res = await api.get(`/students${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.getStudentById = async (id) => {
  const res = await api.get(`/students/${id}`);
  return res.data;
};

api.createStudent = async (studentData) => {
  const res = await api.post("/students", studentData);
  return res.data;
};

api.bulkCreateStudents = async (students) => {
  const res = await api.post("/students/bulk", { students });
  return res.data;
};

api.updateStudent = async (id, studentData) => {
  const res = await api.put(`/students/${id}`, studentData);
  return res.data;
};

api.deleteStudent = async (id) => {
  const res = await api.delete(`/students/${id}`);
  return res.data;
};

// Staff
api.getStaff = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.dept && params.dept !== "all") query.append("dept", params.dept);
  if (params.status && params.status !== "all") query.append("status", params.status);

  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);

  const qStr = query.toString();
  const res = await api.get(`/staff${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.getStaffById = async (id) => {
  const res = await api.get(`/staff/${id}`);
  return res.data;
};

api.createStaff = async (staffData) => {
  const res = await api.post("/staff", staffData);
  return res.data;
};

api.bulkCreateStaff = async (staff) => {
  const res = await api.post("/staff/bulk", { staff });
  return res.data;
};

api.updateStaff = async (id, staffData) => {
  const res = await api.put(`/staff/${id}`, staffData);
  return res.data;
};

api.resetTeacherPassword = async (id, newPassword) => {
  const res = await api.post(`/staff/${id}/reset-password`, { newPassword });
  return res.data;
};

// Timetable
api.getTimetable = async (cls = "8", section = "A", schoolIdParam) => {
  const schoolId = schoolIdParam || getActiveSchoolId();
  const qStr = schoolId ? `&schoolId=${schoolId}` : "";
  const res = await api.get(`/timetable?cls=${cls}&section=${section}${qStr}`);
  return res.data;
};

api.getTeacherTimetable = async (staffId) => {
  const qStr = staffId ? `?staffId=${staffId}` : "";
  const res = await api.get(`/timetable/teacher${qStr}`);
  return res.data;
};

api.upsertTimetable = async (timetableData) => {
  const payload = {
    cls: timetableData.cls,
    section: timetableData.section,
    entries: [
      {
        day: timetableData.day,
        period: timetableData.period,
        subject: timetableData.subject,
        ...(timetableData.room ? { room: timetableData.room } : {}),
        ...(timetableData.staffId ? { staffId: timetableData.staffId } : {}),
      },
    ],
  };
  const res = await api.post("/timetable/upsert", payload);
  return res.data;
};

// Attendance
api.getAttendanceRoster = async (cls = "8", section = "A", date, schoolIdParam) => {
  const query = new URLSearchParams({ cls, section });
  if (date) query.append("date", date);
  const schoolId = schoolIdParam || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  const res = await api.get(`/attendance?${query.toString()}`);
  return res.data;
};

api.markAttendance = async (attendanceData) => {
  const res = await api.post("/attendance/mark", attendanceData);
  return res.data;
};

api.getStudentAttendance = async (studentId, month, year) => {
  const query = new URLSearchParams({ studentId });
  if (month) query.append("month", month);
  if (year) query.append("year", year);
  const res = await api.get(`/attendance/student?${query.toString()}`);
  return res.data;
};

// Examinations
api.getExaminationRoster = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.cls) query.append("cls", params.cls);
  if (params.section) query.append("section", params.section);
  if (params.session) query.append("session", params.session);
  if (params.term) query.append("term", params.term);
  if (params.subject) query.append("subject", params.subject);
  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  const qStr = query.toString();
  const res = await api.get(`/examination${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.saveExamMarks = async (examData) => {
  const res = await api.post("/examination/marks", examData);
  return res.data;
};

api.getStudentReportCard = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.studentId) query.append("studentId", params.studentId);
  if (params.session) query.append("session", params.session);
  if (params.term) query.append("term", params.term);
  const qStr = query.toString();
  const res = await api.get(`/examination/report-card${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

// Schools
api.getSchools = async () => {
  const res = await api.get("/schools");
  return res.data;
};

api.getSchoolById = async (id) => {
  const res = await api.get(`/schools/${id}`);
  return res.data;
};

api.createSchool = async (schoolData) => {
  const res = await api.post("/schools", schoolData);
  return res.data;
};

api.updateSchool = async (id, schoolData) => {
  const res = await api.put(`/schools/${id}`, schoolData);
  return res.data;
};

api.deleteSchool = async (id) => {
  const res = await api.delete(`/schools/${id}`);
  return res.data;
};

// Payroll
api.getPayroll = async (params = {}) => {
  const query = new URLSearchParams();
  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  if (params.month) query.append("month", params.month);
  if (params.status) query.append("status", params.status);
  const qStr = query.toString();
  const res = await api.get(`/payroll${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.processPayroll = async (payrollData) => {
  const res = await api.post("/payroll/process", payrollData);
  return res.data;
};

// Finance / Income-Expense
api.getFinanceRecords = async (params = {}) => {
  const query = new URLSearchParams();
  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  if (params.type) query.append("type", params.type);
  if (params.category) query.append("category", params.category);
  const qStr = query.toString();
  const res = await api.get(`/finance${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.createFinanceRecord = async (recordData) => {
  const res = await api.post("/finance", recordData);
  return res.data;
};

api.getFinanceSummary = async () => {
  try {
    const res = await api.get("/finance/summary");
    return res.data;
  } catch {
    return { chart: [], totalCollected: 0 };
  }
};

// Certificates
api.getCertificates = async (params = {}) => {
  const query = new URLSearchParams();
  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  if (params.type) query.append("type", params.type);
  if (params.status) query.append("status", params.status);
  const qStr = query.toString();
  const res = await api.get(`/certificates${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.issueCertificate = async (certData) => {
  const res = await api.post("/certificates/issue", certData);
  return res.data;
};

api.requestCertificate = async (certData) => {
  const res = await api.post("/certificates/request", certData);
  return res.data;
};

// Notices
api.deleteNotice = async (id) => {
  const res = await api.delete(`/communication/${id}`);
  return res.data;
};

// Settings
api.getSettings = async () => {
  const res = await api.get("/settings");
  return res.data;
};

api.updateSettings = async (data) => {
  const res = await api.put("/settings", data);
  return res.data;
};

// Events
api.getEvents = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.type) query.append("type", params.type);
  const qStr = query.toString();
  const res = await api.get(`/settings/events${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.createEvent = async (data) => {
  const res = await api.post("/settings/events", data);
  return res.data;
};

api.deleteEvent = async (id) => {
  const res = await api.delete(`/settings/events/${id}`);
  return res.data;
};

// Subjects
api.getSubjects = async () => {
  const res = await api.get("/settings/subjects");
  return res.data;
};

api.createSubject = async (data) => {
  const res = await api.post("/settings/subjects", data);
  return res.data;
};

api.deleteSubject = async (id) => {
  const res = await api.delete(`/settings/subjects/${id}`);
  return res.data;
};

api.reorderSubjects = async (subjectIds) => {
  const res = await api.put("/settings/subjects/reorder", { subjectIds });
  return res.data;
};

// Holiday sync
api.syncHolidays = async (year, country) => {
  const res = await api.post("/settings/sync-holidays", { year, country });
  return res.data;
};

// Tasks
api.getTasks = async (params = {}) => {
  const query = new URLSearchParams();
  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  if (params.status && params.status !== "all") query.append("status", params.status);
  if (params.priority && params.priority !== "all") query.append("priority", params.priority);
  if (params.category && params.category !== "all") query.append("category", params.category);
  if (params.search) query.append("search", params.search);
  const qStr = query.toString();
  const res = await api.get(`/tasks${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.createTask = async (taskData) => {
  const res = await api.post("/tasks", taskData);
  return res.data;
};

api.updateTask = async (id, taskData) => {
  const res = await api.put(`/tasks/${id}`, taskData);
  return res.data;
};

api.deleteTask = async (id) => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
};

// Leave Applications
api.getLeaveRequests = async (params = {}) => {
  const query = new URLSearchParams();
  const schoolId = params.schoolId || getActiveSchoolId();
  if (schoolId) query.append("schoolId", schoolId);
  if (params.applicantType) query.append("applicantType", params.applicantType);
  if (params.status) query.append("status", params.status);
  const qStr = query.toString();
  const res = await api.get(`/leave${qStr ? `?${qStr}` : ""}`);
  return res.data;
};

api.applyLeave = async (leaveData) => {
  try {
    const res = await api.post("/leave", leaveData);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const resFallback = await api.post("/leave/apply", leaveData);
      return resFallback.data;
    }
    throw err;
  }
};

api.updateLeaveStatus = async (id, statusData) => {
  try {
    const res = await api.put(`/leave/${id}/status`, statusData);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const resFallback = await api.patch(`/leave/${id}/status`, statusData);
      return resFallback.data;
    }
    throw err;
  }
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
    localStorage.setItem("vidyaloop_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Syllabus
api.getSyllabusTopics = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.cls) query.append("cls", params.cls);
  if (params.section) query.append("section", params.section);
  if (params.subject) query.append("subject", params.subject);
  const qStr = query.toString();
  const res = await api.get(`/syllabus${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.createSyllabusTopic = async (data) => { const res = await api.post("/syllabus", data); return res.data; };
api.updateSyllabusTopic = async (id, data) => { const res = await api.put(`/syllabus/${id}`, data); return res.data; };
api.markSyllabusProgress = async (id, data) => { const res = await api.post(`/syllabus/${id}/progress`, data); return res.data; };
api.getSyllabusDashboard = async () => { const res = await api.get("/syllabus/dashboard"); return res.data; };

// Gallery
api.getAlbums = async () => { const res = await api.get("/gallery"); return res.data; };
api.getAlbumById = async (id) => { const res = await api.get(`/gallery/${id}`); return res.data; };
api.createAlbum = async (data) => { const res = await api.post("/gallery", data); return res.data; };
api.addPhoto = async (albumId, data) => { const res = await api.post(`/gallery/${albumId}/photos`, data); return res.data; };
api.deleteAlbum = async (id) => { const res = await api.delete(`/gallery/${id}`); return res.data; };
api.deletePhoto = async (id) => { const res = await api.delete(`/gallery/photos/${id}`); return res.data; };

// Library
api.getBooks = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.status) query.append("status", params.status);
  const qStr = query.toString();
  const res = await api.get(`/library${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.createBook = async (data) => { const res = await api.post("/library", data); return res.data; };
api.issueBook = async (data) => { const res = await api.post("/library/issue", data); return res.data; };
api.returnBook = async (id, data) => { const res = await api.post(`/library/${id}/return`, data); return res.data; };
api.getLibraryIssues = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  const qStr = query.toString();
  const res = await api.get(`/library/issues${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.deleteBook = async (id) => { const res = await api.delete(`/library/${id}`); return res.data; };

// Transport
api.getTransportRoutes = async () => { const res = await api.get("/transport/routes"); return res.data; };
api.createTransportRoute = async (data) => { const res = await api.post("/transport/routes", data); return res.data; };
api.updateTransportRoute = async (id, data) => { const res = await api.put(`/transport/routes/${id}`, data); return res.data; };
api.deleteTransportRoute = async (id) => { const res = await api.delete(`/transport/routes/${id}`); return res.data; };
api.getVehicles = async () => { const res = await api.get("/transport/vehicles"); return res.data; };
api.createVehicle = async (data) => { const res = await api.post("/transport/vehicles", data); return res.data; };
api.updateVehicle = async (id, data) => { const res = await api.put(`/transport/vehicles/${id}`, data); return res.data; };
api.deleteVehicle = async (id) => { const res = await api.delete(`/transport/vehicles/${id}`); return res.data; };
api.assignStudentTransport = async (data) => { const res = await api.post("/transport/assign", data); return res.data; };
api.removeStudentTransport = async (id) => { const res = await api.delete(`/transport/assign/${id}`); return res.data; };

// Front Office
api.getVisitors = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.date) query.append("date", params.date);
  const qStr = query.toString();
  const res = await api.get(`/frontoffice/visitors${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.checkInVisitor = async (data) => { const res = await api.post("/frontoffice/visitors/check-in", data); return res.data; };
api.checkOutVisitor = async (id) => { const res = await api.post(`/frontoffice/visitors/${id}/check-out`); return res.data; };
api.getGatePasses = async () => { const res = await api.get("/frontoffice/gate-passes"); return res.data; };
api.createGatePass = async (data) => { const res = await api.post("/frontoffice/gate-passes", data); return res.data; };
api.getHostMappings = async () => { const res = await api.get("/frontoffice/host-mappings"); return res.data; };
api.createHostMapping = async (data) => { const res = await api.post("/frontoffice/host-mappings", data); return res.data; };
api.deleteHostMapping = async (id) => { const res = await api.delete(`/frontoffice/host-mappings/${id}`); return res.data; };

// Inventory
api.getInventoryItems = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.append("category", params.category);
  if (params.search) query.append("search", params.search);
  if (params.lowStock) query.append("lowStock", params.lowStock);
  const qStr = query.toString();
  const res = await api.get(`/inventory${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.createInventoryItem = async (data) => { const res = await api.post("/inventory", data); return res.data; };
api.updateInventoryItem = async (id, data) => { const res = await api.put(`/inventory/${id}`, data); return res.data; };
api.deleteInventoryItem = async (id) => { const res = await api.delete(`/inventory/${id}`); return res.data; };
api.recordPurchase = async (data) => { const res = await api.post("/inventory/purchase", data); return res.data; };
api.recordIssue = async (data) => { const res = await api.post("/inventory/issue", data); return res.data; };
api.getLowStockItems = async () => { const res = await api.get("/inventory/low-stock"); return res.data; };

// Hostel
api.getBuildings = async () => { const res = await api.get("/hostel/buildings"); return res.data; };
api.createBuilding = async (data) => { const res = await api.post("/hostel/buildings", data); return res.data; };
api.updateBuilding = async (id, data) => { const res = await api.put(`/hostel/buildings/${id}`, data); return res.data; };
api.deleteBuilding = async (id) => { const res = await api.delete(`/hostel/buildings/${id}`); return res.data; };
api.getHostelRooms = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.buildingId) query.append("buildingId", params.buildingId);
  const qStr = query.toString();
  const res = await api.get(`/hostel/rooms${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.createHostelRoom = async (data) => { const res = await api.post("/hostel/rooms", data); return res.data; };
api.assignBed = async (data) => { const res = await api.post("/hostel/assign", data); return res.data; };
api.unassignBed = async (id) => { const res = await api.delete(`/hostel/assign/${id}`); return res.data; };
api.getMaintenanceRequests = async () => { const res = await api.get("/hostel/maintenance"); return res.data; };
api.createMaintenanceRequest = async (data) => { const res = await api.post("/hostel/maintenance", data); return res.data; };
api.updateMaintenanceRequest = async (id, data) => { const res = await api.put(`/hostel/maintenance/${id}`, data); return res.data; };

// Copy Checking
api.getCopyCheckBatches = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.cls) query.append("cls", params.cls);
  if (params.subject) query.append("subject", params.subject);
  const qStr = query.toString();
  const res = await api.get(`/copychecking${qStr ? `?${qStr}` : ""}`);
  return res.data;
};
api.createCopyCheckBatch = async (data) => { const res = await api.post("/copychecking", data); return res.data; };
api.addCopyCheckEntry = async (batchId, data) => { const res = await api.post(`/copychecking/${batchId}/entries`, data); return res.data; };
api.updateCopyCheckEntry = async (id, data) => { const res = await api.put(`/copychecking/entries/${id}`, data); return res.data; };
api.deleteCopyCheckBatch = async (id) => { const res = await api.delete(`/copychecking/${id}`); return res.data; };

export default api;