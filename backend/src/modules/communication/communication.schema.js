const { z } = require("zod");

const _base = {
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Notice body is required"),
  audience: z.enum(["all", "class"]).default("all"),
  cls: z.string().optional(),
  section: z.string().optional(),
};

const classAudienceRefine = (val) => {
  if (val.audience === "class" && (!val.cls || !val.section)) {
    return false;
  }
  return true;
};

const createNoticeSchema = z.object(_base).refine(classAudienceRefine, {
  message: "Class and section are required for class-scoped notices",
  path: ["cls"],
});

const updateNoticeSchema = z.object(_base).partial().refine(
  (val) => {
    if (val.audience === "class" && (!val.cls || !val.section)) return false;
    return true;
  },
  { message: "Class and section are required for class-scoped notices", path: ["cls"] }
);

const listQuerySchema = z.object({
  cls: z.string().optional(),
  section: z.string().optional(),
  schoolId: z.string().optional(),
});

const noticeIdParam = z.object({ id: z.string().min(1) });

module.exports = {
  createNoticeSchema,
  updateNoticeSchema,
  listQuerySchema,
  noticeIdParam,
};
