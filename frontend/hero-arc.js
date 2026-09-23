/* ---------------------------------------------------------------
   Hero "PORTFOLIO" title — interactive arc effect
   ---------------------------------------------------------------
   Scope: only the hero headline (.hero-arc-title and its .rf-char
   letters, created by app.js's initHeroLetterRain). Nothing else on
   the page is touched — no other section, route, or script is
   modified. Uses GSAP + ScrollTrigger (loaded via CDN in index.html)
   when available, and fails silently/statically if they aren't.
   ------------------------------------------------------------- */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(init);

  function init() {
    var title = document.querySelector('.hero-arc-title');
    if (!title) return;

    var line = title.querySelector('.stair-line-1') || title;
    var hasGSAP = typeof window.gsap !== 'undefined';
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // No GSAP loaded (e.g. CDN blocked) or reduced motion requested:
    // keep the title fully readable and static, only toggle the
    // subtle CSS glow class defined in style.css.
    if (!hasGSAP || reduceMotion) {
      if (!hasGSAP) {
        console.warn('[hero-arc] GSAP did not load — using the static fallback (title stays fully readable).');
      }
      title.addEventListener('mouseenter', function () { title.classList.add('hero-arc-active'); });
      title.addEventListener('mouseleave', function () { title.classList.remove('hero-arc-active'); });
      title.addEventListener('focus', function () { title.classList.add('hero-arc-active'); });
      title.addEventListener('blur', function () { title.classList.remove('hero-arc-active'); });
      return;
    }

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    var chars = Array.prototype.slice.call(line.querySelectorAll('.rf-char'));
    if (!chars.length) return;

    var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
    var isActive = false;
    var arcTween = null;
    var tiltX = gsap.quickTo(line, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    var tiltY = gsap.quickTo(line, 'rotationY', { duration: 0.5, ease: 'power3.out' });

    gsap.set(line, { transformPerspective: 900 });

    // Idle breathing (very subtle, pauses while hovered/focused so it
    // never fights with the hover/focus tween on the same property).
    var breathe = gsap.to(line, {
      y: '-=3',
      duration: 2.6,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    });

    function arcSettings() {
      var w = window.innerWidth;
      if (w <= 480) return { radius: 26, arcHeight: 20, maxAngle: 16, spread: 0.32 };
      if (w <= 760) return { radius: 40, arcHeight: 30, maxAngle: 19, spread: 0.38 };
      return { radius: 60, arcHeight: 46, maxAngle: 24, spread: 0.45 };
    }

    function centerOffset() {
      var section = title.closest('.hero') || title.closest('section') || document.body;
      var elRect = title.getBoundingClientRect();
      var secRect = section.getBoundingClientRect();
      var elCenterX = elRect.left + elRect.width / 2;
      var secCenterX = secRect.left + secRect.width / 2;
      return secCenterX - elCenterX;
    }

    function playIn() {
      if (isActive) return;
      isActive = true;
      title.classList.add('hero-arc-active');
      if (breathe) breathe.pause();

      var s = arcSettings();
      var n = chars.length;
      var mid = (n - 1) / 2 || 1;
      var dx = centerOffset() * 0.55;

      if (arcTween) arcTween.kill();
      arcTween = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.75 } });

      arcTween.to(line, {
        x: dx,
        y: -6,
        scale: 1.035,
        duration: 0.8
      }, 0);

      chars.forEach(function (ch, i) {
        var t = n > 1 ? (i - mid) / mid : 0;
        var angleDeg = t * s.maxAngle;
        var angleRad = angleDeg * Math.PI / 180;
        var maxRad = s.maxAngle * Math.PI / 180;
        var xOffset = -t * s.radius * s.spread;
        var yOffset = -(Math.cos(angleRad) - Math.cos(maxRad)) * s.arcHeight;
        var rotation = angleDeg * 0.7;
        var scale = 1 - Math.abs(t) * 0.06;

        arcTween.to(ch, {
          x: xOffset,
          y: yOffset,
          rotate: rotation,
          scale: scale,
          duration: 0.75,
          delay: Math.abs(t) * 0.035
        }, 0);
      });
    }

    function playOut() {
      if (!isActive) return;
      isActive = false;
      title.classList.remove('hero-arc-active');

      if (arcTween) arcTween.kill();
      arcTween = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 0.6 },
        onComplete: function () { if (breathe) breathe.resume(); }
      });
      arcTween.to(line, { x: 0, y: 0, scale: 1, rotationX: 0, rotationY: 0 }, 0);
      arcTween.to(chars, {
        x: 0, y: 0, rotate: 0, scale: 1,
        duration: 0.55,
        stagger: 0.012
      }, 0);
      tiltX(0);
      tiltY(0);
    }

    // ---- Mouse interactions (desktop) --------------------------------
    if (!isTouch) {
      title.addEventListener('mouseenter', playIn);
      title.addEventListener('mouseleave', playOut);

      title.addEventListener('mousemove', function (e) {
        if (!isActive) return;
        var rect = title.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
        var py = (e.clientY - rect.top) / rect.height - 0.5;   // -0.5..0.5
        tiltY(px * 10);
        tiltX(-py * 8);
      });
    }

    // ---- Keyboard focus (accessibility) ------------------------------
    title.addEventListener('focus', playIn);
    title.addEventListener('blur', playOut);

    // ---- Touch (mobile: tap to preview, tap elsewhere to close) ------
    if (isTouch) {
      title.addEventListener('touchstart', function (e) {
        e.stopPropagation();
        if (isActive) { playOut(); } else { playIn(); }
      }, { passive: true });

      document.addEventListener('touchstart', function (e) {
        if (isActive && !title.contains(e.target)) playOut();
      }, { passive: true });
    }

    // ---- Scroll-based parallax (both directions, auto-reversing) -----
    if (window.ScrollTrigger) {
      var heroSection = title.closest('.hero') || title.closest('section');
      if (heroSection) {
        // Targets the h1 itself (not the inner span), so this never
        // fights with the hover/focus/breathing tweens above, which
        // all animate the inner .stair-line-1 span.
        gsap.to(title, {
          y: 34,
          scale: 0.97,
          opacity: 0.88,
          filter: 'blur(1.5px)',
          ease: 'none',
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6
          }
        });
      }
    }

    // Re-measure on resize so the centering + arc stay accurate at
    // any breakpoint, without disturbing anything else on the page.
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (isActive) { playOut(); }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 200);
    });
  }
})();
