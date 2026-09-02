/* ============================================================
   PROJECT CONTROLLER
   Full CRUD for portfolio projects.
   - GET    /api/projects        → public list (sorted newest first)
   - POST   /api/projects        → admin only (auth middleware)
   - PUT    /api/projects/:id    → admin only
   - DELETE /api/projects/:id    → admin only

   IMAGES
   When Cloudinary is configured, an uploaded file is stored in
   Cloudinary and its secure URL is saved here.  The Cloudinary
   public_id travels with the URL so we can optionally delete the
   image when a project is replaced or removed.
   ============================================================ */
const Project = require('../models/Project');
const { cloudinary, cloudinaryEnabled } = require('../middleware/uploadMiddleware');

// Read the tech stack list from a comma-separated string
const parseTechStack = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// Is this a Cloudinary-hosted image we own (i.e. can delete)?
function isCloudinaryUrl(url) {
  return typeof url === 'string' && /res\.cloudinary\.com\//.test(url);
}

// Turn a Cloudinary URL into its public_id so cloudinary.uploader
// can destroy it. Our uploads never add transformations, so the
// public_id is simply the path after "/upload/" with the version
// segment (v<digits>) and file extension removed:
//   .../upload/v123/portfolio/project-1.jpg  → "portfolio/project-1"
function publicIdFromUrl(url) {
  if (!isCloudinaryUrl(url)) return null;
  const afterUpload = url.split('/upload/')[1] || url;
  const id = afterUpload
    .split('/')
    .filter((part) => !/^v\d+$/.test(part)) // drop v<digits> version
    .join('/');
  return id.replace(/\.[a-z0-9]+$/i, ''); // drop file extension
}

// Best-effort delete of a Cloudinary image. Never throws — we don't
// want deleting a project to fail just because a thumbnail was gone.
async function deleteStoredImage(imageUrl) {
  if (!cloudinaryEnabled) return;
  const publicId = publicIdFromUrl(imageUrl);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn('⚠️ Could not delete Cloudinary image:', publicId, error.message);
  }
}

// GET all projects (public)
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Decide what to store as `image`:
//  - if a file was uploaded and Cloudinary is on → use its secure URL
//  - if a file was uploaded but Cloudinary is off → throw (graceful msg)
//  - otherwise → the image URL typed by the user
function resolveNewImage(req) {
  if (req.file) {
    if (cloudinaryEnabled) {
      // multer-storage-cloudinary sets req.file.path = secure_url
      return String(req.file.path || '').trim();
    }
    // Cloudinary not configured: fall back to the URL field, or error.
    const fallback = String(req.body.image || '').trim();
    if (!fallback) {
      const err = new Error(
        'Image uploads need Cloudinary configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Please paste an image URL instead.'
      );
      err.status = 400;
      throw err;
    }
    return fallback;
  }
  return String(req.body.image || '').trim();
}

// POST a new project (admin)
exports.createProject = async (req, res) => {
  try {
    const image = resolveNewImage(req);

    const project = await Project.create({
      title: req.body.title,
      description: req.body.description,
      image,
      techStack: parseTechStack(req.body.techStack),
      liveLink: req.body.liveLink,
      githubLink: req.body.githubLink
    });

    res.status(201).json({ message: 'Project created.', project });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// PUT — update an existing project (admin)
exports.updateProject = async (req, res) => {
  try {
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    // New image = the uploaded file (Cloudinary URL), else the typed URL,
    // else keep the existing image.
    let image;
    if (req.file) {
      image = resolveNewImage(req);
    } else {
      image = String(req.body.image || existing.image || '').trim();
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        image,
        techStack: parseTechStack(req.body.techStack),
        liveLink: req.body.liveLink,
        githubLink: req.body.githubLink
      },
      { new: true }
    );

    // If we replaced the old image, clean up the previous Cloudinary file.
    if (image && image !== existing.image) {
      await deleteStoredImage(existing.image);
    }

    res.json({ message: 'Project updated.', project: updated });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// DELETE a project (admin)
exports.deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Project not found.' });

    // Best-effort cleanup of the project's Cloudinary image.
    await deleteStoredImage(deleted.image);

    res.json({ message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
