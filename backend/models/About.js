/* ============================================================
   ABOUT MODEL
   A single document holding all editable text for the public
   site: hero, bio, and contact info. The admin dashboard
   updates it via PUT /api/about.
============================================================ */
const mongoose = require('mongoose');

// Nested sub-schema for the contact details
const contactSchema = new mongoose.Schema(
  {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    location: { type: String, default: '' }
  },
  { _id: false }
);

const aboutSchema = new mongoose.Schema(
  {
    greeting: { type: String, default: "Hi, I'm" },
    name: { type: String, default: 'Saba Zulfiqar' },
    // Typing headline(s), phrases separated by " | "
    headline: { type: String, default: 'MERN Stack Developer | Building Modern Web Applications' },
    description: { type: String, default: '' },
    bioTitle: { type: String, default: '' },
    bioParagraphs: { type: [String], default: [] },
    contact: {
      type: contactSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('About', aboutSchema);