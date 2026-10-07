/**
 * Sakellarious — Ambient Living Ledger Wallpaper (§6)
 * Continuous canvas animation simulating drifting ledger-grain,
 * hairline accounting grid rules, and chancery gold-leaf motes.
 */

(function initSakellariosWallpaper() {
  const canvas = document.getElementById('sak-wallpaper');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, motes = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const isSmallScreen = window.matchMedia('(max-width: 480px)').matches;
  const MOTE_COUNT = isSmallScreen ? 20 : 50;

  for (let i = 0; i < MOTE_COUNT; i++) {
    motes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 1.6,
      speed: 0.12 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.12,
      alpha: 0.18 + Math.random() * 0.32,
      pulse: Math.random() * Math.PI * 2
    });
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawChanceryAura(isParchment) {
    // Soft subtle radial glow in the center of the viewport
    const rad = Math.max(w, h) * 0.65;
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 40, w * 0.5, h * 0.5, rad);
    if (isParchment) {
      grad.addColorStop(0, 'rgba(201, 162, 75, 0.06)');
      grad.addColorStop(1, 'rgba(243, 234, 217, 0)');
    } else {
      grad.addColorStop(0, 'rgba(91, 42, 110, 0.08)');
      grad.addColorStop(0.5, 'rgba(201, 162, 75, 0.03)');
      grad.addColorStop(1, 'rgba(11, 10, 8, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  function drawAccountingGrid(isParchment) {
    const primaryStroke = isParchment ? 'rgba(22, 19, 15, 0.04)' : 'rgba(243, 234, 217, 0.045)';
    const majorStroke = isParchment ? 'rgba(22, 19, 15, 0.08)' : 'rgba(243, 234, 217, 0.09)';
    const gap = 56;

    let index = 0;
    for (let x = 0; x < w; x += gap) {
      ctx.beginPath();
      ctx.strokeStyle = (index % 4 === 0) ? majorStroke : primaryStroke;
      ctx.lineWidth = (index % 4 === 0) ? 1.2 : 0.8;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      index++;
    }

    index = 0;
    for (let y = 0; y < h; y += gap) {
      ctx.beginPath();
      ctx.strokeStyle = (index % 4 === 0) ? majorStroke : primaryStroke;
      ctx.lineWidth = (index % 4 === 0) ? 1.2 : 0.8;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      index++;
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    const isParchment = document.documentElement.getAttribute('data-theme') === 'parchment';

    drawChanceryAura(isParchment);
    drawAccountingGrid(isParchment);

    // Draw Gold Leaf Motes
    ctx.shadowBlur = 5;
    ctx.shadowColor = isParchment ? 'rgba(158, 123, 40, 0.4)' : 'rgba(201, 162, 75, 0.5)';

    for (const m of motes) {
      m.pulse += 0.02;
      const dynamicAlpha = m.alpha + Math.sin(m.pulse) * 0.06;
      const alphaClamped = Math.max(0.08, Math.min(0.6, dynamicAlpha));

      ctx.beginPath();
      ctx.fillStyle = isParchment
        ? `rgba(158, 123, 40, ${alphaClamped})`
        : `rgba(201, 162, 75, ${alphaClamped})`;
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReducedMotion) {
        m.y -= m.speed;
        m.x += m.drift;
        if (m.y < -6) {
          m.y = h + 6;
          m.x = Math.random() * w;
        }
        if (m.x < -6) m.x = w + 6;
        if (m.x > w + 6) m.x = -6;
      }
    }

    ctx.shadowBlur = 0; // Reset shadow for performance

    requestAnimationFrame(tick);
  }

  tick();
})();
