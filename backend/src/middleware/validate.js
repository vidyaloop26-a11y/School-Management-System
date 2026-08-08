const { ApiError } = require("../lib/errors");

// Validates a request against a zod schema and assigns the parsed result to
// req.body / req.query / req.params.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.flatten();
    return next(new ApiError(422, "Validation failed", details));
  }
  req.body = result.data;
  next();
};

const validateQuery = (schema, source = "query") => (req, res, next) => {
  const result = schema.safeParse(source === "query" ? req.query : req.params);
  if (!result.success) {
    const details = result.error.flatten();
    return next(new ApiError(422, "Validation failed", details));
  }
  if (source === "query") req.query = result.data;
  else req.params = result.data;
  next();
};

module.exports = { validate, validateQuery };