/* ============================================================
   SKILL CONTROLLER
   - GET    /api/skills      → public list
   - POST   /api/skills      → admin only
   - PUT    /api/skills/:id  → admin only
   - DELETE /api/skills/:id  → admin only
============================================================ */
const Skill = require('../models/Skill');

// GET all skills (public)
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort('createdAt');
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST a new skill (admin)
exports.createSkill = async (req, res) => {
  try {
    const skill = await Skill.create({
      name: req.body.name,
      icon: req.body.icon || 'fa-solid fa-code',
      percent: req.body.percent
    });
    res.status(201).json({ message: 'Skill added.', skill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT — update a skill (admin)
exports.updateSkill = async (req, res) => {
  try {
    const updated = await Skill.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        icon: req.body.icon,
        percent: req.body.percent
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Skill not found.' });
    res.json({ message: 'Skill updated.', skill: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE a skill (admin)
exports.deleteSkill = async (req, res) => {
  try {
    const deleted = await Skill.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Skill not found.' });
    res.json({ message: 'Skill deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};