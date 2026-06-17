# Redesign Change Log — Portfolio SPA

## What changed (frontend only)

**`frontend/style.css`** — full rewrite. New design system:
- Alternating dark/light panels per section (Home/Work/Contact = dark "ink"; About/Feedback = light "paper"), instead of one flat dark page. Mirrors the rhythm in the reference screenshots.
- One consistent blue accent (tuned slightly differently for ink vs. paper backgrounds so it stays readable on both) instead of the old violet/mint pair — matches the single accent dot used throughout the reference designs.
- Nav pill restyled as a light glass pill with a small accent dot marking the active tab, so it reads the same way over every section regardless of that section's background.
- New components: hero code-editor panel, hero floating teaser card, About "stat" blocks, gold "Featured" badge for projects.
- Same three font families as before (Space Grotesk / Inter / JetBrains Mono) — reused deliberately so the redesign costs nothing extra to load.

**`frontend/index.html`** — restructured, same five sections/IDs as before (`#home #about #projects #feedback #contact`) so nothing that links to them breaks:
- **Home:** removed the old photo hero-card. In its place: a tighter headline, and a small code‑editor visual with a live typewriter line — a developer's "about me" moment without putting your photo on the homepage banner, per your image rule. A floating glass card (no photo) carries the "open to work" status, an "About me" link, the LinkedIn link, and the existing like button.
- **About:** this is the *only* place your photo appears, and it's small (92px circle) inside the existing about-card, same as before — just restyled. Added a slash-style "/ about" label, a tag row, and a row of three real stat numbers (projects shipped, tools in the stack, availability) computed live from data already on the page — not invented figures.
- **Work (Projects):** same grid/filter/slider logic, restyled on a dark panel; "Featured" badge is now gold instead of violet.
- **Feedback / Contact:** same forms and fields, restyled on alternating panels.
- Removed the redundant second "I build with modern tools…" paragraph and shortened the hero copy — less repetition, faster to scan.
- `about.html`, `projects.html`, `comments.html`, `contact.html` are untouched — they still redirect to `index.html#about` etc., so any old bookmarks/links keep working.

**`frontend/app.js`** — additive only, no existing function rewritten or removed:
- Added `initHeroTypewriter()` for the hero panel's status line (decorative, no API calls).
- `initClock()` now also renders a date next to the footer time.
- Added a small `setStat()` helper, called from inside the existing `loadProjects()`/`initSkills()` callbacks to display the real counts already being fetched.
- Every existing function (`initLikes`, `initProjects`, `initComments`, `initContactForm`, etc.), every `fetch()` call, every endpoint, and every element ID it depends on is unchanged.

**`README.md`** — corrected step 3, which still referred to the old multi-page structure (`API_BASE` in every `.html` file). It now correctly says `API_BASE` only lives in `frontend/app.js`.

## What did not change
- `backend/` — zero edits. Routes, controllers, schema, server.js, CORS config, all untouched.
- `frontend/_redirects` — unchanged (API proxy + SPA fallback rules).
- `frontend/assets/` — unchanged (résumé PDF, project screenshots).
- API base URL, all endpoint paths and payloads (`/api/likes`, `/api/projects`, `/api/comments`, `/api/contact`).
- WhatsApp (`wa.me/923234567863`), LinkedIn, GitHub, Instagram, email links — same URLs in the same places (hero card, About, Contact, footer).
- Tech stack — still plain HTML/CSS/vanilla JS, no build step, no framework.

## Notes on the brief's "preview vs. detail" behavior
The site stays a true single page (no reloads, nav scrolls to in-page sections — this was already true before this pass). Rather than building a separate "teaser" view and a separate "detail" view for each section, each section itself is kept short and scannable (one paragraph, a tag row, a stat row for About; a compact card grid for Work, etc.) — clicking a nav tab jumps straight to that concise, complete section. Building a second duplicate "summary" layer on top would have meant maintaining two copies of the same content and added real risk of breaking the existing scroll/active-state logic for no real benefit on a portfolio this size.


---

## v2 update — responsive + scroll animations + new palette

- **Palette swap:** background `#1A1C18`, accent olive `#7C8B72`, highlight sand `#C9A227`, text `#EAE7DC` — replaced the previous ink/blue tokens throughout `style.css` (nav, buttons, badges, stat numbers, dots, code-window syntax accents, alerts left as semantic green/red).
- **Responsive hardening:** added an `html { overflow-x: hidden }` safety net alongside the existing `body` rule, a sub‑400px breakpoint (single-column grids, tighter container padding), and capped the new slide-in distance to 22px on phones/tablets — verified zero horizontal overflow at iPhone‑12 width (390×844) across every section via an automated check.
- **Scroll animations added** (all IntersectionObserver-driven, not autoplay): directional slide‑in (`data-reveal="left|right|scale"`) on the About card/body, both Feedback panels, both Contact panels, and alternating left/right on each project card; a word‑by‑word "split text" reveal on every section heading; a subtle scroll-linked parallax drift on the hero code window (desktop only, skipped for touch devices and `prefers-reduced-motion`).
- Fixed a layout bug introduced mid-pass where the split-text helper briefly set heading `display: inline`, which collapsed the eyebrow label and heading onto one line — caught via screenshot QA before packaging.

