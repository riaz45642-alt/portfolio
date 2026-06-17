-- =============================================
-- Supabase (PostgreSQL) Schema
-- Supabase SQL Editor mein yeh poora paste karo
-- =============================================

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  tags        JSONB        DEFAULT '[]',
  images      JSONB        DEFAULT '[]',
  category    VARCHAR(50)  DEFAULT 'frontend',
  icon        VARCHAR(100) DEFAULT 'fas fa-code',
  github      VARCHAR(300),
  demo        VARCHAR(300),
  featured    BOOLEAN      DEFAULT FALSE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Seed projects
INSERT INTO projects (title, description, tags, images, category, icon, github, demo, featured) VALUES
(
  'Job Portal & CV Generator',
  'A fully responsive job portal built with Node.js, TiDB Cloud, Firebase Authentication',
    '["Node.js", "TiDB Cloud", "Firebase Authentication", "Cloudflare Pages"]',
    '["https://res.cloudinary.com/dzj6dhnqe/image/upload/v1700000000/portfolio/job-portal-1.png", "https://res.cloudinary.com/dzj6dhnqe/image/upload/v1700000000/portfolio/job-portal-2.png"]',
  'frontend',
  'fas fa-briefcase',
  'https://github.com/riaz45642-alt',
  'https://talentbridge-2o9.pages.dev',
  TRUE
);

-- LIKES TABLE
CREATE TABLE IF NOT EXISTS likes (
  id    INT PRIMARY KEY DEFAULT 1,
  total INT NOT NULL DEFAULT 0
);

INSERT INTO likes (id, total)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  parent_id  INT          REFERENCES comments(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  company    VARCHAR(150),
  email      VARCHAR(150) NOT NULL,
  message    TEXT         NOT NULL,
  likes      INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  subject    VARCHAR(200) DEFAULT 'General Inquiry',
  message    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);
