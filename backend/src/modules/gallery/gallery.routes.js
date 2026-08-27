const router = require("express").Router();
const { validate, validateQuery } = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");
const { requireRole, requireDuty, ROLES } = require("../../middleware/rbac");
const galleryController = require("./gallery.controller");
const {
  createAlbumSchema,
  addPhotoSchema,
  galleryQuerySchema,
  albumIdParam,
  photoIdParam,
} = require("./gallery.schema");

router.use(authenticate);

router.get("/", validateQuery(galleryQuerySchema), galleryController.getAlbums);
router.get("/:id", validateQuery(albumIdParam, "params"), galleryController.getAlbumById);

router.post(
  "/",
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.STAFF),
  validate(createAlbumSchema),
  galleryController.createAlbum
);
router.post(
  "/:id/photos",
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.STAFF),
  validateQuery(albumIdParam, "params"),
  validate(addPhotoSchema),
  galleryController.addPhoto
);

router.delete(
  "/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validateQuery(albumIdParam, "params"),
  galleryController.deleteAlbum
);
router.delete(
  "/photos/:id",
  requireRole(ROLES.SCHOOL_ADMIN),
  validateQuery(photoIdParam, "params"),
  galleryController.deletePhoto
);

module.exports = router;
