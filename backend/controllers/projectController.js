const pool = require('../models/db');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM projects ORDER BY created_at DESC';
    let params = [];

    if (category && category !== 'all') {
      query = 'SELECT * FROM projects WHERE category = ? ORDER BY created_at DESC';
      params = [category];
    }

    const [rows] = await pool.execute(query, params);

    // Parse JSON string columns to arrays
    const projects = rows.map(p => ({
      ...p,
      tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []),
      images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || [])
    }));

    res.json(projects);
  } catch (err) {
    console.error('DB Error (getProjects):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/projects (add new project)
const addProject = async (req, res) => {
  const { title, description, tags, images, category, icon, github, demo } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO projects (title, description, tags, images, category, icon, github, demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, JSON.stringify(tags || []), JSON.stringify(images || []), category || 'frontend', icon || 'fas fa-code', github || '#', demo || '#']
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('DB Error (addProject):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getProjects, addProject };
