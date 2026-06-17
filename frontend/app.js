/* ====================================================================
   Muhammad Ahmad — Portfolio (SPA)
   Same backend, same endpoints, same payloads as the original multi-page
   site. Only the frontend wiring changed: one page, one shared nav,
   smooth in-page scrolling instead of full reloads.
   ==================================================================== */

const API_BASE = 'https://ahmad-portfolio-api.onrender.com/api';
const WHATSAPP_NUMBER = '923234567863';
const LIKE_STORAGE_KEY = 'portfolio_liked';

/* ---------------------------------------------------------------
   Ambient cursor glow (desktop only, cheap, no layout thrash)
   --------------------------------------------------------------- */
(function ambientGlow() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const field = document.querySelector('.bg-field');
  if (!field) return;
  let ticking = false;
  window.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      field.style.setProperty('--mx', `${e.clientX}px`);
      field.style.setProperty('--my', `${e.clientY}px`);
      ticking = false;
    });
  });
})();

/* ---------------------------------------------------------------
   Scroll reveal (IntersectionObserver) — same idea as the old
   scroll-reveal.js, now also supports staggered children via
   the .stagger class.
   --------------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll('.scroll-reveal, .stagger, .split-text');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  targets.forEach((el) => observer.observe(el));
}
window.refreshScrollReveal = initScrollReveal;

/* ---------------------------------------------------------------
   Split-text: wraps each word of a heading in a masked span so it
   slides up into place, staggered, the first time it scrolls into
   view. Pure presentation — text content is untouched.
   --------------------------------------------------------------- */
function initSplitText() {
  document.querySelectorAll('.section-title').forEach((heading) => {
    const words = heading.textContent.trim().split(/\s+/);
    heading.innerHTML = words.map((w, i) =>
      `<span class="split-word-wrap"><span class="split-word" style="transition-delay:${i * 0.05}s">${w}</span></span>`
    ).join(' ');
    heading.classList.add('split-text');
  });
}

/* ---------------------------------------------------------------
   Subtle scroll-linked parallax on the hero code window — moves a
   few px slower than the page scroll for depth, desktop only,
   capped to the hero's own height so it never affects layout below.
   --------------------------------------------------------------- */
function initParallax() {
  const visual = document.querySelector('.hero-visual');
  if (!visual || window.matchMedia('(pointer: coarse)').matches) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(window.scrollY, window.innerHeight) * 0.08;
      visual.style.setProperty('--parallax', `${y}px`);
      ticking = false;
    });
  }, { passive: true });
}

/* ---------------------------------------------------------------
   Nav: mobile toggle, active-section highlighting, smooth offset
   --------------------------------------------------------------- */
function initNav() {
  const navWrap = document.querySelector('.nav-wrap');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections = [...links].map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  if (toggle) {
    toggle.addEventListener('click', () => navWrap.classList.toggle('menu-open'));
  }
  links.forEach((a) => a.addEventListener('click', () => navWrap.classList.remove('menu-open')));

  if (!sections.length) return;
  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach((s) => observer.observe(s));
}

/* ---------------------------------------------------------------
   Footer status bar: live local time + date
   --------------------------------------------------------------- */
function initClock() {
  const timeEl = document.getElementById('statusTime');
  const dateEl = document.getElementById('statusDate');
  if (!timeEl) return;
  const tick = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  };
  tick();
  setInterval(tick, 30000);
}

/* ---------------------------------------------------------------
   Hero typewriter: removed along with the old code-window panel.
   Function kept as a no-op so any external callers don't throw.
   --------------------------------------------------------------- */
function initHeroTypewriter() { /* removed — static value in HTML */ }

/* ---------------------------------------------------------------
   About stats: small, honest numbers pulled from data that's
   already loaded elsewhere on the page (no separate API calls,
   no invented figures).
   --------------------------------------------------------------- */
function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
setStat('statAvailability', 'OPEN');

/* ---------------------------------------------------------------
   Likes (GET /api/likes, POST /api/likes) — unchanged contract
   --------------------------------------------------------------- */
