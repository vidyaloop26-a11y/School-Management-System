const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, ROLES } = require("../../middleware/rbac");
const inventoryController = require("./inventory.controller");
const {
  createItemSchema,
  updateItemSchema,
  purchaseSchema,
  issueSchema,
  inventoryQuerySchema,
} = require("./inventory.schema");

router.use(authenticate);

router.get("/", validateQuery(inventoryQuerySchema), inventoryController.getItems);
router.get("/low-stock", inventoryController.getLowStock);
router.get("/:id", inventoryController.getItemById);

router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(createItemSchema),
  inventoryController.createItem
);
router.put(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(updateItemSchema),
  inventoryController.updateItem
);
router.delete(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  inventoryController.deleteItem
);

router.post(
  "/purchase",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(purchaseSchema),
  inventoryController.recordPurchase
);
router.post(
  "/issue",
  requireRole(ROLES.SCHOOL_ADMIN),
  validate(issueSchema),
  inventoryController.recordIssue
);

module.exports = router;
