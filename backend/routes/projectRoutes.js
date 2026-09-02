/* ============================================================
   PROJECT ROUTES
   GET is public. Everything that changes data (POST/PUT/DELETE)
   requires a valid admin JWT.
============================================================ */
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public
router.get('/', projectController.getProjects);

// Admin-only (multer parses multipart forms + optional image file)
router.post('/', authMiddleware, upload.single('image-file'), projectController.createProject);
router.put('/:id', authMiddleware, upload.single('image-file'), projectController.updateProject);
router.delete('/:id', authMiddleware, projectController.deleteProject);

module.exports = router;