function initLikes() {
  const countEl = document.getElementById('likeCount');
  const likeBtn = document.getElementById('likeCard');
  if (!countEl || !likeBtn) return;

  async function loadLikes() {
    try {
      const res = await fetch(`${API_BASE}/likes`);
      if (!res.ok) throw new Error('API not available');
      const data = await res.json();
      countEl.textContent = data.total;
    } catch {
      countEl.textContent = '0';
    }
    if (localStorage.getItem(LIKE_STORAGE_KEY) === 'true') likeBtn.classList.add('liked');
  }

  async function sendLike() {
    if (localStorage.getItem(LIKE_STORAGE_KEY) === 'true') return;
    likeBtn.classList.add('liked');
    const current = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = current + 1; // optimistic
    try {
      const res = await fetch(`${API_BASE}/likes`, { method: 'POST' });
      if (!res.ok) throw new Error('API not available');
      const data = await res.json();
      countEl.textContent = data.total;
    } finally {
      localStorage.setItem(LIKE_STORAGE_KEY, 'true');
    }
  }

  likeBtn.addEventListener('click', sendLike);
  loadLikes();
}

/* ---------------------------------------------------------------
   Projects (GET /api/projects, fallback to seed data) — unchanged
   --------------------------------------------------------------- */
function initProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const fallbackProjects = [{
    id: 1,
    title: 'Job Portal & Combined CV Generator',
    description: 'A fully responsive job portal built with Node.js, TiDB Cloud, Firebase Authentication, and Cloudflare Pages — featuring Job Seeker and Employer dashboards with an integrated CV generator.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Firebase'],
    category: 'fullstack',
    featured: true,
    icon: 'fas fa-briefcase',
    github: 'https://github.com/riaz45642-alt',
    demo: 'https://talentbridge-2o9.pages.dev',
    images: ['assets/landingpage.png', 'assets/jobseekerpage.png', 'assets/employerpage.png', 'assets/cvgeneratorpage.png']
  }];

  let allProjects = [];
  let currentFilter = 'all';
  let sliderIntervals = [];

  function clearSliders() {
    sliderIntervals.forEach(clearInterval);
    sliderIntervals = [];
  }

  async function loadProjects() {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error('API not available');
      allProjects = await res.json();
      if (!allProjects.length) allProjects = fallbackProjects;
    } catch {
      allProjects = fallbackProjects;
    }
    setStat('statProjects', String(allProjects.length).padStart(3, '0'));
    renderProjects();
  }

  function initSlider(card) {
    const slides = card.querySelectorAll('.project-slide');
    const dots = card.querySelectorAll('.project-slider-dot');
    let current = 0;
    if (slides.length < 2) return;
    const interval = setInterval(() => {
      slides[current].style.opacity = '0';
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].style.opacity = '1';
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }, 3500);
    sliderIntervals.push(interval);
  }

  function renderProjects() {
    const filtered = currentFilter === 'all' ? allProjects : allProjects.filter((p) => p.category === currentFilter);
    clearSliders();

    if (!filtered.length) {
      grid.innerHTML = `<div class="loading-spinner"><i class="fas fa-folder-open" style="color:var(--accent);animation:none"></i>No projects in this category yet.</div>`;
      return;
    }

    grid.innerHTML = '';
    filtered.forEach((project, i) => {
      const images = project.images && project.images.length ? project.images : null;
      const card = document.createElement('div');
      card.className = 'project-card scroll-reveal';
      card.setAttribute('data-reveal', i % 2 === 0 ? 'left' : 'right');
      card.style.transitionDelay = `${i * 0.08}s`;

      let thumbInner;
      if (images) {
        const badge = project.featured ? `<span class="featured-badge">Featured</span>` : '';
        const slides = images.map((src, idx) => `<img src="${src}" class="project-slide${idx === 0 ? ' active' : ''}" alt="${project.title} screenshot ${idx + 1}" loading="lazy" style="width:100%;height:100%;object-fit:cover;${idx === 0 ? 'position:relative;' : 'position:absolute;top:0;left:0;'}opacity:${idx === 0 ? '1' : '0'};transition:opacity .7s ease;" />`).join('');
        const dots = images.length > 1 ? `<div class="project-slider-dots">${images.map((_, idx) => `<span class="project-slider-dot${idx === 0 ? ' active' : ''}"></span>`).join('')}</div>` : '';
        thumbInner = `${badge}<div class="project-slider" style="position:relative;width:100%;height:220px;">${slides}</div>${dots}`;
      } else {
        thumbInner = `<div style="display:flex;align-items:center;justify-content:center;height:220px;font-size:3em;color:var(--accent);"><i class="${project.icon || 'fas fa-code'}"></i></div>`;
      }

      card.innerHTML = `
        <div class="project-thumb">${thumbInner}</div>
        <div class="project-body">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
          <div class="project-tags">${(project.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}</div>
          <div class="project-links">
            <a href="${project.github || '#'}" class="btn-link secondary" target="_blank" rel="noopener"><i class="fab fa-github"></i> Code</a>
            <a href="${project.demo || '#'}" class="btn-link primary" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Live</a>
          </div>
        </div>`;
      grid.appendChild(card);
      if (images && images.length > 1) initSlider(card);
    });

    initScrollReveal();
  }

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });

  loadProjects();
}

