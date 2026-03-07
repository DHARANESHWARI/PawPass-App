const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🐾 Success: PawPass is connected to MongoDB Atlas!");
  } catch (err) {
    console.error("❌ Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;