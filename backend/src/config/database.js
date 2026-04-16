const mongoose = require("mongoose");

const { env } = require("./env");

async function connectDatabase(uri = env.mongoUri) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  console.log("MongoDB connected");
}

module.exports = { connectDatabase };
