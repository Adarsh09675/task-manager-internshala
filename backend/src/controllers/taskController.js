const Task = require("../models/Task");
const { createTaskSchema, updateTaskSchema, updateRequestSchema } = require("../validators/taskValidators");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");

// Create a new task (admin creates and can assign; user creates for themselves)
const createTask = asyncHandler(async (req, res) => {
  const payload = createTaskSchema.parse(req.body);

  const taskData = {
    ...payload,
    owner: req.user._id,
  };

  // Admin can assign task to another user
  if (req.user.role === "admin" && payload.assignedTo) {
    taskData.assignedTo = payload.assignedTo;
  }

  const task = await Task.create(taskData);
  const populated = await task.populate("assignedTo", "name email");

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: populated,
  });
});

// Get tasks — admin sees all, user sees own + assigned-to-them
const getTasks = asyncHandler(async (req, res) => {
  let query;
  if (req.user.role === "admin") {
    query = {};
  } else {
    query = {
      $or: [{ owner: req.user._id }, { assignedTo: req.user._id }],
    };
  }

  const tasks = await Task.find(query)
    .populate("owner", "name email")
    .populate("assignedTo", "name email")
    .populate("updateRequest.requestedBy", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

// Get single task
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("owner", "name email")
    .populate("assignedTo", "name email");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isOwner = task.owner._id.toString() === req.user._id.toString();
  const isAssigned = task.assignedTo?._id?.toString() === req.user._id.toString();

  if (req.user.role !== "admin" && !isOwner && !isAssigned) {
    throw new ApiError(403, "You can only access your own tasks");
  }

  res.status(200).json({ success: true, data: task });
});

// Update task (admin only for full edit; user can only toggle complete via toggleComplete)
const updateTask = asyncHandler(async (req, res) => {
  const payload = updateTaskSchema.parse(req.body);
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isOwner = task.owner.toString() === req.user._id.toString();

  if (req.user.role !== "admin" && !isOwner) {
    throw new ApiError(403, "You can only update your own tasks");
  }

  Object.assign(task, payload);
  await task.save();

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: task,
  });
});

// Delete task (admin only for any task; owner can delete their own)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (req.user.role !== "admin" && task.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own tasks");
  }

  await task.deleteOne();

  res.status(200).json({ success: true, message: "Task deleted successfully" });
});

// Admin summary
const getAdminSummary = asyncHandler(async (_req, res) => {
  const [totalTasks, completedTasks, pendingTasks, inProgressTasks, updateRequests] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: "completed" }),
    Task.countDocuments({ status: "pending" }),
    Task.countDocuments({ status: "in-progress" }),
    Task.countDocuments({ "updateRequest.pending": true }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      pendingUpdateRequests: updateRequests,
    },
  });
});

// Admin assigns a task to a user
const assignTask = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, "userId is required");

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  task.assignedTo = userId || null;
  await task.save();
  const populated = await task.populate("assignedTo", "name email");

  res.status(200).json({
    success: true,
    message: "Task assigned successfully",
    data: populated,
  });
});

// User toggles their task complete/incomplete
const toggleComplete = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const isOwner = task.owner.toString() === req.user._id.toString();
  const isAssigned = task.assignedTo?.toString() === req.user._id.toString();

  if (!isOwner && !isAssigned) {
    throw new ApiError(403, "You can only update your own tasks");
  }

  task.status = task.status === "completed" ? "pending" : "completed";
  await task.save();

  res.status(200).json({
    success: true,
    message: `Task marked as ${task.status}`,
    data: task,
  });
});

// User submits an update request
const requestUpdate = asyncHandler(async (req, res) => {
  const payload = updateRequestSchema.parse(req.body);
  const task = await Task.findById(req.params.id);

  if (!task) throw new ApiError(404, "Task not found");

  const isOwner = task.owner.toString() === req.user._id.toString();
  const isAssigned = task.assignedTo?.toString() === req.user._id.toString();

  if (!isOwner && !isAssigned) {
    throw new ApiError(403, "You can only request updates for your own tasks");
  }

  task.updateRequest = {
    pending: true,
    requestedBy: req.user._id,
    requestedTitle: payload.requestedTitle,
    requestedDescription: payload.requestedDescription,
    requestedAt: new Date(),
  };

  await task.save();

  res.status(200).json({
    success: true,
    message: "Update request submitted successfully",
    data: task,
  });
});

// Admin approves a user's update request
const approveUpdate = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (!task.updateRequest?.pending) {
    throw new ApiError(400, "No pending update request for this task");
  }

  task.title = task.updateRequest.requestedTitle || task.title;
  task.description = task.updateRequest.requestedDescription ?? task.description;
  task.updateRequest = { pending: false, requestedBy: null, requestedTitle: "", requestedDescription: "", requestedAt: null };

  await task.save();

  res.status(200).json({
    success: true,
    message: "Update request approved",
    data: task,
  });
});

// Admin rejects a user's update request
const rejectUpdate = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (!task.updateRequest?.pending) {
    throw new ApiError(400, "No pending update request for this task");
  }

  task.updateRequest = { pending: false, requestedBy: null, requestedTitle: "", requestedDescription: "", requestedAt: null };
  await task.save();

  res.status(200).json({
    success: true,
    message: "Update request rejected",
    data: task,
  });
});

module.exports = {
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
};
