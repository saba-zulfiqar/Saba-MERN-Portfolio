/* ============================================================
   DATABASE CONNECTION
   Connects Express to MongoDB using the connection string in
   your backend/.env file (MONGO_URI).

   SERVERLESS NOTE (Vercel):
   MongoDB connections are cached across warm invocations by
   checking `mongoose.connection.readyState`.  On cold start
   the connection is established; on subsequent requests the
   existing connection is reused.
   ============================================================ */
const mongoose = require('mongoose');

async function connectDB() {
  // If already connected (readyState 1) or connecting (2), reuse
  if (mongoose.connection.readyState >= 1) return;

  if (!process.env.MONGO_URI) {
    const err = new Error(
      'MONGO_URI is not set. Copy backend/.env.example to backend/.env and add your MongoDB Atlas connection string.'
    );
    console.error('❌ ' + err.message);
    throw err;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB (Atlas)');
  } catch (error) {
    console.error('❌ Could not connect to MongoDB:', error.message);
    throw error;
  }
}

module.exports = connectDB;
