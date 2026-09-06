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
  requireDuty("librarian"),
  validate(createBookSchema),
  libraryController.createBook
);
router.post(
  "/issue",
  requireDuty("librarian"),
  validate(issueBookSchema),
  libraryController.issueBook
);
router.post(
  "/:id/return",
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
