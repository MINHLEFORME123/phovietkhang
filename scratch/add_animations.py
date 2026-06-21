import os

CSS_BLOCK = """
/* ═══════════════════════════════════════════════════════════════════
   ENTRANCE ANIMATIONS (Fade In & Slide Up)
   ═══════════════════════════════════════════════════════════════════ */
.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
    will-change: opacity, transform;
}
.animate-on-scroll.is-visible {
    opacity: 1;
    transform: translateY(0);
}
.delay-100 { transition-delay: 100ms; }
.delay-200 { transition-delay: 200ms; }
.delay-300 { transition-delay: 300ms; }
.delay-400 { transition-delay: 400ms; }
.delay-500 { transition-delay: 500ms; }
"""

JS_BLOCK = """
// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
});
"""

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

with open(os.path.join(ROOT, "css", "client.css"), "a", encoding="utf-8") as f:
    f.write(CSS_BLOCK)
    print("Added animations to client.css")

with open(os.path.join(ROOT, "js", "client.js"), "a", encoding="utf-8") as f:
    f.write(JS_BLOCK)
    print("Added observer to client.js")
