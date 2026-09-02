/* ============================================================
   SKILL MODEL
   One document per skill. `icon` is a Font Awesome class
   string (e.g. "fa-brands fa-react"), `percent` drives the
   animated progress bar on the public site.
============================================================ */
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true
    },
    icon: {
      type: String,
      default: 'fa-solid fa-code'
    },
    percent: {
      type: Number,
      required: [true, 'Skill percentage is required'],
      min: 1,
      max: 100,
      default: 50
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', skillSchema);