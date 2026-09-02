/* ============================================================
   ADMIN MODEL
   Stores the admin account. The password is kept as a bcrypt
   hash — never stored as plain text.
   The account is created automatically from backend/.env on
   the first server start (see server.js -> ensureAdmin).
============================================================ */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Compare a typed password against the stored hash
adminSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Admin', adminSchema);