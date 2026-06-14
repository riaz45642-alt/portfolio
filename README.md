# Muhammad Ahmad — Portfolio Website

A full-stack personal portfolio website built with HTML/CSS/JS (frontend) and Node.js + Express + MySQL (backend).

## 📁 Project Structure

```
portfolio/
├── frontend/             # All HTML, CSS, JS files
│   ├── index.html        # Homepage (Like system)
│   ├── about.html         # About Me page (Resume PDF viewer)
│   ├── projects.html      # Projects showcase
│   ├── comments.html      # Unified Comments & Feedback system
│   ├── contact.html       # Contact page (WhatsApp + Email)
│   ├── style1.css         # Shared dark theme styles
│   └── assets/
│       └── Muhammad_Ahmad_Resume.pdf
│
└── backend/              # Node.js + Express API
    ├── server.js          # Main entry point
    ├── .env.example       # Environment config template (copy to .env)
    ├── package.json
    ├── routes/
    │   ├── projectRoutes.js
    │   ├── likeRoutes.js
    │   └── commentRoutes.js
    ├── controllers/
    │   ├── projectController.js
    │   ├── likeController.js
    │   └── commentController.js
    └── models/
        ├── db.js          # MySQL connection pool
        └── schema.sql      # Database setup script
```

## 🚀 Quick Start

### 1. Set up the database

```bash
mysql -u root -p < backend/models/schema.sql
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Install dependencies and start

```bash
cd backend
npm install
npm run dev      # Development (with nodemon)
# or
npm start        # Production
```

### 4. Open in browser

Visit: `http://localhost:5000`

## 🖼️ Projects & Image Slider

Each project supports an `images` array (2–3 screenshots). On `projects.html`, these auto-rotate every 3.5 seconds and fully cover the project thumbnail area, with details shown below. To use real screenshots, place files under `frontend/assets/projects/` and reference them in the `images` array (or the `images` JSON column in the `projects` table).

## ❤️ Like System

The homepage has a clickable Like button. Each visitor can like the portfolio once (tracked via `localStorage`). The like counter starts at **0** and is stored in the `likes` table, persisting across visits and deployments.

## 💬 Comments System

`comments.html` provides a unified feedback/comments page where visitors can:
- Submit a comment with Name, Company (optional), Email, and Message
- View all comments publicly, sorted newest first
- Reply to any top-level comment (nested replies)
- Like / appreciate any comment or reply

All comments and replies are stored in the `comments` table (self-referencing via `parent_id`).

## 📞 Contact

The contact form on `contact.html` sends messages directly via **WhatsApp** (wa.me link) to +92 323 4567863. Email (`ahmad.r.27@gmail.com`) and social links (GitHub, LinkedIn, Instagram, WhatsApp) are also available and fully functional. No backend call is required for the contact form — it works on static hosting too.

## 🔗 API Endpoints

| Method | Endpoint                | Description                          |
|--------|------------------------|---------------------------------------|
| GET    | /api/health            | Health check                          |
| GET    | /api/projects          | Fetch all projects                    |
| GET    | /api/projects?category=frontend | Filter projects by category   |
| POST   | /api/projects          | Add a new project                     |
| GET    | /api/likes             | Get current like count                |
| POST   | /api/likes             | Increment like count                  |
| GET    | /api/comments          | Get all comments (with nested replies)|
| POST   | /api/comments          | Add a comment or reply (with `parent_id`) |
| POST   | /api/comments/:id/like | Like/appreciate a comment              |

## 📋 Tech Stack

**Frontend:** HTML5, CSS3, JavaScript, Font Awesome, Google Fonts  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Other:** CORS, dotenv
