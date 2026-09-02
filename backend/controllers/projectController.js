/* ============================================================
   PROJECT CONTROLLER
   Full CRUD for portfolio projects.
   - GET    /api/projects        → public list (sorted newest first)
   - POST   /api/projects        → admin only (auth middleware)
   - PUT    /api/projects/:id    → admin only
   - DELETE /api/projects/:id    → admin only
============================================================ */
const Project = require('../models/Project');

// Read the tech stack list from a comma-separated string
const parseTechStack = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// GET all projects (public)
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST a new project (admin)
exports.createProject = async (req, res) => {
  try {
    // Vercel's filesystem is read-only — disk uploads can't persist.
    // The admin dashboard has an "Image URL" field; users should paste
    // a public URL (imgur, Cloudinary, etc.) instead.
    if (req.file && process.env.VERCEL) {
      return res.status(400).json({
        message: 'File uploads are not supported on Vercel. Please use an image URL instead.'
      });
    }

    // Prefer an uploaded file; otherwise use the image URL passed in the form
    const image = req.file
      ? '/uploads/' + req.file.filename
      : String(req.body.image || '').trim();

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
    res.status(500).json({ message: error.message });
  }
};

// PUT — update an existing project (admin)
exports.updateProject = async (req, res) => {
  try {
    // Vercel: reject disk file uploads — use image URL instead
    if (req.file && process.env.VERCEL) {
      return res.status(400).json({
        message: 'File uploads are not supported on Vercel. Please use an image URL instead.'
      });
    }

    // Keep the existing image unless a new one was uploaded or a URL given
    const existing = await Project.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Project not found.' });

    const image = req.file
      ? '/uploads/' + req.file.filename
      : String(req.body.image || existing.image || '').trim();

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

    res.json({ message: 'Project updated.', project: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a project (admin)
exports.deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};