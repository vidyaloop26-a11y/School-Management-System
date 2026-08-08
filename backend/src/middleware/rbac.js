const { ApiError } = require("../lib/errors");

// Role-based access control.
//
// Roles: superAdmin | schoolAdmin | teacher | parent
//   - superAdmin: global, manages schools
//   - schoolAdmin: manages one school (students, staff, timetable, attendance)
//   - teacher: reads everything in school, edits student corrections, marks attendance
//   - parent: read-only access to their own child
const ROLES = {
  SUPER_ADMIN: "superAdmin",
  SCHOOL_ADMIN: "schoolAdmin",
  TEACHER: "teacher",
  PARENT: "parent",
};

// Gate a route to the given roles. superAdmin always passes.
const requireRole =
  (...allowed) =>
  (req, res, next) => {
    const role = req.user?.role;
    if (!role) return next(new ApiError(401, "Authentication required"));
    if (role === ROLES.SUPER_ADMIN || allowed.includes(role)) return next();
    return next(new ApiError(403, "You do not have permission to perform this action"));
  };

module.exports = { requireRole, ROLES };