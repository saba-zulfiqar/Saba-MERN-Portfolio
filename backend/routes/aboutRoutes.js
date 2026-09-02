/* ============================================================
   ABOUT ROUTES
   GET is public. PUT (admin) saves the editable bio/contact.
============================================================ */
const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', aboutController.getAbout);
router.put('/', authMiddleware, aboutController.updateAbout);

module.exports = router;