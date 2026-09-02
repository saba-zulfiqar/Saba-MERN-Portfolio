/* ============================================================
   VERCEL SERVERLESS ENTRY POINT
   With the Vercel Root Directory set to `backend`, this file is
   the single serverless function.  Vercel's `@vercel/node`
   builder turns an exported handler (here, the Express app) into
   a function and routes every request to it via vercel.json.

   server.js exports the Express app (NOT `app.listen()`), so we
   just re-export it — Express then handles all routing, static
   files (../public) and seeded setup on the cold start.
   ============================================================ */
module.exports = require('./server');
