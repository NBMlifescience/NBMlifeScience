const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pharma"
    );
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("MongoDB connection error:", err);
  }
};

module.exports = connectDB;