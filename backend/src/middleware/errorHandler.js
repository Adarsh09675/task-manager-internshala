function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  if (error.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource id",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Resource already exists",
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
    ...(error.details ? { details: error.details } : {}),
  });
}

module.exports = { errorHandler };
