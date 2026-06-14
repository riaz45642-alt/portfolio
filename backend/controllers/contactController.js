const pool = require('../models/db');

// POST /api/contact
const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || 'General Inquiry', message]
    );
    res.status(201).json({
      success: true,
      message: 'Message received! I will get back to you soon.',
      id: result.insertId
    });
  } catch (err) {
    console.error('DB Error (contact):', err.message);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

// GET /api/contact (admin - get all messages)
const getContacts = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('DB Error (getContacts):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { submitContact, getContacts };
