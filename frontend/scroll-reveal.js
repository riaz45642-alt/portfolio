// Scroll-based reveal animations.
// Applies a fade/slide-in effect when elements enter the viewport.
(function () {
    function initScrollReveal() {
        const targets = document.querySelectorAll('.scroll-reveal');
        if (!targets.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(el => observer.observe(el));
    }

    document.addEventListener('DOMContentLoaded', initScrollReveal);

    // Re-scan after content is injected dynamically (e.g. skills, projects,
    // comments lists loaded via fetch). Pages can call window.refreshScrollReveal()
    // after rendering dynamic content.
    window.refreshScrollReveal = initScrollReveal;
})();
