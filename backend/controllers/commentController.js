const pool = require('../models/db');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalize = (row) => ({
  ...row,
  created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  replies: row.replies || []
});

// GET /api/comments
const getComments = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM comments ORDER BY created_at ASC');

    const byId     = {};
    const topLevel = [];

    rows.forEach(row => {
      row.replies = [];
      byId[row.id] = row;
    });

    rows.forEach(row => {
      if (row.parent_id && byId[row.parent_id]) {
        byId[row.parent_id].replies.push(row);
      } else if (!row.parent_id) {
        topLevel.push(row);
      }
    });

    topLevel.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const result = topLevel.map(c => ({
      ...normalize(c),
      replies: (c.replies || []).map(normalize)
    }));

    res.json(result);
  } catch (err) {
    console.error('DB Error (getComments):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/comments
const addComment = async (req, res) => {
  const { name, company, email, message, parent_id } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const { rows: inserted } = await pool.query(
      'INSERT INTO comments (parent_id, name, company, email, message) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [parent_id || null, name, company || null, email, message]
    );
    res.status(201).json({ success: true, comment: normalize(inserted[0]) });
  } catch (err) {
    console.error('DB Error (addComment):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/comments/:id/like
const likeComment = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE comments SET likes = likes + 1 WHERE id = $1', [id]);
    const { rows } = await pool.query('SELECT likes FROM comments WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Comment not found.' });
    res.json({ success: true, likes: rows[0].likes });
  } catch (err) {
    console.error('DB Error (likeComment):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getComments, addComment, likeComment };
