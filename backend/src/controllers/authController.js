const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { createToken } = require("../services/tokenService");
const { registerSchema, loginSchema } = require("../validators/authValidators");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { env } = require("../config/env");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    role: payload.role || "user",
  });

  const token = createToken(user);
  res.cookie("token", token, COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);

  const user = await User.findOne({ email: payload.email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = createToken(user);
  res.cookie("token", token, COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
    },
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}, "id name email role createdAt").sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: users });
});

module.exports = { register, login, logout, getProfile, getAllUsers };
