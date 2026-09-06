import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

const QUERY_KEYS = {
  auth: {
    me: ["auth", "me"],
  },
  dashboard: ["dashboard"],
  schools: ["schools"],
  students: {
    list: (params) => ["students", "list", params],
    detail: (id) => ["students", "detail", id],
  },
  staff: {
    list: (params) => ["staff", "list", params],
    detail: (id) => ["staff", "detail", id],
  },
  timetable: {
    class: (cls, section) => ["timetable", "class", cls, section],
    teacher: (staffId) => ["timetable", "teacher", staffId],
  },
  attendance: {
    class: (cls, section, date) => ["attendance", "class", cls, section, date],
    student: (studentId, month, year) => ["attendance", "student", studentId, month, year],
  },
  admissions: {
    list: ["admissions"],
    detail: (id) => ["admissions", id],
  },
  communication: {
    list: ["communication", "notices"],
  },
  events: {
    list: ["events"],
  },
};

export const useAuth = () => {
  return useQuery({
    queryKey: QUERY_KEYS.auth.me,
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data.user;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!(localStorage.getItem("accessToken") || localStorage.getItem("vidyaloop_token")),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ identifier, password }) => {
      const response = await api.post("/auth/login", { identifier, password });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("vidyaloop_token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
      queryClient.setQueryData(QUERY_KEYS.auth.me, data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    },
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("vidyaloop_token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;
      queryClient.clear();
    },
  });
};

export const useDashboard = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data;
    },
  });
};

export const useSchools = () => {
  return useQuery({
    queryKey: QUERY_KEYS.schools,
    queryFn: async () => {
      const response = await api.get("/schools");
      return response.data.schools;
    },
  });
};

export const useCreateSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/schools", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schools });
    },
  });
};

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/schools/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schools });
    },
  });
};

export const useDeleteSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/schools/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schools });
    },
  });
};

export const useStudents = (params = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.students.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value);
        }
      });
      const response = await api.get(`/students?${searchParams.toString()}`);
      return response.data.students;
    },
  });
};

export const useStudent = (id) => {
  return useQuery({
    queryKey: QUERY_KEYS.students.detail(id),
    queryFn: async () => {
      const response = await api.get(`/students/${id}`);
      return response.data.student;
    },
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/students", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/students/${id}`, data);
      return response.data.student;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
      queryClient.setQueryData(QUERY_KEYS.students.detail(data.id), data);
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
};

export const useResetParentPassword = () => {
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/students/${id}/reset-parent-password`);
      return response.data;
    },
  });
};

export const useStaff = (params = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.staff.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value);
        }
      });
      const response = await api.get(`/staff?${searchParams.toString()}`);
      return response.data.staff;
    },
  });
};

export const useStaffMember = (id) => {
  return useQuery({
    queryKey: QUERY_KEYS.staff.detail(id),
    queryFn: async () => {
      const response = await api.get(`/staff/${id}`);
      return response.data.staff;
    },
    enabled: !!id,
  });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/staff", data);
      return response.data.staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/staff/${id}`, data);
      return response.data.staff;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
      queryClient.setQueryData(QUERY_KEYS.staff.detail(data.id), data);
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/staff/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
};

export const useResetStaffPassword = () => {
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/staff/${id}/reset-password`);
      return response.data;
    },
  });
};

export const useClassTimetable = (cls, section) => {
  return useQuery({
    queryKey: QUERY_KEYS.timetable.class(cls, section),
    queryFn: async () => {
      const response = await api.get(`/timetable?cls=${cls}&section=${section}`);
      return response.data;
    },
    enabled: !!cls && !!section,
  });
};

export const useTeacherTimetable = (staffId) => {
  return useQuery({
    queryKey: QUERY_KEYS.timetable.teacher(staffId),
    queryFn: async () => {
      const response = await api.get(`/timetable/teacher?staffId=${staffId}`);
      return response.data.entries;
    },
    enabled: !!staffId,
  });
};

export const useUpsertTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/timetable/upsert", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });
};

export const useDeleteTimetableEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/timetable/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });
};

export const useClassAttendance = (cls, section, date) => {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.class(cls, section, date),
    queryFn: async () => {
      const params = new URLSearchParams({ cls, section });
      if (date) params.append("date", date);
      const response = await api.get(`/attendance?${params.toString()}`);
      return response.data;
    },
    enabled: !!cls && !!section,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/attendance/mark", data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "class"] });
    },
  });
};

export const useStudentAttendance = (studentId, month, year) => {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.student(studentId, month, year),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (studentId) params.append("studentId", studentId);
      if (month) params.append("month", month);
      if (year) params.append("year", year);
      const response = await api.get(`/attendance/student?${params.toString()}`);
      return response.data;
    },
    enabled: !!studentId,
  });
};

export const useInquiries = (params = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.admissions.list,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value);
        }
      });
      const response = await api.get(`/admissions?${searchParams.toString()}`);
      return response.data.inquiries;
    },
  });
};

export const useCreateInquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/admissions", data);
      return response.data.inquiry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admissions.list });
    },
  });
};

export const useUpdateInquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admissions/${id}`, data);
      return response.data.inquiry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admissions.list });
    },
  });
};

