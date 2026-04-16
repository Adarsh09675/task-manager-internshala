const express = require("express");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAdminSummary,
  assignTask,
  toggleComplete,
  requestUpdate,
  approveUpdate,
  rejectUpdate,
} = require("../controllers/taskController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.get("/admin/summary", authorize("admin"), getAdminSummary);

router.get("/:id", getTaskById);
router.patch("/:id", updateTask);
router.delete("/:id", authorize("admin"), deleteTask);

// Toggle complete (user action)
router.patch("/:id/toggle-complete", toggleComplete);

// Update request flow
router.post("/:id/request-update", requestUpdate);
router.post("/:id/approve-update", authorize("admin"), approveUpdate);
router.post("/:id/reject-update", authorize("admin"), rejectUpdate);

// Admin assign task
router.patch("/:id/assign", authorize("admin"), assignTask);

module.exports = router;
