const pool = require('../models/db');

// GET /api/likes - get current like count
const getLikes = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT total FROM likes WHERE id = 1');
    const total = rows.length ? rows[0].total : 0;
    res.json({ total });
  } catch (err) {
    console.error('DB Error (getLikes):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/likes - increment like count
const addLike = async (req, res) => {
  try {
    await pool.execute(
      'INSERT INTO likes (id, total) VALUES (1, 1) ON DUPLICATE KEY UPDATE total = total + 1'
    );
    const [rows] = await pool.execute('SELECT total FROM likes WHERE id = 1');
    res.status(201).json({ success: true, total: rows[0].total });
  } catch (err) {
    console.error('DB Error (addLike):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getLikes, addLike };
