const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const feesController = require("./fees.controller");
const {
  createComponentSchema,
  createStructureSchema,
  createLedgerSchema,
  createLedgerBulkSchema,
  recordPaymentSchema,
  feeQuerySchema,
} = require("./fees.schema");

router.use(authenticate);

// Components
router.get("/components", feesController.getComponents);
router.post("/components", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), validate(createComponentSchema), feesController.createComponent);

// Structures
router.get("/structures", validateQuery(feeQuerySchema), feesController.getStructures);
router.post("/structures", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), validate(createStructureSchema), feesController.createStructure);

// Ledger
router.get("/ledger", validateQuery(feeQuerySchema), feesController.getLedger);
router.post("/ledger", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), validate(createLedgerSchema), feesController.createLedgerEntry);
router.post("/ledger/bulk", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN), validate(createLedgerBulkSchema), feesController.createLedgerBulk);

// Payments
router.post("/pay", requireRole(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.PARENT), validate(recordPaymentSchema), feesController.recordPayment);
router.get("/receipt/:id", feesController.getReceipt);

// Summary
router.get("/summary", feesController.getSummary);

// Per-student history
router.get("/students/:studentId", feesController.getStudentHistory);

module.exports = router;
