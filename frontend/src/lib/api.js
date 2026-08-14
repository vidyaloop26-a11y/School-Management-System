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
  const res = await api.post("/timetable/upsert", timetableData);
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

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
    localStorage.setItem("vidyaloop_token", token);
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;