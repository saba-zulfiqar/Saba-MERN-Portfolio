/* ============================================================
   CONTACT CONTROLLER
   Handles POST /api/contact — takes the visitor's name, email
   and message, then emails them to your inbox using Nodemailer
   + Gmail SMTP. In addition, a copy of each message is saved to
   MongoDB so nothing is lost if the email service is down.
============================================================ */
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');

// Escape plain text for safe inclusion in an HTML email body
function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Build the Gmail transport once (reused for every request).
// EMAIL_USER / EMAIL_PASS come from backend/.env.
// EMAIL_PASS must be a Gmail "App Password", NOT your normal
// Gmail password — see README.md for how to generate one.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // 465 → implicit TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST /api/contact  { name, email, message }
exports.sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    /* ---------- 1. Validation ---------- */
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your name.' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Please write a message.' });
    }

    // Basic email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'That email address does not look valid.' });
    }

    // Keep the values tidy and guard against absurdly long input
    const cleanName = String(name).trim().slice(0, 100);
    const cleanEmail = String(email).trim().slice(0, 200);
    const cleanMessage = String(message).trim().slice(0, 5000);

    // Where should the email be delivered? Default: your inbox (EMAIL_USER)
    const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

    /* ---------- 2. Send the email ---------- */
    const mailOptions = {
      from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
      to,                                  // your inbox: sabazulfiqar926@gmail.com
      replyTo: cleanEmail,                 // so you can hit Reply and answer the visitor
      subject: `New message from ${cleanName} (Portfolio Contact Form)`,
      text: [
        `Name: ${cleanName}`,
        `Email: ${cleanEmail}`,
        '',
        'Message:',
        cleanMessage
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0891b2;">New message from your portfolio</h2>
          <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></p>
          <hr>
          <p style="white-space: pre-wrap;">${escapeHtml(cleanMessage)}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    /* ---------- 3. Save a copy in MongoDB ---------- */
    await ContactMessage.create({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! I\'ll get back to you soon.'
    });
  } catch (error) {
    // Be friendly to the visitor, but log the real reason server-side
    console.error('❌ Contact email failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Could not send your message right now. Please email me directly at sabazulfiqar926@gmail.com.'
    });
  }
}