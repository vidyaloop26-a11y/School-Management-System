const { ApiError, notFound } = require("../lib/errors");

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Prisma-level known errors
  if (err && err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with that unique value already exists",
    });
  }
  if (err && err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found" });
  }

  // Malformed JSON body
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }

  console.error("[ERROR]", err);
  return res.status(500).json({ success: false, message: "Internal server error" });
};

module.exports = { errorHandler };