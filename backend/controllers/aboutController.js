/* ============================================================
   ABOUT CONTROLLER
   - GET /api/about   → the single About document (public)
   - PUT /api/about   → upsert it (admin only)
   An "upsert" creates the document if it doesn't exist yet.
============================================================ */
const About = require('../models/About');

// GET the about document (create a default one if missing)
exports.getAbout = async (req, res) => {
  try {
    let about = await About.findOne();
    if (!about) {
      about = await About.create({
        greeting: "Hi, I'm",
        name: 'Saba Zulfiqar',
        headline: 'MERN Stack Developer | Building Modern Web Applications',
        contact: {}
      });
    }
    res.json(about);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT — replace the about content (admin)
exports.updateAbout = async (req, res) => {
  try {
    const update = {
      greeting: req.body.greeting,
      name: req.body.name,
      headline: req.body.headline,
      description: req.body.description,
      bioTitle: req.body.bioTitle,
      bioParagraphs: req.body.bioParagraphs || [],
      contact: req.body.contact || {}
    };

    // upsert: true → update if exists, create if not
    const about = await About.findOneAndUpdate({}, update, {
      upsert: true,
      new: true
    });

    res.json({ message: 'About info saved.', about });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};