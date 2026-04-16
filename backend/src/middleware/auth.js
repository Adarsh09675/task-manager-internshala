const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { env } = require("../config/env");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  // Read token from httpOnly cookie first, then fallback to Bearer header (for API tester)
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    throw new ApiError(401, "Authentication token is missing");
  }

  const decoded = jwt.verify(token, env.jwtSecret);

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You are not allowed to perform this action"));
    }

    return next();
  };
}

module.exports = { protect, authorize };
