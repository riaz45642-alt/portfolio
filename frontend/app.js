/* ====================================================================
   Muhammad Ahmad — Portfolio (SPA)
   Same backend, same endpoints, same payloads as the original multi-page
   site. Only the frontend wiring changed: one page, one shared nav,
   smooth in-page scrolling instead of full reloads.
   ==================================================================== */

const API_BASE = 'https://ahmad-portfolio-api.onrender.com/api';
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
  if (visual && !window.matchMedia('(pointer: coarse)').matches) {
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

  const feedbackTitle = document.querySelector('.feedback-background-title');
  const feedbackSection = document.getElementById('feedback');
  if (feedbackTitle && feedbackSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let feedbackTicking = false;
    window.addEventListener('scroll', () => {
      if (feedbackTicking) return;
      feedbackTicking = true;
      requestAnimationFrame(() => {
        const rect = feedbackSection.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (window.innerHeight * 0.5 - rect.top) / window.innerHeight));
        feedbackTitle.style.transform = `translate3d(${progress * -12}px, ${progress * 18}px, 0)`;
        feedbackTicking = false;
      });
    }, { passive: true });
  }

  // Hero headline settles, then gently fades/scales/blurs away as the
  // page scrolls past it — the "pinned hero" feel from the reel.
  const heroCopy = document.querySelector('.hero-copy-stair');
  const heroSection = document.querySelector('.hero');
  if (heroCopy && heroSection && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let hTicking = false;
    window.addEventListener('scroll', () => {
      if (hTicking) return;
      hTicking = true;
      requestAnimationFrame(() => {
        const h = heroSection.offsetHeight || 1;
        const p = Math.min(Math.max(window.scrollY / h, 0), 1);
        heroCopy.style.opacity = String(1 - p * 1.1);
        heroCopy.style.transform = `translateY(${p * 60}px) scale(${1 - p * 0.08})`;
        heroCopy.style.filter = p > 0.02 ? `blur(${(p * 6).toFixed(2)}px)` : '';
        hTicking = false;
      });
    }, { passive: true });
  }
}

/* ---------------------------------------------------------------
   Smooth, inertial scroll (desktop / mouse only) — a small lerp-based
   engine so wheel scrolling and in-page nav jumps glide the way the
   reference reel does, instead of the browser's default step scroll.
   No hijacking on touch devices or when the user prefers less motion;
   native scrolling (and the CSS `scroll-behavior: smooth` fallback)
   is left completely untouched for them.
   --------------------------------------------------------------- */
function initSmoothScroll() {
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isCoarse || reduceMotion) return;

  const mainEl = document.querySelector('main');
  const EASE = 0.1;
  let current = window.scrollY;
  let target = window.scrollY;
  let raf = null;

  document.documentElement.style.scrollBehavior = 'auto';

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  function clampTarget() { target = Math.max(0, Math.min(target, maxScroll())); }

  function applyBlur(velocity) {
    if (!mainEl) return;
    const amt = Math.min(Math.abs(velocity) * 0.035, 2.5);
    mainEl.style.filter = amt > 0.12 ? `blur(${amt.toFixed(2)}px)` : '';
  }

  function tick() {
    const diff = target - current;
    if (Math.abs(diff) < 0.4) {
      current = target;
      window.scrollTo(0, current);
      applyBlur(0);
      raf = null;
      return;
    }
    current += diff * EASE;
    window.scrollTo(0, current);
    applyBlur(diff * EASE);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // leave pinch/scroll-zoom alone
    e.preventDefault();
    target += e.deltaY;
    clampTarget();
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: false });

  // Keep in sync with scrolling we didn't cause (keyboard, scrollbar drag)
  window.addEventListener('scroll', () => {
    if (raf) return;
    current = window.scrollY;
    target = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', clampTarget);

  // Smooth in-page nav jumps (Home / About / Work / Feedback / Contact)
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const navH = document.querySelector('.nav-wrap')?.offsetHeight || 0;
      target = el.getBoundingClientRect().top + window.scrollY - navH - 26;
      clampTarget();
      if (!raf) raf = requestAnimationFrame(tick);
    });
  });
}

