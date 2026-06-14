-- Run this SQL to set up your database
CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  tags JSON,
  images JSON,
  category ENUM('frontend', 'fullstack', 'design') DEFAULT 'frontend',
  icon VARCHAR(100) DEFAULT 'fas fa-code',
  github VARCHAR(300),
  demo VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial projects (images: 2-3 screenshot URLs/paths per project,
-- shown as an auto-rotating slider on the Projects page)
INSERT INTO projects (title, description, tags, images, category, icon, github, demo) VALUES
('Portfolio Website', 'A fully responsive personal portfolio with dark theme, animations, and multi-page navigation.', '["HTML","CSS","JavaScript"]', '["assets/projects/portfolio-1.jpg","assets/projects/portfolio-2.jpg"]', 'frontend', 'fas fa-user-circle', 'https://github.com', '#'),
('E-Commerce Landing Page', 'Modern e-commerce landing page with product cards, filters, and cart preview.', '["HTML","CSS","JS"]', '["assets/projects/ecommerce-1.jpg","assets/projects/ecommerce-2.jpg"]', 'frontend', 'fas fa-shopping-cart', 'https://github.com', '#'),
('Task Manager App', 'Full-stack task management with user auth, CRUD operations, and a clean dashboard.', '["React","Node.js","MySQL"]', '["assets/projects/taskmanager-1.jpg","assets/projects/taskmanager-2.jpg","assets/projects/taskmanager-3.jpg"]', 'fullstack', 'fas fa-tasks', 'https://github.com', '#'),
('Blog CMS', 'Content management system with rich text editor, image uploads, and admin panel.', '["Node.js","Express","MySQL"]', '["assets/projects/blogcms-1.jpg","assets/projects/blogcms-2.jpg"]', 'fullstack', 'fas fa-blog', 'https://github.com', '#'),
('Dashboard UI Kit', 'Admin dashboard UI kit with charts, tables, cards, and dark/light theme toggle.', '["Figma","CSS","React"]', '["assets/projects/dashboard-1.jpg","assets/projects/dashboard-2.jpg"]', 'design', 'fas fa-chart-bar', 'https://github.com', '#'),
('Weather App', 'Real-time weather app with location detection and 5-day forecast.', '["JavaScript","API","CSS"]', '["assets/projects/weather-1.jpg","assets/projects/weather-2.jpg"]', 'frontend', 'fas fa-cloud-sun', 'https://github.com', '#');

-- ===== LIKES SYSTEM =====
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  total INT NOT NULL DEFAULT 0
);

-- Initialize like counter at 0
INSERT INTO likes (id, total)
SELECT 1, 0 FROM (SELECT 1) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM likes WHERE id = 1);

-- ===== COMMENTS SYSTEM =====
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(150) DEFAULT NULL,
  email VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  likes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);
