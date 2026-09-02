/* ============================================================
   DATABASE CONNECTION
   Connects Express to MongoDB using the connection string in
   your backend/.env file (MONGO_URI).

   DESIGNED FOR SERVERLESS (Vercel):
   1. CONNECTION CACHING
      We keep the connection on the module's `mongoose` object
      (outside any request handler).  Warm invocations reuse the
      already-open connection instead of opening a new one.

   2. IN-FLIGHT PROMISE CACHING
      If several cold-start requests arrive at once, they could
      each call connectDB().  We store the connection Promise in a
      module-level variable so concurrent callers await the SAME
      connection instead of racing to open duplicates.

   3. NO BUFFERING
      `bufferCommands: false` makes Mongoose fail a query
      immediately if the connection isn't ready, rather than
      silently waiting 10s and throwing
      "buffering timed out after 10000ms".  Because every request
      runs through the awaiting middleware before hitting a model,
      commands will already have a live connection.
   ============================================================ */
const mongoose = require('mongoose');

// A single shared Promise so concurrent callers don't open
// duplicate connections. Created lazily by connectDB().
let connectionPromise = null;

async function connectDB() {
  // Already fully connected — reuse it.
  if (mongoose.connection.readyState === 1) return;

  // If a connection attempt is already in flight, await the SAME
  // promise. This keeps concurrent cold-start requests in sync.
  if (connectionPromise) return connectionPromise;

  if (!process.env.MONGO_URI) {
    const err = new Error(
      'MONGO_URI is not set. Copy backend/.env.example to backend/.env and add your MongoDB Atlas connection string.'
    );
    console.error('❌ ' + err.message);
    throw err;
  }

  // Create the shared promise and start connecting.
  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    // Buffer commands so we never silently wait for a connection,
    // timing out with "buffering timed out after 10000ms".
    bufferCommands: false,
    // If the server isn't reachable, fail the query/client setup
    // quickly instead of hanging for a long time.
    serverSelectionTimeoutMS: 5000,
    // Keep the driver from waiting too long between pings.
    socketTimeoutMS: 45000,
    // Max number of sockets to keep idle (fine for serverless).
    maxPoolSize: 10
  });

  try {
    await connectionPromise;
    console.log('✅ Connected to MongoDB (Atlas)');
  } catch (error) {
    // Reset so a later request can retry the connection.
    connectionPromise = null;
    console.error('❌ Could not connect to MongoDB:', error.message);
    throw error;
  }

  // On older/mongoose-run node the connection can drop; remove the
  // cached promise so the next call reconnects cleanly.
  mongoose.connection.on('disconnected', () => {
    connectionPromise = null;
  });

  return connectionPromise;
}

module.exports = connectDB;