/* ---------------------------------------------------------------
   Project card 3D tilt — cursor-driven perspective tilt, the same
   "card leans toward you" feel as the reel's floating panels.
   Desktop / mouse only.
   --------------------------------------------------------------- */
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  grid.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(1000px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-8px)`;
  });

  grid.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.project-card');
    if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
    card.style.transform = '';
  });
}

/* ---------------------------------------------------------------
   About stats — count up from 0 the first time a real value lands
   in the span (values arrive async from setStat()/loadProjects()).
   --------------------------------------------------------------- */
function initStatCounters() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const spans = ['statProjects', 'statStack'].map((id) => document.getElementById(id)).filter(Boolean);
  if (!spans.length) return;

  const animated = new WeakSet();
  function animateTo(el, finalText) {
    const finalNum = parseInt(finalText, 10);
    if (isNaN(finalNum) || animated.has(el)) return;
    animated.add(el);
    const pad = finalText.length;
    const duration = 900;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(finalNum * eased);
      el.textContent = String(val).padStart(pad, '0');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = finalText;
    }
    requestAnimationFrame(step);
  }

  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      const el = m.target.nodeType === 3 ? m.target.parentElement : m.target;
      if (el && spans.includes(el) && /^\d+$/.test(el.textContent.trim())) {
        animateTo(el, el.textContent.trim());
      }
    });
  });
  spans.forEach((el) => {
    // catch values already set before this observer was attached
    if (/^\d+$/.test(el.textContent.trim())) animateTo(el, el.textContent.trim());
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  });
}

/* ---------------------------------------------------------------
   Nav: mobile toggle, active-section highlighting, smooth offset
   --------------------------------------------------------------- */
function initNav() {
  const navWrap = document.querySelector('.nav-wrap');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  const menuLinks = document.querySelectorAll('.nav-links a');
  const sections = [...links].map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  if (toggle) {
    toggle.addEventListener('click', () => navWrap.classList.toggle('menu-open'));
  }
  menuLinks.forEach((a) => a.addEventListener('click', () => navWrap.classList.remove('menu-open')));

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

  // Keep the transparent navigation readable by sampling the section
  // directly beneath it and classifying that section's computed color.
  let colorTicking = false;
  const effectiveBackground = (element) => {
    let current = element;
    while (current) {
      const color = getComputedStyle(current).backgroundColor;
      const values = color.match(/[\d.]+/g)?.map(Number) || [];
      if (values.length >= 3 && (values.length < 4 || values[3] > 0.05)) return values.slice(0, 3);
      current = current.parentElement;
    }
    return [11, 11, 13];
  };
  const updateNavContrast = () => {
    colorTicking = false;
    const navRect = navWrap.getBoundingClientRect();
    const sampleY = navRect.top + navRect.height / 2;
    const section = sections.find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.top <= sampleY && rect.bottom > sampleY;
    }) || sections.reduce((closest, item) => {
      const rect = item.getBoundingClientRect();
      const distance = sampleY < rect.top ? rect.top - sampleY : sampleY - rect.bottom;
      return !closest || distance < closest.distance ? { item, distance } : closest;
    }, null)?.item || sections[0];
    const [r, g, b] = effectiveBackground(section);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const onLight = luminance > 0.58;
    navWrap.classList.toggle('nav-on-light', onLight);
    navWrap.classList.toggle('nav-on-dark', !onLight);
  };
  const requestNavContrast = () => {
    if (colorTicking) return;
    colorTicking = true;
    requestAnimationFrame(updateNavContrast);
  };
  window.addEventListener('scroll', requestNavContrast, { passive: true });
  window.addEventListener('resize', requestNavContrast);
  requestNavContrast();
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
   Projects — soft grid of laptop-mockup cards. No scroll-linked
   animation: info reveals purely via CSS on hover/focus. This just
   wires each card's CTA to its live/GitHub link (or disables it
   while a project is still in development) and reports the count.
   --------------------------------------------------------------- */
function initProjectsStack() {
  const cards = [...document.querySelectorAll('.proj-card')];
  if (!cards.length) return;
  const grid = document.querySelector('.proj-grid');
  const touchLayout = window.matchMedia('(hover: none), (pointer: coarse)');

  setStat('statProjects', String(cards.length).padStart(3, '0'));

  const setProjectContrast = (card, image) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const sampleWidth = 48;
      const sampleHeight = 18;
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      context.drawImage(
        image,
        0,
        image.naturalHeight * 0.62,
        image.naturalWidth,
        image.naturalHeight * 0.38,
        0,
        0,
        sampleWidth,
        sampleHeight
      );
      const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      let luminanceTotal = 0;
      let samples = 0;
      for (let index = 0; index < pixels.length; index += 16) {
        if (pixels[index + 3] < 128) continue;
        const r = pixels[index] / 255;
        const g = pixels[index + 1] / 255;
        const b = pixels[index + 2] / 255;
        luminanceTotal += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        samples += 1;
      }
      card.classList.toggle('project-on-light', samples > 0 && luminanceTotal / samples > 0.62);
    } catch {
      card.classList.remove('project-on-light');
    }
  };

  cards.forEach((card) => {
    const status = card.dataset.status;
    const cta = card.querySelector('.proj-cta');
    const label = cta?.querySelector('.cta-label');
    const screen = card.querySelector('.proj-laptop-screen');
    const image = screen?.querySelector('img');
    if (screen && image) screen.style.setProperty('--project-image', `url("${image.getAttribute('src')}")`);
    if (image) {
      if (image.complete && image.naturalWidth) setProjectContrast(card, image);
      else image.addEventListener('load', () => setProjectContrast(card, image), { once: true });
    }
    if (!cta || !label) return;
    if (status === 'live' && card.dataset.live) {
      cta.href = card.dataset.live;
      cta.target = '_blank';
      cta.rel = 'noopener';
      label.textContent = 'View Site';
      cta.removeAttribute('aria-disabled');
    }
    else if (status === 'live') {
      cta.removeAttribute('href');
      cta.setAttribute('aria-disabled', 'true');
      label.textContent = 'View Site';
      cta.addEventListener('click', (e) => e.preventDefault());
    }
    else if (status === 'github' && card.dataset.github) { cta.href = card.dataset.github; label.textContent = 'View on GitHub'; }
    else {
      cta.removeAttribute('href');
      label.textContent = 'In Development';
      cta.addEventListener('click', (e) => e.preventDefault());
    }

    card.tabIndex = 0;
    card.setAttribute('aria-expanded', 'false');
  });

  const activate = (activeCard) => {
    if (!grid) return;
    grid.classList.add('has-active');
    cards.forEach((card) => {
      const active = card === activeCard;
      card.classList.toggle('is-active', active);
      card.setAttribute('aria-expanded', String(active));
    });
  };

  const deactivate = () => {
    if (!grid) return;
    grid.classList.remove('has-active');
    cards.forEach((card) => {
      card.classList.remove('is-active');
      card.setAttribute('aria-expanded', 'false');
    });
  };

  cards.forEach((card) => {
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') activate(card);
    });
    card.addEventListener('click', (event) => {
      if (!touchLayout.matches) return;
      const link = event.target.closest('.proj-cta');
      if (link && card.classList.contains('is-active')) return;
      if (!card.classList.contains('is-active')) event.preventDefault();
      activate(card);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('.proj-cta')) return;
      event.preventDefault();
      activate(card);
    });
  });

  grid?.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') deactivate();
  });
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

  grid.innerHTML = skills.map((s, index) => `
    <div class="skill-card" style="--skill-order:${index}">
      <div class="skill-meta">
        <h4>${s.name}</h4>
      </div>
      <div class="skill-bar" role="progressbar" aria-label="${s.name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.level}">
        <div class="skill-fill" data-width="${s.level}"></div>
      </div>
      <span class="skill-percent">${s.level}%</span>
    </div>`).join('');

  setStat('statStack', String(skills.length).padStart(3, '0'));

  const section = document.getElementById('about');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        grid.classList.add('skills-visible');
        grid.querySelectorAll('.skill-fill').forEach((el) => { el.style.height = `${el.dataset.width}%`; });
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
              <h4>${escapeHtml(comment.name)}</h4>
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
          <div class="feedback-mini-row">
            <textarea id="replyMessage-${comment.id}" placeholder="Write a reply..."></textarea>
            <button class="btn-submit feedback-mini-submit" onclick="window.__submitReply(${comment.id})" aria-label="Post reply"><i class="fas fa-reply"></i></button>
          </div>
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
    const cards = [...list.querySelectorAll('.comment-card')];
    requestAnimationFrame(() => {
      cards.forEach((card, index) => {
        card.style.setProperty('--comment-order', index);
        card.classList.add('is-visible');
      });
    });
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
    const messageEl = document.getElementById(`replyMessage-${parentId}`);
    const message = messageEl.value.trim();
    if (!message) return showAlert('error', 'Please write a reply before posting.');
    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Anonymous', email: 'anonymous@portfolio.visitor', message, parent_id: parentId })
      });
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
    const messageEl = document.getElementById('commentMessage');
    const message = messageEl.value.trim();
    if (!message) return showAlert('error', 'Please write something before posting.');

    const btn = document.getElementById('submitCommentBtn');
    btn.disabled = true;
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
      // The form no longer collects name/email (per the minimal design),
      // so every comment posts anonymously — the backend still stores a
      // name/email pair, filled in here with a fixed placeholder.
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Anonymous', email: 'anonymous@portfolio.visitor', message })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      allComments.unshift(data.comment);
      renderComments();
      showAlert('success');
      messageEl.value = '';
    } catch (err) {
      showAlert('error', err.message || 'Could not post your comment.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalIcon;
    }
  });

  loadComments();
}

/* ---------------------------------------------------------------
   Contact — now a compact row of direct platform links (WhatsApp,
   Instagram, GitHub, Email, LinkedIn, Maps). Every icon is a plain
   <a href> in the markup, so no JS wiring is needed here at all.
   --------------------------------------------------------------- */

function initContactField() {
  const section = document.querySelector('.contact-section');
  const field = section?.querySelector('.contact-icon-row');
  const title = section?.querySelector('.contact-editorial-title');
  const selectedIndicator = section?.querySelector('.contact-selected-icon');
  const icons = field ? [...field.querySelectorAll('.contact-icon')] : [];
  if (!section || !field || !icons.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = icons.map((icon, index) => ({
    icon, index, x: 0, y: 0,
    vx: (index % 2 ? -1 : 1) * (14 + Math.random() * 12),
    vy: (index % 3 ? 1 : -1) * (11 + Math.random() * 11),
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    maxSpeed: 25 + Math.random() * 13
  }));
  let paused = false;
  let initialized = false;
  let lastTime = performance.now();

  field.classList.add('is-animated');

  const limitsFor = (icon, state) => {
    const inset = window.innerWidth <= 620 ? 12 : 22;
    const columns = 3;
    const rows = 2;
    const column = state.index % columns;
    const row = Math.floor(state.index / columns);
    const cellWidth = field.clientWidth / columns;
    const cellHeight = field.clientHeight / rows;
    const cellLeft = column * cellWidth;
    const cellTop = row * cellHeight;
    return {
      minX: cellLeft + inset,
      minY: cellTop + inset,
      maxX: Math.max(cellLeft + inset, cellLeft + cellWidth - icon.offsetWidth - inset),
      maxY: Math.max(cellTop + inset, cellTop + cellHeight - icon.offsetHeight - inset)
    };
  };

  const render = (state, time = 0) => {
    const angle = reducedMotion.matches ? 0 : Math.sin(time * 0.00042 + state.phaseX) * 5;
    state.icon.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${angle}deg)`;
  };

  const layout = () => {
    states.forEach((state) => {
      const limits = limitsFor(state.icon, state);
      if (!initialized) {
        state.x = limits.minX + (limits.maxX - limits.minX) * 0.5;
        state.y = limits.minY + (limits.maxY - limits.minY) * 0.5;
      } else {
        state.x = Math.min(limits.maxX, Math.max(limits.minX, state.x));
        state.y = Math.min(limits.maxY, Math.max(limits.minY, state.y));
      }
      render(state);
    });
    initialized = true;
  };

  const setPaused = (value) => {
    paused = value;
    lastTime = performance.now();
  };

  const showSelectedIcon = (icon) => {
    if (!selectedIndicator) return;
    const platformMark = icon.querySelector('i');
    if (!platformMark) return;
    selectedIndicator.replaceChildren(platformMark.cloneNode(true));
    selectedIndicator.dataset.platform = [...icon.classList].find((name) => name !== 'contact-icon') || '';
    selectedIndicator.classList.add('is-visible');
  };

  const hideSelectedIcon = () => {
    if (!selectedIndicator) return;
    selectedIndicator.classList.remove('is-visible');
  };

  const animate = (time) => {
    const dt = Math.min((time - lastTime) / 1000, 0.035);
    lastTime = time;
    if (!paused && !reducedMotion.matches) {
      states.forEach((state) => {
        const limits = limitsFor(state.icon, state);
        state.vx += Math.sin(time * 0.00033 + state.phaseX) * 7 * dt;
        state.vy += Math.cos(time * 0.00029 + state.phaseY) * 7 * dt;
        const speed = Math.hypot(state.vx, state.vy);
        if (speed > state.maxSpeed) {
          state.vx = (state.vx / speed) * state.maxSpeed;
          state.vy = (state.vy / speed) * state.maxSpeed;
        }
        state.x += state.vx * dt;
        state.y += state.vy * dt;
        if (state.x <= limits.minX || state.x >= limits.maxX) {
          state.x = Math.min(limits.maxX, Math.max(limits.minX, state.x));
          state.vx *= -1;
        }
        if (state.y <= limits.minY || state.y >= limits.maxY) {
          state.y = Math.min(limits.maxY, Math.max(limits.minY, state.y));
          state.vy *= -1;
        }
        render(state, time);
      });
    }
    requestAnimationFrame(animate);
  };

  section.addEventListener('pointerenter', () => setPaused(true));
  section.addEventListener('pointerleave', () => setPaused(false));
  section.addEventListener('pointermove', (event) => {
    if (!title || reducedMotion.matches) return;
    const rect = section.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    title.style.setProperty('--contact-shift-x', `${x}px`);
    title.style.setProperty('--contact-shift-y', `${y}px`);
  });
  section.addEventListener('pointerleave', () => {
    if (!title) return;
    title.style.setProperty('--contact-shift-x', '0px');
    title.style.setProperty('--contact-shift-y', '0px');
  });
  section.addEventListener('pointerdown', () => setPaused(true));
  section.addEventListener('pointerup', () => setPaused(false));
  section.addEventListener('pointercancel', () => setPaused(false));
  section.addEventListener('focusin', () => setPaused(true));
  section.addEventListener('focusout', (event) => {
    if (!section.contains(event.relatedTarget)) setPaused(false);
  });
  icons.forEach((icon) => {
    icon.addEventListener('pointerenter', () => showSelectedIcon(icon));
    icon.addEventListener('pointerleave', (event) => {
      if (!event.relatedTarget?.closest?.('.contact-icon')) hideSelectedIcon();
    });
    icon.addEventListener('focus', () => showSelectedIcon(icon));
    icon.addEventListener('blur', hideSelectedIcon);
  });
  field.addEventListener('pointerleave', hideSelectedIcon);
  window.addEventListener('resize', layout, { passive: true });
  document.addEventListener('visibilitychange', () => setPaused(document.hidden));

  requestAnimationFrame(() => {
    layout();
    requestAnimationFrame(animate);
  });
}

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const boot = [
    initNav, initClock, initLikes, initHeroLetterRain, initSkills, initProjectsStack,
    initComments, initContactField, initSplitText, initParallax, initScrollReveal,
    initAboutLetterRain, initSmoothScroll, initStatCounters
  ];
  boot.forEach((fn) => {
    try { fn(); } catch (err) { console.error(`[portfolio] ${fn.name} failed:`, err); }
  });
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

    // After the longest drop-in finishes (~0.08 + charCount*0.038 + 0.72s),
    // start the continuous random micro-blink on hero chars.
    const chars = Array.from(h1.querySelectorAll('.rf-char'));
    if (!chars.length) return;
    const lastDelay = (0.08 + (chars.length - 1) * 0.038 + 0.72) * 1000;

    function scheduleBlink() {
      // Pick 1-3 random chars, stagger their blinks slightly
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...chars].sort(() => Math.random() - 0.5).slice(0, count);
      shuffled.forEach((ch, i) => {
        setTimeout(() => {
          ch.classList.remove('blink-active');
          // Force reflow so re-adding the class restarts the animation
          void ch.offsetWidth;
          ch.classList.add('blink-active');
          ch.addEventListener('animationend', () => ch.classList.remove('blink-active'), { once: true });
        }, i * (120 + Math.random() * 180));
      });
      // Next blink cluster: 1.8s–4.5s from now, fully random
      setTimeout(scheduleBlink, 1800 + Math.random() * 2700);
    }

    setTimeout(scheduleBlink, lastDelay + 300);
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
