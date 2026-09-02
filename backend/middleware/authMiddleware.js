/* ============================================================
   AUTH MIDDLEWARE
   Protects routes that must only be usable by the admin.
   Expects a JWT in the "Authorization: Bearer <token>" header.
   The token is issued by POST /api/auth/login.
============================================================ */
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  // No header, or the wrong format → not authorized
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized — token missing.' });
  }

  const token = header.split(' ')[1];

  try {
    // Verify the signature + expiry, then attach the payload to req.admin
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
  }
};