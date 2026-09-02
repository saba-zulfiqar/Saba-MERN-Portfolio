/* ============================================================
   CONTACT MESSAGE MODEL
   Stores one document per contact-form submission. Used to
   keep a backup of messages even if the email fails to send.
============================================================ */
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);