const { ApiError } = require("../lib/errors");

// ---------------------------------------------------------------------------
// Account types (login axis) — one per User.role
//   superAdmin  : platform provider (us) — aggregate stats + support lookups only
//   schoolAdmin : the school's own administrator — full power inside their school
//   staff       : any employee; what they can do is defined by `duties`
//   parent      : child-scoped portal access
// ---------------------------------------------------------------------------
const ROLES = {
  SUPER_ADMIN: "superAdmin",
  SCHOOL_ADMIN: "schoolAdmin",
  STAFF: "staff",
  PARENT: "parent",
};

// Legacy alias kept during migration so older code paths keep working.
ROLES.TEACHER = ROLES.STAFF;

const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN];

// Functional duties (checkbox axis) — a staff account may hold any combination.
const DUTIES = [
  "principal",
  "vicePrincipal",
  "hod",
  "teacher",
  "examCoordinator",
  "accountant",
  "frontOffice",
  "librarian",
  "transportIncharge",
  "warden",
  "hrManager",
  "admissionsOfficer",
  "itAdmin",
];

// Gate a route to the given roles. superAdmin always passes.
const requireRole =
  (...allowed) =>
  (req, res, next) => {
    const role = req.user?.role;
    if (!role) return next(new ApiError(401, "Authentication required"));
    if (role === ROLES.SUPER_ADMIN || allowed.includes(role)) return next();
    return next(new ApiError(403, "You do not have permission to perform this action"));
  };

// Gate a route to holders of ANY of the listed duties. superAdmin and
// schoolAdmin always pass (administrative override). Everyone else must be
// staff carrying at least one of the duties.
const requireDuty =
  (...needed) =>
  (req, res, next) => {
    const user = req.user;
    if (!user?.role) return next(new ApiError(401, "Authentication required"));
    if (ADMIN_ROLES.includes(user.role)) return next();
    if (user.role !== ROLES.STAFF) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    const held = Array.isArray(user.duties) ? user.duties : [];
    if (needed.some((d) => held.includes(d))) return next();
    return next(new ApiError(403, "You do not have permission to perform this action"));
  };

// Block specific roles from a route — used to keep superAdmin out of
// per-school data entirely (they get /api/support/* aggregate endpoints).
const rejectRoles =
  (...banned) =>
  (req, res, next) => {
    const role = req.user?.role;
    if (!role) return next(new ApiError(401, "Authentication required"));
    if (banned.includes(role)) {
      return next(new ApiError(403, "Platform accounts may not access school-level data"));
    }
    next();
  };

module.exports = { requireRole, requireDuty, rejectRoles, ROLES, DUTIES, ADMIN_ROLES };
