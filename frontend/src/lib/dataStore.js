import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { FEE_ROWS, PARENT_FEE_TERMS } from "./stage2Data";
import { MARK_ENTRY } from "./stage3Data";

// Initial seed data for schools
const SEED_SCHOOLS = [
  { id: "SCH001", code: "SCH001", name: "Greenwood International School", board: "CBSE", city: "New Delhi", status: "Active", session: "2026-27" },
  { id: "SCH002", code: "SCH002", name: "St. Xavier Academy", board: "ICSE", city: "Mumbai", status: "Active", session: "2026-27" },
  { id: "SCH003", code: "SCH003", name: "DPS World School", board: "CBSE", city: "Bengaluru", status: "Active", session: "2026-27" },
];

// Initial seed data for timetable
const SEED_TIMETABLE = {
  "10-A": {
    "Mon": { P1: "Mathematics", P2: "Physics", P3: "English", P4: "Chemistry", P5: "Physical Ed." },
    "Tue": { P1: "English", P2: "Mathematics", P3: "Physics", P4: "Biology", P5: "Computer Sci." },
    "Wed": { P1: "Physics", P2: "Chemistry", P3: "Mathematics", P4: "Hindi/Sanskrit", P5: "Library" },
    "Thu": { P1: "Mathematics", P2: "Biology", P3: "English", P4: "Social Sci.", P5: "Physics Lab" },
    "Fri": { P1: "Computer Sci.", P2: "Mathematics", P3: "Chemistry", P4: "English", P5: "Sports" },
  },
  "9-B": {
    "Mon": { P1: "English", P2: "Mathematics", P3: "Science", P4: "Social Sci.", P5: "Arts" },
    "Tue": { P1: "Science", P2: "English", P3: "Mathematics", P4: "Hindi", P5: "Sports" },
    "Wed": { P1: "Mathematics", P2: "Science", P3: "English", P4: "Computer", P5: "Music" },
    "Thu": { P1: "Social Sci.", P2: "Mathematics", P3: "Science", P4: "English", P5: "Library" },
    "Fri": { P1: "Science", P2: "Social Sci.", P3: "Mathematics", P4: "English", P5: "Activity" },
  }
};

// Initial seed data for attendance
const SEED_ATTENDANCE = {
  "2026-08-14": {
    "10-A": {
      "S101": "P", "S102": "P", "S103": "A", "S104": "P", "S105": "L",
      "S106": "P", "S107": "P", "S108": "P", "S109": "A", "S110": "P"
    }
  }
};

// Data Store Keys
const KEYS = {
  SCHOOLS: "vidyaloop_schools",
  FEES: "vidyaloop_fees",
  PARENT_FEES: "vidyaloop_parent_fees",
  EXAMS: "vidyaloop_exams",
  ATTENDANCE: "vidyaloop_attendance",
  TIMETABLE: "vidyaloop_timetable",
  ACTIVE_SCHOOL: "vidyaloop_active_school",
};

// LocalStorage Helper
function getStored(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

const DataStoreContext = createContext(null);

export function DataStoreProvider({ children }) {
  const [schools, setSchoolsState] = useState(() => getStored(KEYS.SCHOOLS, SEED_SCHOOLS));
  const [activeSchoolId, setActiveSchoolIdState] = useState(() => getStored(KEYS.ACTIVE_SCHOOL, "SCH001"));
  const [fees, setFeesState] = useState(() => getStored(KEYS.FEES, FEE_ROWS));
  const [parentFees, setParentFeesState] = useState(() => getStored(KEYS.PARENT_FEES, PARENT_FEE_TERMS));
  const [exams, setExamsState] = useState(() => getStored(KEYS.EXAMS, MARK_ENTRY));
  const [attendance, setAttendanceState] = useState(() => getStored(KEYS.ATTENDANCE, SEED_ATTENDANCE));
  const [timetable, setTimetableState] = useState(() => getStored(KEYS.TIMETABLE, SEED_TIMETABLE));

  // Persistence subscribers
  const setSchools = useCallback((updater) => {
    setSchoolsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStored(KEYS.SCHOOLS, next);
      return next;
    });
  }, []);

  const setActiveSchoolId = useCallback((id) => {
    setActiveSchoolIdState(id);
    setStored(KEYS.ACTIVE_SCHOOL, id);
  }, []);

  const setFees = useCallback((updater) => {
    setFeesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStored(KEYS.FEES, next);
      return next;
    });
  }, []);

  const setParentFees = useCallback((updater) => {
    setParentFeesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStored(KEYS.PARENT_FEES, next);
      return next;
    });
  }, []);

  const setExams = useCallback((updater) => {
    setExamsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStored(KEYS.EXAMS, next);
      return next;
    });
  }, []);

  const setAttendance = useCallback((updater) => {
    setAttendanceState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStored(KEYS.ATTENDANCE, next);
      return next;
    });
  }, []);

  const setTimetable = useCallback((updater) => {
    setTimetableState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setStored(KEYS.TIMETABLE, next);
      return next;
    });
  }, []);

  // Operations
  const addSchool = useCallback((school) => {
    setSchools((prev) => [...prev, { ...school, id: `SCH00${prev.length + 1}` }]);
  }, [setSchools]);

  const updateSchool = useCallback((id, updated) => {
    setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  }, [setSchools]);

  const deleteSchool = useCallback((id) => {
    setSchools((prev) => prev.filter((s) => s.id !== id));
  }, [setSchools]);

  const payFeeForStudent = useCallback((admNo) => {
    setFees((prev) =>
      prev.map((r) => (r.admNo === admNo ? { ...r, status: "Paid", paidOn: new Date().toISOString().split("T")[0] } : r))
    );
  }, [setFees]);

  const payParentFeeTerm = useCallback((termName) => {
    setParentFees((prev) =>
      prev.map((t) => (t.term === termName ? { ...t, status: "Paid", date: `Paid on ${new Date().toLocaleDateString("en-IN")}` } : t))
    );
  }, [setParentFees]);

  const updateExamMark = useCallback((admNo, newMarks) => {
    setExams((prev) =>
      prev.map((item) => {
        if (item.admNo === admNo) {
          const marks = typeof newMarks === "string" ? parseInt(newMarks, 10) || 0 : newMarks;
          let grade = "F";
          if (marks >= 90) grade = "A+";
          else if (marks >= 80) grade = "A";
          else if (marks >= 70) grade = "B";
          else if (marks >= 60) grade = "C";
          else if (marks >= 50) grade = "D";
          return { ...item, marks, grade };
        }
        return item;
      })
    );
  }, [setExams]);

  const markClassAttendance = useCallback((dateStr, classSectionKey, studentAttendanceMap) => {
    setAttendance((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        [classSectionKey]: studentAttendanceMap,
      },
    }));
  }, [setAttendance]);

  const updateTimetableCell = useCallback((classSection, day, period, subject) => {
    setTimetable((prev) => {
      const clsMap = prev[classSection] || {};
      const dayMap = clsMap[day] || {};
      return {
        ...prev,
        [classSection]: {
          ...clsMap,
          [day]: {
            ...dayMap,
            [period]: subject,
          },
        },
      };
    });
  }, [setTimetable]);

  const value = {
    schools,
    activeSchoolId,
    setActiveSchoolId,
    addSchool,
    updateSchool,
    deleteSchool,
    fees,
    parentFees,
    payFeeForStudent,
    payParentFeeTerm,
    exams,
    updateExamMark,
    attendance,
    markClassAttendance,
    timetable,
    updateTimetableCell,
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error("useDataStore must be used within a DataStoreProvider");
  }
  return context;
}
