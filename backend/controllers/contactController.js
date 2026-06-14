const pool = require('../models/db');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact
const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES ($1,$2,$3,$4) RETURNING id',
      [name, email, subject || 'General Inquiry', message]
    );
    res.status(201).json({
      success: true,
      message: "Message received! I'll get back to you soon.",
      id: rows[0].id
    });
  } catch (err) {
    console.error('DB Error (contact):', err.message);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

// GET /api/contact
const getContacts = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('DB Error (getContacts):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { submitContact, getContacts };
