const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/task-manager-internshala",
  jwtSecret: process.env.JWT_SECRET || "replace-this-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
};

module.exports = { env };
