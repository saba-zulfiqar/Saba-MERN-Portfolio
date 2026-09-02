/* ============================================================
   VERCEL SERVERLESS ENTRY POINT
   Vercel auto-detects files in the /api directory as serverless
   functions.  This file re-exports the Express app from
   backend/server.js so every incoming request (routed here via
   vercel.json rewrites) is handled by Express.

   The Express app sets up its own lazy-initialization middleware
   that runs connectDB + ensureAdmin + ensureAbout on the FIRST
   request (cold start), then skips it on warm invocations.
   ============================================================ */
module.exports = require('../backend/server');