/* ---------------------------------------------------------------
   Skills bars (static data, animated on reveal)
   --------------------------------------------------------------- */
function initSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  const skills = [
    { name: 'HTML5', level: 95 },
    { name: 'CSS3 / SCSS', level: 90 },
    { name: 'JavaScript', level: 82 },
    { name: 'React.js', level: 40 },
    { name: 'Git & GitHub', level: 78 },
    { name: 'Responsive Design', level: 92 }
  ];

  grid.innerHTML = skills.map((s) => `
    <div class="skill-card">
      <h4>${s.name} <span>${s.level}%</span></h4>
      <div class="skill-bar"><div class="skill-fill" data-width="${s.level}"></div></div>
    </div>`).join('');

  setStat('statStack', String(skills.length).padStart(3, '0'));

  const section = document.getElementById('about');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        grid.querySelectorAll('.skill-fill').forEach((el) => { el.style.width = `${el.dataset.width}%`; });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });
  if (section) observer.observe(section);
}

/* ---------------------------------------------------------------
   Comments (GET/POST /api/comments, POST /api/comments/:id/like)
   --------------------------------------------------------------- */
function initComments() {
  const list = document.getElementById('commentsList');
  if (!list) return;

  let allComments = [];

  const escapeHtml = (str) => { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; };
  const getInitials = (name) => (name || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const formatDate = (dateStr) => { const d = new Date(dateStr); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); };

  function showAlert(type, msg) {
    const success = document.getElementById('alertSuccess');
    const error = document.getElementById('alertError');
    if (type === 'success') {
      success.style.display = 'flex'; error.style.display = 'none';
      setTimeout(() => { success.style.display = 'none'; }, 4000);
    } else {
      document.getElementById('errorText').textContent = msg;
      error.style.display = 'flex'; success.style.display = 'none';
      setTimeout(() => { error.style.display = 'none'; }, 4000);
    }
  }

  function renderComment(comment, isReply = false) {
    const replies = (comment.replies || []).map((r) => renderComment(r, true)).join('');
    return `
      <div class="comment-card" data-id="${comment.id}">
        <div class="comment-header">
          <div class="comment-author">
            <div class="comment-avatar">${escapeHtml(getInitials(comment.name))}</div>
            <div class="comment-author-info">
              <h4>${escapeHtml(comment.name)}${comment.company ? ` <span>• ${escapeHtml(comment.company)}</span>` : ''}</h4>
              <span>${escapeHtml(comment.email)}</span>
            </div>
          </div>
          <div class="comment-date">${formatDate(comment.created_at)}</div>
        </div>
        <p class="comment-message">${escapeHtml(comment.message)}</p>
        <div class="comment-actions">
          <button class="comment-action-btn" onclick="window.__likeComment(${comment.id}, this)"><i class="far fa-thumbs-up"></i> <span>${comment.likes || 0}</span></button>
          ${!isReply ? `<button class="comment-action-btn" onclick="window.__toggleReply(${comment.id})"><i class="fas fa-reply"></i> Reply</button>` : ''}
        </div>
        ${!isReply ? `
        <div class="reply-form" id="reply-form-${comment.id}">
          <div class="form-row">
            <div class="form-group"><label>Name *</label><input type="text" id="replyName-${comment.id}" placeholder="Your name" /></div>
            <div class="form-group"><label>Company</label><input type="text" id="replyCompany-${comment.id}" placeholder="Optional" /></div>
          </div>
          <div class="form-group"><label>Email *</label><input type="email" id="replyEmail-${comment.id}" placeholder="you@example.com" /></div>
          <div class="form-group"><label>Reply *</label><textarea id="replyMessage-${comment.id}" placeholder="Write your reply..."></textarea></div>
          <button class="btn-submit" onclick="window.__submitReply(${comment.id})"><i class="fas fa-reply"></i> Post Reply</button>
        </div>` : ''}
        ${replies ? `<div class="comment-replies">${replies}</div>` : ''}
      </div>`;
  }

  function renderComments() {
    if (!allComments.length) {
      list.innerHTML = `<div class="comments-empty"><i class="fas fa-comments" style="font-size:22px;color:var(--accent)"></i>No comments yet — be the first to share your thoughts.</div>`;
      return;
    }
    list.innerHTML = allComments.map((c) => renderComment(c)).join('');
  }

  async function loadComments() {
    try {
      const res = await fetch(`${API_BASE}/comments`);
      if (!res.ok) throw new Error('API not available');
      allComments = await res.json();
    } catch {
      allComments = [];
      list.innerHTML = `<div class="comments-empty"><i class="fas fa-plug" style="font-size:22px;color:var(--accent)"></i>Comments are unavailable right now — the API may be waking up. Try again shortly.</div>`;
      return;
    }
    renderComments();
  }

  window.__toggleReply = (id) => document.getElementById(`reply-form-${id}`)?.classList.toggle('active');

  window.__likeComment = async (id, btn) => {
    if (btn.classList.contains('liked')) return;
    btn.classList.add('liked');
    const span = btn.querySelector('span');
    span.textContent = (parseInt(span.textContent, 10) || 0) + 1;
    try {
      const res = await fetch(`${API_BASE}/comments/${id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) span.textContent = data.likes;
    } catch { /* optimistic update remains */ }
  };

  window.__submitReply = async (parentId) => {
    const name = document.getElementById(`replyName-${parentId}`).value.trim();
    const company = document.getElementById(`replyCompany-${parentId}`).value.trim();
    const email = document.getElementById(`replyEmail-${parentId}`).value.trim();
    const message = document.getElementById(`replyMessage-${parentId}`).value.trim();
    if (!name || !email || !message) return showAlert('error', 'Please fill in your name, email, and reply.');
    try {
      const res = await fetch(`${API_BASE}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, company, email, message, parent_id: parentId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      const parent = allComments.find((c) => c.id === parentId);
      if (parent) { parent.replies = parent.replies || []; parent.replies.push(data.comment); }
      renderComments();
      showAlert('success');
    } catch (err) {
      showAlert('error', err.message || 'Could not post your reply.');
    }
  };

  document.getElementById('submitCommentBtn')?.addEventListener('click', async () => {
    const name    = document.getElementById('commentName').value.trim();
    const email   = document.getElementById('commentEmail').value.trim();
    const message = document.getElementById('commentMessage').value.trim();
    if (!name || !email || !message) return showAlert('error', 'Please fill in your name, email, and comment.');

    const btn = document.getElementById('submitCommentBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
    try {
      const res = await fetch(`${API_BASE}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      allComments.unshift(data.comment);
      renderComments();
      showAlert('success');
      ['commentName', 'commentEmail', 'commentMessage'].forEach((id) => { document.getElementById(id).value = ''; });
    } catch (err) {
      showAlert('error', err.message || 'Could not post your comment.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Post comment';
    }
  });

  loadComments();
}

/* ---------------------------------------------------------------
   Contact form — same primary behaviour as before (opens WhatsApp
   with a pre-filled message). Also fires a silent, best-effort
   POST to /api/contact so the message is logged in the database;
   this never blocks or affects the WhatsApp flow.
   --------------------------------------------------------------- */
function initContactForm() {
  const submitBtn = document.getElementById('contactSubmitBtn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', () => {
    const successAlert = document.getElementById('contactAlertSuccess');
    const errorAlert = document.getElementById('contactAlertError');
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const subjectSelect = document.getElementById('subject');
    const subject = subjectSelect.value;
    const message = document.getElementById('message').value.trim();

    if (!firstName || !email || !message) {
      errorAlert.textContent = 'Please fill in your name, email, and message.';
      errorAlert.style.display = 'flex';
      successAlert.style.display = 'none';
      setTimeout(() => { errorAlert.style.display = 'none'; }, 4000);
      return;
    }
    errorAlert.style.display = 'none';

    const subjectLabel = subject ? subjectSelect.options[subjectSelect.selectedIndex].text : 'General Inquiry';
    const text = `New message from Portfolio Contact Form\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nSubject: ${subjectLabel}\nMessage: ${message}`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

    successAlert.style.display = 'flex';
    window.open(whatsappUrl, '_blank');

    // best-effort, silent — does not affect the WhatsApp flow above
    fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), email, subject: subjectLabel, message })
    }).catch(() => {});

    ['firstName', 'lastName', 'email', 'message'].forEach((id) => { document.getElementById(id).value = ''; });
    subjectSelect.value = '';
    setTimeout(() => { successAlert.style.display = 'none'; }, 5000);
  });
}

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initClock();
  initLikes();
  initHeroLetterRain();
  initSkills();
  initProjects();
  initComments();
  initContactForm();
  initSplitText();
  initParallax();
  initScrollReveal();
  initAboutLetterRain();
});

/* ---------------------------------------------------------------
   Letter Rain — Hero H1
   Letters start from well above the viewport (above the navbar)
   and fall with a realistic gravity curve to their natural position.
   Each character is an independent span; runs once, no looping.
   --------------------------------------------------------------- */
function initHeroLetterRain() {
  const h1 = document.querySelector('.letter-fall-hero');
  if (!h1) return;

  const navEl = document.querySelector('.nav-wrap');
  const navH  = navEl ? navEl.offsetHeight : 64;

  const nodes = Array.from(h1.childNodes);
  const frag  = document.createDocumentFragment();
  let idx = 0;

  const processText = (text, container) => {
    text.split('').forEach((ch) => {
      if (ch === ' ') {
        const sp = document.createElement('span');
        sp.className = 'rf-space';
        container.appendChild(sp);
      } else {
        const sp = document.createElement('span');
        sp.className = 'rf-char';
        sp.textContent = ch;
        // 80ms head-start, then 38ms between each letter
        sp.style.setProperty('--rf-delay', `${0.08 + idx * 0.038}s`);
        container.appendChild(sp);
        idx++;
      }
    });
  };

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      processText(node.textContent, frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const wrapper = node.cloneNode(false);
      processText(node.textContent, wrapper);
      frag.appendChild(wrapper);
    }
  });

  h1.innerHTML = '';
  h1.appendChild(frag);

  // Measure distance from viewport top after DOM is updated,
  // then store it so the keyframe knows exactly how far to travel.
  requestAnimationFrame(() => {
    const rect = h1.getBoundingClientRect();
    const fallDist = Math.round(rect.top + navH * 0.5);
    h1.style.setProperty('--rf-fall', `${-Math.max(fallDist, 120)}px`);
    h1.classList.add('rf-ready');
  });
}

/* ---------------------------------------------------------------
   Letter Rain — About paragraph (scroll-triggered)
   Same physics; fires once when element scrolls into view.
   --------------------------------------------------------------- */
function initAboutLetterRain() {
  const para = document.querySelector('.letter-fall-scroll');
  if (!para) return;

  const text = para.textContent;
  para.innerHTML = '';
  let idx = 0;

  text.split('').forEach((ch) => {
    if (ch === ' ') {
      const sp = document.createElement('span');
      sp.className = 'rf-space';
      para.appendChild(sp);
    } else {
      const sp = document.createElement('span');
      sp.className = 'rf-char';
      sp.textContent = ch;
      sp.dataset.rfIdx = idx;
      para.appendChild(sp);
      idx++;
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const rect = para.getBoundingClientRect();
      const fallDist = Math.round(rect.top + 80);
      para.style.setProperty('--rf-fall', `${-Math.min(Math.max(fallDist, 80), 480)}px`);
      para.querySelectorAll('.rf-char').forEach((el, i) => {
        el.style.setProperty('--rf-delay', `${i * 0.013}s`);
      });
      para.classList.add('rf-ready');
      observer.unobserve(para);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  observer.observe(para);
}

/* aliases so nothing external breaks */
function initHeroLetterFall()  { initHeroLetterRain(); }
function initAboutLetterFall() { initAboutLetterRain(); }
