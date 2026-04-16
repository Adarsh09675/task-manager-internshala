const app = require('../backend/src/app');
const { connectDatabase } = require('../backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
  // Ensure the database is connected once before fulfilling API requests globally
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (err) {
      console.error('Database connection failed on serverless invocation:', err);
    }
  }
  
  // Forward request natively to your existing Express app logic
  return app(req, res);
};
