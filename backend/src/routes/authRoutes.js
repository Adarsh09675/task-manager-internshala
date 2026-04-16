const express = require("express");

const { login, register, logout, getProfile, getAllUsers } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getProfile);
router.get("/users", protect, authorize("admin"), getAllUsers);

module.exports = router;
