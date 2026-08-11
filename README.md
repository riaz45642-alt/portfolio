# Ahmad Portfolio — Deploy Guide

## Structure
```
repository root/
├── backend/    → Render pe deploy hoga
└── frontend/   → Cloudflare Pages ka static output directory
```

---

## STEP 1 — Supabase Database Setup

1. https://supabase.com par jao → New Project banao
2. Project ban jaye to **SQL Editor** open karo
3. `backend/models/schema.sql` ka poora content paste karo → Run karo
4. **Settings > Database > Connection String** se `postgresql://...` URL copy karo

---

## STEP 2 — Render Backend Deploy

1. https://render.com par jao → New Web Service
2. GitHub repo connect karo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node

4. **Environment Variables** add karo:
   ```
   DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   FRONTEND_URL = https://your-portfolio.pages.dev
   PORT         = 5000
   ```

5. Deploy karo — URL note karo (e.g. `https://ahmad-portfolio.onrender.com`)

---

## STEP 3 — Frontend mein Render URL daalo

Render URL milne ke baad **`frontend/app.js`** ke top par yeh line update karo:

```javascript
const API_BASE = 'https://ahmad-portfolio-api.onrender.com/api';
//                         ↑ apna actual Render URL daalo
```

The site is a single-page app now — `app.js` is the only file with `API_BASE` in it (`index.html` has all the sections; `about.html` / `projects.html` / `comments.html` / `contact.html` just redirect into `index.html#section` for old bookmarks/links).

Aur `frontend/_redirects` mein bhi:
```
/api/*  https://ahmad-portfolio-api.onrender.com/api/:splat  200
```

---

## STEP 4 — Cloudflare Pages Deploy

1. https://pages.cloudflare.com par jao → New Project
2. GitHub repo connect karo
3. Settings:
   - **Production Branch:** `main`
   - **Framework Preset:** `None`
   - **Root Directory:** (khali chhoro — repository root)
   - **Build Command:** (khali chhoro)
   - **Build Output Directory:** `frontend`

4. Deploy karo

> Important: Root Directory mein `portfolio-main/frontend` mat likho. Cloudflare
> repository ko pehle hi `/opt/buildhome/repo` mein checkout karta hai, is liye
> deployable site ka path sirf `frontend` hai. Agar existing project mein
> `portfolio-main/frontend` configured hai, **Settings → Builds & deployments**
> mein Root Directory clear karo aur Build Output Directory `frontend` set karo,
> phir deployment retry karo.

---

## STEP 5 — Test karo

Browser mein open karo:
- `https://ahmad-portfolio-api.onrender.com/api/health` → `{"status":"OK"}` aana chahiye
- `https://your-portfolio.pages.dev` → frontend kaam karna chahiye

---

## Changes Summary (MySQL → PostgreSQL)

| File | Kya badla |
|------|-----------|
| `backend/models/db.js` | `mysql2` hata ke `pg` Pool lagaya |
| `backend/package.json` | `mysql2` hata ke `pg` lagaya |
| `backend/models/schema.sql` | MySQL syntax → PostgreSQL syntax |
| `backend/controllers/*.js` | `pool.execute()` → `pool.query()`, `?` → `$1,$2...` |
| `backend/server.js` | Proper CORS, static serve hata diya |
| `frontend/*.html` | `API_BASE` → Render URL |
| `frontend/_redirects` | Cloudflare proxy rules |
