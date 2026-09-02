/* ============================================================
   AUTH CONTROLLER
   - login: check username/password and issue a JWT
   - verify: confirm a provided token is still valid
============================================================ */
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// POST /api/auth/login  { username, password }  →  { token }
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username });

    // Same message for "no such user" and "wrong password" to avoid leaking info
    if (!admin || !(await admin.verifyPassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Sign a token that expires after 1 day
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/verify  (protected)  →  { valid: true }
exports.verify = (req, res) => {
  res.json({ valid: true, username: req.admin.username });
};