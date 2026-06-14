const pool = require('../models/db');

// GET /api/likes
const getLikes = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT total FROM likes WHERE id = 1');
    res.json({ total: rows.length ? rows[0].total : 0 });
  } catch (err) {
    console.error('DB Error (getLikes):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/likes
const addLike = async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO likes (id, total) VALUES (1, 1)
       ON CONFLICT (id) DO UPDATE SET total = likes.total + 1`
    );
    const { rows } = await pool.query('SELECT total FROM likes WHERE id = 1');
    res.status(201).json({ success: true, total: rows[0].total });
  } catch (err) {
    console.error('DB Error (addLike):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getLikes, addLike };
