/* ============================================================
   DATABASE CONNECTION
   Connects Express to MongoDB using the connection string in
   your backend/.env file (MONGO_URI).
============================================================ */
const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error(
      '❌ MONGO_URI is not set. Copy backend/.env.example to backend/.env and add your MongoDB Atlas connection string.'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB (Atlas)');
  } catch (error) {
    console.error('❌ Could not connect to MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;