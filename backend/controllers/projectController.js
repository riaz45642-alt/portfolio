const pool = require('../models/db');

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { category } = req.query;
    let query  = 'SELECT * FROM projects ORDER BY created_at DESC';
    let params = [];

    if (category && category !== 'all') {
      query  = 'SELECT * FROM projects WHERE category = $1 ORDER BY created_at DESC';
      params = [category];
    }

    const { rows } = await pool.query(query, params);

    const projects = rows.map(p => ({
      ...p,
      tags:   Array.isArray(p.tags)   ? p.tags   : JSON.parse(p.tags   || '[]'),
      images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]')
    }));

    res.json(projects);
  } catch (err) {
    console.error('DB Error (getProjects):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

// POST /api/projects
const addProject = async (req, res) => {
  const { title, description, tags, images, category, icon, github, demo, featured } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO projects (title, description, tags, images, category, icon, github, demo, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        title, description,
        JSON.stringify(tags   || []),
        JSON.stringify(images || []),
        title || 'Job Potal & Combined CV Generator',
        description || 'A fully responsive job portal built with Node.js, TiDB Cloud, Firebase Authentication, and Cloudflare Pages — featuring Job Seeker and Employer dashboards with an integrated CV generator.',
        category || 'frontend',
        icon     || 'fas fa-code',
        github   || '#',
        demo     || '#',
        featured || false
      ]
    );
    res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('DB Error (addProject):', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { getProjects, addProject };
