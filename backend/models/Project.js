/* ============================================================
   PROJECT MODEL
   One document per portfolio project. `techStack` is a list of
   technologies, `image` can be a URL or an /uploads/… path.
============================================================ */
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    techStack: {
      type: [String],
      default: []
    },
    liveLink: {
      type: String,
      default: ''
    },
    githubLink: {
      type: String,
      default: ''
    }
  },
  // Adds createdAt / updatedAt automatically
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);