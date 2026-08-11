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
   Projects — layered/stacked scroll showcase.
   Pure scroll-linked animation (no external animation library, no
   CDN dependency, no async-load race) so the deck's very first
   paint already matches the JS-driven state exactly — no flicker,
   no flash of an "already opened" layout.

   Mental model: the wrapper (#stackWrap) is tall enough to give
   exactly (cards.length - 1) full-viewport steps of scroll room.
   The inner .stack-sticky pins itself via native `position:sticky`
   while the user scrolls through that room. On every scroll/resize
   tick we compute a single 0..1 progress value from the wrapper's
   position, translate that into a continuous "depth" per card
   (depth = card index - progress * (N - 1)), and map depth straight
   to a transform/opacity/blur pose:
     depth  0        -> fully open, front of the stack
     depth  1,2,3...  -> further back in the stacked deck (peeking)
     depth -1         -> already opened and gliding out of view
   Because this is a continuous function of scroll position (not a
   discrete step triggered once per section), cards reveal exactly
   one at a time, in lock-step with the scrollbar, and reverse
   cleanly when scrolling back up.
   --------------------------------------------------------------- */
function initProjectsStack() {
  const wrap = document.getElementById('stackWrap');
  const sticky = document.querySelector('.stack-sticky');
  const cards = [...document.querySelectorAll('.stack-card')];
  const dots = [...document.querySelectorAll('.stack-progress-dot')];
  if (!wrap || !sticky || !cards.length) return;

  const N = cards.length;
  setStat('statProjects', String(N).padStart(3, '0'));

  // status -> CTA label/href placeholder (real URLs added later by hand)
  cards.forEach((card) => {
    const status = card.dataset.status;
    const cta = card.querySelector('.stack-card-cta');
    const label = cta?.querySelector('.cta-label');
    if (!cta || !label) return;
    if (status === 'live' && card.dataset.live) { cta.href = card.dataset.live; label.textContent = 'View Live'; }
    else if (status === 'github' && card.dataset.github) { cta.href = card.dataset.github; label.textContent = 'View on GitHub'; }
    else { cta.removeAttribute('href'); cta.addEventListener('click', (e) => e.preventDefault()); }
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Control points mapping "depth" (card index minus scroll progress)
  // to a visual pose. depth 0 = open/front card. Positive depth =
  // stacked further back (still visible, peeking). Negative depth =
  // already shown and exiting. These exact numbers are mirrored in
  // the default CSS ([data-index] rules) so first paint == JS state.
  const POSES = [
    { d: -1, ty: -46, scale: 1.06, opacity: 0,   blur: 8 },
    { d: 0,  ty: 0,   scale: 1,    opacity: 1,   blur: 0 },
    { d: 1,  ty: 14,  scale: .96,  opacity: .92, blur: 0 },
    { d: 2,  ty: 27,  scale: .92,  opacity: .76, blur: 0 },
    { d: 3,  ty: 38,  scale: .885, opacity: .56, blur: 0 },
    { d: 4,  ty: 47,  scale: .85,  opacity: .36, blur: 0 }
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  function poseAt(depth) {
    const dc = Math.min(Math.max(depth, POSES[0].d), POSES[POSES.length - 1].d);
    let lo = POSES[0], hi = POSES[POSES.length - 1];
    for (let k = 0; k < POSES.length - 1; k++) {
      if (dc >= POSES[k].d && dc <= POSES[k + 1].d) { lo = POSES[k]; hi = POSES[k + 1]; break; }
    }
    const span = (hi.d - lo.d) || 1;
    const t = smooth((dc - lo.d) / span);
    return {
      ty: lerp(lo.ty, hi.ty, t),
      scale: lerp(lo.scale, hi.scale, t),
      opacity: lerp(lo.opacity, hi.opacity, t),
      blur: lerp(lo.blur, hi.blur, t)
    };
  }

  // Wrapper height = exactly the scroll room the animation needs:
  // one viewport to arrive + (N - 1) viewports to step through the
  // rest, so there is never leftover empty space above/below the
  // pinned deck. Recalculated on resize.
  function sizeWrap() {
    wrap.style.height = `${N * 100}vh`;
  }
  sizeWrap();

  let ticking = false;

  function render() {
    ticking = false;
    const vh = window.innerHeight;
    const rect = wrap.getBoundingClientRect();
    const scrollable = wrap.offsetHeight - vh;
    let progress = scrollable > 0 ? (-rect.top) / scrollable : 0;
    progress = Math.min(1, Math.max(0, progress));

    const activeFloat = progress * (N - 1);
    const activeIndex = Math.round(activeFloat);

    cards.forEach((card, i) => {
      const depth = i - activeFloat;
      const pose = reduced
        ? (depth <= -0.5 ? POSES[0] : (i === activeIndex ? POSES[1] : POSES[Math.min(POSES.length - 1, Math.max(1, Math.round(depth) + 1))]))
        : poseAt(depth);

      card.style.transform = `translateY(${pose.ty.toFixed(2)}px) scale(${pose.scale.toFixed(3)})`;
      card.style.opacity = pose.opacity.toFixed(3);
      card.style.filter = pose.blur > 0.4 ? `blur(${pose.blur.toFixed(1)}px)` : 'none';

      const dc = Math.min(Math.max(depth, POSES[0].d), POSES[POSES.length - 1].d);
      card.style.zIndex = String(Math.round((4 - dc) * 10) + 10);

      // Only the front-most (and its immediate peeking neighbor)
      // should be interactive/hoverable — deeper or exited cards
      // sit behind and shouldn't intercept pointer events.
      const interactive = depth > -0.5 && depth < 1.5;
      card.style.pointerEvents = interactive ? 'auto' : 'none';
      card.classList.toggle('is-front', i === activeIndex);
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
  }

  function requestRender() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', () => { sizeWrap(); requestRender(); });

  render(); // paint the correct initial state immediately (matches default CSS)
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
/* ---------------------------------------------------------------
   Contact — cinematic photo drop, scroll-scrubbed via GSAP.
   The photo starts high, rotated and scaled down, and settles into
   its resting spot as the Contact section scrolls into view — a
   layered, physical-feeling reveal rather than a plain fade-in.
   --------------------------------------------------------------- */
function initContactPhotoDrop() {
  const photo = document.getElementById('contactPhotoDrop');
  const section = document.getElementById('contact');
  if (!photo || !section || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { gsap.set(photo, { opacity: .9, rotate: -4, y: 0, scale: 1 }); return; }

  gsap.fromTo(photo,
    { y: '-30%', rotate: -9, scale: .82, opacity: 0 },
    {
      y: '0%', rotate: -4, scale: 1, opacity: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        end: 'top 25%',
        scrub: 0.8
      }
    });

  // tiny parallax drift while the section is in view — adds depth
  gsap.to(photo, {
    y: '+=18',
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 1 }
  });
}

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
  const boot = [
    initNav, initClock, initLikes, initHeroLetterRain, initSkills, initProjectsStack,
    initComments, initContactForm, initContactPhotoDrop, initSplitText, initParallax, initScrollReveal,
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
