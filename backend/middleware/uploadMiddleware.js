/* ============================================================
   IMAGE UPLOAD MIDDLEWARE (Multer → Cloudinary)
   Handles project image uploads from the admin dashboard.

   HOW IT WORKS
   - Multer parses the incoming multipart form and receives the
     image file.
   - Instead of writing the file to the server's local disk (which
     is temporary / read-only on Vercel), `multer-storage-cloudinary`
     streams the image straight up to your Cloudinary account and
     stores the returned secure URL (and its unique public_id).
   - `req.file.path`     → the Cloudinary HTTPS image URL
   - `req.file.filename` → the Cloudinary public_id (used to delete)

   When Cloudinary credentials are NOT set, the middleware still
   parses the form but keeps the file in memory and the controller
   will simply use the "Image URL" field the dashboard provides
   (so the feature degrades gracefully instead of crashing).

   The form field name used by the dashboard is "image-file".
   ============================================================ */
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

/* ----------------------------------------------------------
   1. Configure the Cloudinary SDK from environment variables
   ---------------------------------------------------------- */
// These are read from backend/.env locally and from the Vercel
// dashboard "Environment Variables" settings in production.
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/* ----------------------------------------------------------
   2. Build the storage engine
   ---------------------------------------------------------- */
let storage;

if (hasCloudinary) {
  // CloudinaryStorage tells Multer to upload to Cloudinary.
  // `params` lets us set a folder, auto-format, etc.
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'portfolio', // all project images live under this Cloudinary folder
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'], // images only
      // Add a public_id => unique filename. If we omit it Cloudinary
      // generates one automatically (recommended to avoid collisions).
      public_id: (req, file) => `project-${Date.now()}-${Math.round(Math.random() * 1e9)}`
    }
  });
} else {
  // Fallback: keep the file in memory. The controller refuses to
  // persist it and asks for an image URL instead. `memoryStorage`
  // never touches disk, so it is safe everywhere (local + Vercel).
  storage = multer.memoryStorage();
}

/* ----------------------------------------------------------
   3. Create the Multer instance with shared limits & filter
   ---------------------------------------------------------- */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  }
});

// Re-export the Cloudinary SDK + a flag so the controller can
// (a) delete images by public_id and (b) know if uploads are on.
module.exports = upload;
module.exports.cloudinary = cloudinary;
module.exports.cloudinaryEnabled = hasCloudinary;
