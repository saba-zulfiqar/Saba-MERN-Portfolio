/* ============================================================
   AUTH ROUTES
   - POST /api/auth/login   → public
   - GET  /api/auth/verify  → protected (checks a stored token)
============================================================ */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/verify', authMiddleware, authController.verify);

module.exports = router;