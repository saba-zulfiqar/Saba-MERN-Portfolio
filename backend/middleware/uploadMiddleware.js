/* ============================================================
   IMAGE UPLOAD MIDDLEWARE (Multer)
   Handles project image uploads from the admin dashboard.

   LOCAL: files are saved to the /uploads folder and served at
   /uploads/<filename>.

   SERVERLESS (Vercel): disk writes are not possible — the
   filesystem is read-only.  When VERCEL is set the middleware
   accepts the upload into memory (the controller will reject
   it with a clear 400 message telling the user to paste an
   image URL instead).
   ============================================================ */
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const isVercel = !!process.env.VERCEL;

/* --- Disk storage (local development) -------------------------- */
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!isVercel) {
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.warn('⚠️ Could not create uploads directory:', e.message);
  }
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

/* --- Choose storage strategy ---------------------------------- */
const storage = isVercel ? multer.memoryStorage() : diskStorage;

/* --- Shared limits & file filter ------------------------------- */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  }
});

module.exports = upload;
