const { z } = require("zod");

const VISIBILITY = ["PUBLIC", "STAFF_ONLY", "PRIVATE"];

const createAlbumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  visibility: z.enum(VISIBILITY).default("PUBLIC"),
});

const addPhotoSchema = z.object({
  url: z.string().url("A valid URL is required"),
  caption: z.string().optional(),
});

const galleryQuerySchema = z.object({
  schoolId: z.string().optional(),
  visibility: z.enum(VISIBILITY).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const albumIdParam = z.object({ id: z.string().min(1) });
const photoIdParam = z.object({ id: z.string().min(1) });

module.exports = {
  VISIBILITY,
  createAlbumSchema,
  addPhotoSchema,
  galleryQuerySchema,
  albumIdParam,
  photoIdParam,
};
