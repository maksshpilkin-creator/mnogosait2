/**
 * Ambient Off-Road Embers Canvas System
 * Lightweight, 60fps, low power, auto-pausing via IntersectionObserver.
 */
export function initHeroParticles() {
  const canvas = document.querySelector('#hero-particles-canvas');
  const heroSection = document.querySelector('#hero');
  if (!canvas || !heroSection) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.hidden = true;
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = heroSection.clientWidth);
  let height = (canvas.height = heroSection.clientHeight);

  const colors = [
    'rgba(217, 83, 30, ', // Terracotta
    'rgba(255, 138, 76, ', // Bright Amber
    'rgba(235, 185, 120, ' // Sand dust
  ];

  const PARTICLE_COUNT = Math.min(36, Math.floor(width / 35));
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.2 + 0.8,
    speedY: -(Math.random() * 0.45 + 0.2),
    speedX: (Math.random() - 0.5) * 0.35,
    opacity: Math.random() * 0.5 + 0.15,
    maxOpacity: Math.random() * 0.5 + 0.3,
    colorBase: colors[Math.floor(Math.random() * colors.length)],
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: Math.random() * 0.02 + 0.01
  }));

  let animationFrameId = null;
  let isVisible = true;

  function resize() {
    width = canvas.width = heroSection.clientWidth;
    height = canvas.height = heroSection.clientHeight;
  }

  window.addEventListener('resize', resize, { passive: true });

  function render() {
    if (!isVisible) return;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * 0.3;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      ctx.fillStyle = `${p.colorBase}${p.opacity.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  // IntersectionObserver to sleep when out of view
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          if (!animationFrameId) animationFrameId = requestAnimationFrame(render);
        } else {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }
        }
      });
    }, { threshold: 0.05 });

    observer.observe(heroSection);
  } else {
    animationFrameId = requestAnimationFrame(render);
  }
}
