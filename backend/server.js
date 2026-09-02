/* ============================================================
   SERVER ENTRY POINT
   1. Loads environment variables from backend/.env
   2. Connects to MongoDB
   3. Serves the static portfolio site from /public
   4. Mounts the REST API routes under /api
   5. Serves uploaded project images from /uploads
============================================================ */
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load backend/.env into process.env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const About = require('./models/About');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const skillRoutes = require('./routes/skillRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

/* ----------------------------------------------------------
   MIDDLEWARE
---------------------------------------------------------- */
// Allow the API to be called from other origins during development
app.use(cors());

// Parse JSON request bodies (used by the admin dashboard API calls)
app.use(express.json());

/* ----------------------------------------------------------
   LAZY INITIALIZATION (MUST run BEFORE the API routes below)
   On a cold start the first request triggers DB connect +
   seeding.  On subsequent warm invocations the middleware
   short-circuits immediately.

   IMPORTANT: this `app.use(...)` is registered here, ABOVE the
   /api routes, so every API request awaits a LIVE MongoDB
   connection before reaching a controller.  If it were mounted
   after the routes, a query like `projects.find()` would run
   before Mongo is ready and Mongoose would throw
   "buffering timed out after 10000ms" (exactly the Vercel error).
---------------------------------------------------------- */
// A shared Promise so concurrent cold-start requests don't each run
// the init (DB connect + seeding) separately. Once it resolves, all
// subsequent requests pass straight through.
let initPromise = null;

const initApp = async () => {
  // Wait for a live MongoDB connection BEFORE any model query runs.
  // Mongoose has `bufferCommands: false`, so a model call without a
  // ready connection would throw immediately — this await prevents that.
  await connectDB();
  await ensureAdmin();
  await ensureAbout();
};

app.use(async (req, res, next) => {
  try {
    // Reuse a single init promise across concurrent cold starts.
    if (!initPromise) {
      initPromise = initApp().catch((err) => {
        // Reset so the next request can retry if this one failed.
        initPromise = null;
        throw err;
      });
    }
    await initPromise;
    next();
  } catch (err) {
    console.error('❌ Initialization failed:', err.message);
    res.status(500).json({
      message: 'Server could not start. Please check that all environment variables are configured correctly in the Vercel dashboard.'
    });
  }
});

// Serve the uploaded project images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve the static portfolio website (public/…)
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ----------------------------------------------------------
   API ROUTES
---------------------------------------------------------- */
app.use('/api/auth', authRoutes);     // login + token verification
app.use('/api/projects', projectRoutes); // project CRUD
app.use('/api/about', aboutRoutes);   // read + update about/bio
app.use('/api/skills', skillRoutes);  // skill CRUD
app.use('/api/contact', contactRoutes); // contact form → email

// Friendly redirect so /admin opens the login page
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));

// Let the router know an API path didn't match (404 as JSON, not HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found: ' + req.originalUrl });
});

/* ----------------------------------------------------------
   ONE-TIME SETUP ON STARTUP
   1. Make sure an Admin account exists (from .env values)
   2. Make sure an About document exists (so the frontend
      always has something to read)
---------------------------------------------------------- */
async function ensureAdmin() {
  const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
  if (existing) return;

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await Admin.create({ username: process.env.ADMIN_USERNAME, passwordHash });
  console.log(`👤 Created admin user "${process.env.ADMIN_USERNAME}" from .env (change the password after first login!).`);
}

async function ensureAbout() {
  const existing = await About.findOne();
  if (existing) return;

  await About.create({
    greeting: "Hi, I'm",
    name: 'Saba Zulfiqar',
    headline: 'MERN Stack Developer | Building Modern Web Applications',
    description:
      'I craft fast, scalable, and beautiful full-stack applications with the MERN stack. Turning ideas into digital products.',
    bioTitle: "A curious mind, a builder's heart.",
    bioParagraphs: [
      "I'm Saba Zulfiqar — a BS Sociology student who found a passion for technology and transitioned into the world of web development.",
      'I build full-stack applications using MongoDB, Express.js, React.js, and Node.js.',
      'With a sociology background I bring an empathy-first perspective to product design.'
    ],
    contact: {
      email: 'sabazulfiqar926@gmail.com',
      phone: '03075834975',
      github: 'https://github.com/saba-zulfiqar',
      linkedin: 'https://www.linkedin.com/in/saba-rana-015059356/',
      location: 'Pakistan'
    }
  });
  console.log('📄 Created default About document.');
}

/* ----------------------------------------------------------
   START THE SERVER (local development only)
---------------------------------------------------------- */
const PORT = process.env.PORT || 5000;

// Give beginners a clear message if a required .env value is missing
function checkEnv() {
  const missing = [];
  if (!process.env.MONGO_URI) missing.push('MONGO_URI');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');

  if (missing.length) {
    console.error(
      '❌ Missing environment variable(s): ' + missing.join(', ') + '\n' +
      '   Copy backend/.env.example to backend/.env and fill in the values.'
    );
    process.exit(1);
  }
}

async function start() {
  checkEnv();
  await connectDB();
  await ensureAdmin();
  await ensureAbout();

  // The contact form still works without these, so warn instead of crashing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Contact-form emails are not configured — set EMAIL_USER and EMAIL_PASS in backend/.env');
    console.warn('   to have /api/contact deliver messages to sabazulfiqar926@gmail.com.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`   Public site :  http://localhost:${PORT}`);
    console.log(`   Admin login :  http://localhost:${PORT}/admin/login.html`);
  });
}

// Only auto-start when this file is run directly (node server.js).
// When required by a test or Vercel's api/index.js, `app` is exported.
if (require.main === module) {
  start();
}

module.exports = app;