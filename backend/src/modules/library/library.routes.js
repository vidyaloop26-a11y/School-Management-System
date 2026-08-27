const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const libraryController = require("./library.controller");
const {
  createBookSchema,
  issueBookSchema,
  returnBookSchema,
  libraryQuerySchema,
} = require("./library.schema");

router.use(authenticate);

router.get("/", validateQuery(libraryQuerySchema), libraryController.getBooks);
router.get("/issues", libraryController.getIssues);
router.get("/:id", libraryController.getBookById);

router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("librarian"),
  validate(createBookSchema),
  libraryController.createBook
);
router.post(
  "/issue",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("librarian"),
  validate(issueBookSchema),
  libraryController.issueBook
);
router.post(
  "/:id/return",
  requireRole(ROLES.SCHOOL_ADMIN),
  requireDuty("librarian"),
  validate(returnBookSchema),
  libraryController.returnBook
);
router.delete(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  libraryController.deleteBook
);

module.exports = router;
