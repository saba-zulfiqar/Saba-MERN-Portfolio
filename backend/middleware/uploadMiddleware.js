/* ============================================================
   IMAGE UPLOAD MIDDLEWARE (Multer)
   Handles project image uploads from the admin dashboard.
   Files land in the project's /uploads folder and are served
   at /uploads/<filename>.
   The field name used by the dashboard is "image-file".
============================================================ */
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Make sure the uploads folder exists (one level above /backend)
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Where to store files and how to name them
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  // Unique, safe filename: timestamp + extension
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

// Accept images only, limit to 5 MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  }
});

module.exports = upload;