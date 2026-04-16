const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { notFoundHandler } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { sanitizeRequest } = require("./middleware/sanitize");

const app = express();
const frontendDistPath = path.join(__dirname, "..", "..", "frontend", "dist");
const hasFrontendBuild = fs.existsSync(frontendDistPath);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));
}

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Task manager API is running",
    timestamp: new Date().toISOString(),
  });
});
app.get("/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Task manager API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/v1/auth", authRoutes);

app.use("/api/v1/tasks", taskRoutes);
app.use("/v1/tasks", taskRoutes);

if (hasFrontendBuild) {
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
