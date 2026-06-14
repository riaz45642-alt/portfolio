const pool = require('../models/db');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Normalize a row so dates are ISO strings and replies always exist
const normalize = (row) => ({
  ...row,
  created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  replies: row.replies || []
});

// GET /api/comments - get all comments structured with nested replies
const getComments = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM comments ORDER BY created_at ASC');

    const byId = {};
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

    // Newest top-level comments first, replies stay chronological
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

// POST /api/comments - submit a new comment (or reply if parent_id is provided)
const addComment = async (req, res) => {
  const { name, company, email, message, parent_id } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO comments (parent_id, name, company, email, message) VALUES (?, ?, ?, ?, ?)',
      [parent_id || null, name, company || null, email, message]
    );

    const [rows] = await pool.execute('SELECT * FROM comments WHERE id = ?', [result.insertId]);

    if (!rows.length) {
      return res.status(500).json({ error: 'Comment was created but could not be retrieved.' });
    }

    const comment = normalize(rows[0]);

    res.status(201).json({ success: true, comment });
  } catch (err) {
    console.error('DB Error (addComment):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/comments/:id/like - like/appreciate a comment
const likeComment = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE comments SET likes = likes + 1 WHERE id = ?', [id]);
    const [rows] = await pool.execute('SELECT likes FROM comments WHERE id = ?', [id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    res.json({ success: true, likes: rows[0].likes });
  } catch (err) {
    console.error('DB Error (likeComment):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getComments, addComment, likeComment };