export const useEnrollInquiry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.post(`/admissions/${id}/enroll`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admissions.list });
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
};

export const useNotices = (params = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.communication.list,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value);
        }
      });
      const response = await api.get(`/communication?${searchParams.toString()}`);
      return response.data.notices;
    },
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/communication", data);
      return response.data.notice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.communication.list });
    },
  });
};

export const useEvents = (params = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.events.list, params],
    queryFn: async () => {
      const res = await api.getEvents(params);
      return res;
    },
  });
};

// Diary
export const useDiaryEntries = (params = {}) => {
  return useQuery({
    queryKey: ["diary", params],
    queryFn: async () => {
      const res = await api.getDiaryEntries(params);
      return res.data?.entries || [];
    },
  });
};

export const useCreateDiaryEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.createDiaryEntry(data);
      return res.data?.entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary"] });
    },
  });
};

// Homework
export const useHomeworkList = (params = {}) => {
  return useQuery({
    queryKey: ["homework", params],
    queryFn: async () => {
      const res = await api.getHomework(params);
      return res.data?.homework || [];
    },
  });
};

export const useCreateHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.createHomework(data);
      return res.data?.homework;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
};

export const useSubmitHomework = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.submitHomework(id, data);
      return res.data?.submission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
  });
};

// Fees
export const useFeeComponents = () => {
  return useQuery({
    queryKey: ["fees", "components"],
    queryFn: async () => {
      const res = await api.getFeeComponents();
      return res.data?.components || [];
    },
  });
};

export const useFeeStructures = (params = {}) => {
  return useQuery({
    queryKey: ["fees", "structures", params],
    queryFn: async () => {
      const res = await api.getFeeStructures(params);
      return res.data?.structures || [];
    },
  });
};

export const useFeeLedger = (params = {}) => {
  return useQuery({
    queryKey: ["fees", "ledger", params],
    queryFn: async () => {
      const res = await api.getFeeLedger(params);
      return res.data?.ledger || [];
    },
  });
};

export const useFeeSummary = (params = {}) => {
  return useQuery({
    queryKey: ["fees", "summary", params],
    queryFn: async () => {
      const res = await api.getFeeSummary(params);
      return res.data;
    },
  });
};

export const useStudentFeeHistory = (studentId) => {
  return useQuery({
    queryKey: ["fees", "student", studentId],
    queryFn: async () => {
      const res = await api.getStudentFeeHistory(studentId);
      return res.data;
    },
    enabled: !!studentId,
  });
};

export const useRecordFeePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.recordFeePayment(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
};

// Leave Balance
export const useLeaveBalance = (staffId) => {
  return useQuery({
    queryKey: ["leave", "balance", staffId],
    queryFn: async () => {
      const params = staffId ? { staffId } : {};
      const res = await api.getLeaveBalance(params);
      return Array.isArray(res.data) ? res.data : (res.balances || []);
    },
    enabled: !!staffId,
  });
};

export { QUERY_KEYS };
