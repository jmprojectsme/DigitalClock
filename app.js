// ── Canvas Setup ───────────────────────────────────────
const canvas = document.getElementById('stars');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}
window.addEventListener('resize', resizeCanvas);

// ── Twinkling Stars ────────────────────────────────────
const stars = [];

function initStars() {
  stars.length = 0;
  const count = Math.floor((canvas.width * canvas.height) / 4000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.6 + 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.008 + 0.002,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function drawTwinklingStars() {
  const t = Date.now() / 1000;
  for (const s of stars) {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 215, 255, ${a})`;
    ctx.fill();
  }
}

// ── Shooting Stars ─────────────────────────────────────
const shootingStars = [];
let shootTimer = 0;
let nextShoot  = 80;

function spawnShootingStar() {
  shootingStars.push({
    x:     Math.random() * canvas.width  * 0.75,
    y:     Math.random() * canvas.height * 0.45,
    len:   Math.random() * 160 + 100,
    speed: Math.random() * 5 + 4,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
    alpha: 0.85 + Math.random() * 0.15,
    life:  1.0,
    decay: Math.random() * 0.02 + 0.015,
  });
}

function tickShootingStars() {
  shootTimer++;
  if (shootTimer >= nextShoot) {
    spawnShootingStar();
    if (Math.random() < 0.25) spawnShootingStar();
    shootTimer = 0;
    nextShoot  = Math.random() * 200 + 80;
  }
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];

    s.x    += Math.cos(s.angle) * s.speed;
    s.y    += Math.sin(s.angle) * s.speed;
    s.life -= s.decay;

    if (s.life <= 0 || s.x > canvas.width + 100 || s.y > canvas.height + 100) {
      shootingStars.splice(i, 1);
      continue;
    }

    const a     = s.alpha * s.life;
    const tailX = s.x - Math.cos(s.angle) * s.len;
    const tailY = s.y - Math.sin(s.angle) * s.len;

    const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
    grad.addColorStop(0,   `rgba(255,255,255,0)`);
    grad.addColorStop(0.5, `rgba(180,215,255,${a * 0.5})`);
    grad.addColorStop(1,   `rgba(255,255,255,${a})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();

    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 10);
    glow.addColorStop(0, `rgba(200,230,255,${a * 0.6})`);
    glow.addColorStop(1, `rgba(200,230,255,0)`);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }
}

function drawNightSky() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTwinklingStars();
  tickShootingStars();
  drawShootingStars();
}

function clearSky() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  shootingStars.length = 0;
  shootTimer = 0;
}

// ── Celestial arc logic ────────────────────────────────
function isNight(h) { return h >= 20 || h < 6; }

function getSunProgress(h, m) {
  return Math.max(0, Math.min(1, ((h - 6) * 60 + m) / (14 * 60)));
}

function getMoonProgress(h, m) {
  const adj = h < 6 ? h + 24 : h;
  return Math.max(0, Math.min(1, ((adj - 20) * 60 + m) / (10 * 60)));
}

function getCelestialPosition(progress) {
  const W      = window.innerWidth;
  const H      = window.innerHeight;
  const margin = W * 0.08;
  const x      = margin + progress * (W - margin * 2);
  const p      = progress * 2 - 1;
  const y      = H * 0.12 + H * 0.72 * (p * p);
  return { x, y };
}

function getSunStyle(progress) {
  const mid        = 1 - Math.abs(progress - 0.5) * 2;
  const brightness = 0.45 + mid * 0.55;
  const g          = Math.round(120 + mid * 135);
  const b          = Math.round(mid * 120);
  const gg         = Math.round(100 + mid * 100);
  const gb         = Math.round(mid * 50);
  const size       = Math.round(90 + mid * 40);
  return { brightness, color: `rgb(255,${g},${b})`, glowColor: `rgb(255,${gg},${gb})`, size };
}

function getMoonStyle(progress) {
  const mid = 1 - Math.abs(progress - 0.5) * 2;
  return { brightness: 0.4 + mid * 0.6, size: Math.round(80 + mid * 30) };
}

// ── Sky gradient ───────────────────────────────────────
function getSkyColors(h, m) {
  const mins = h * 60 + m;
  const kf = [
    { t:    0, top: '#05071a', bot: '#05071a' },
    { t:  300, top: '#05071a', bot: '#05071a' },
    { t:  360, top: '#1a1a3a', bot: '#e8602a' },
    { t:  420, top: '#2a5a8a', bot: '#f0a050' },
    { t:  480, top: '#3a7ab8', bot: '#87ceeb' },
    { t:  600, top: '#4a90d9', bot: '#87ceeb' },
    { t:  720, top: '#1a5fa8', bot: '#4a90d9' },
    { t:  900, top: '#3a7ab8', bot: '#87ceeb' },
    { t: 1080, top: '#2a5a8a', bot: '#f0a050' },
    { t: 1140, top: '#1a1a3a', bot: '#e8602a' },
    { t: 1200, top: '#05071a', bot: '#05071a' },
    { t: 1440, top: '#05071a', bot: '#05071a' },
  ];
  let a = kf[0], b = kf[kf.length - 1];
  for (let i = 0; i < kf.length - 1; i++) {
    if (mins >= kf[i].t && mins <= kf[i + 1].t) { a = kf[i]; b = kf[i + 1]; break; }
  }
  const f = (mins - a.t) / (b.t - a.t || 1);
  return { aTop: a.top, bTop: b.top, aBot: a.bot, bBot: b.bot, f };
}

function hexRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function lerp(hexA, hexB, t) {
  const a = hexRgb(hexA), b = hexRgb(hexB);
  return `rgb(${Math.round(a.r + (b.r - a.r) * t)},${Math.round(a.g + (b.g - a.g) * t)},${Math.round(a.b + (b.b - a.b) * t)})`;
}

// ── DOM refs ───────────────────────────────────────────
const celestialEl = document.getElementById('celestial');
const skyEl       = document.querySelector('.sky');

// ── Main render loop ───────────────────────────────────
function frame() {
  const now   = new Date();
  const h     = now.getHours();
  const m     = now.getMinutes();
  const night = isNight(h);

  // Sky
  const sc = getSkyColors(h, m);
  skyEl.style.background =
    `linear-gradient(to bottom, ${lerp(sc.aTop, sc.bTop, sc.f)} 0%, ${lerp(sc.aBot, sc.bBot, sc.f)} 100%)`;

  // Celestial
  if (night) {
    celestialEl.classList.remove('sun');
    celestialEl.classList.add('moon');
    const prog = getMoonProgress(h, m);
    const pos  = getCelestialPosition(prog);
    const sty  = getMoonStyle(prog);
    celestialEl.style.left    = `${pos.x - sty.size / 2}px`;
    celestialEl.style.top     = `${pos.y - sty.size / 2}px`;
    celestialEl.style.width   = `${sty.size}px`;
    celestialEl.style.height  = `${sty.size}px`;
    celestialEl.style.opacity = sty.brightness;
    celestialEl.style.right   = 'unset';
  } else {
    celestialEl.classList.remove('moon');
    celestialEl.classList.add('sun');
    const prog = getSunProgress(h, m);
    const pos  = getCelestialPosition(prog);
    const sty  = getSunStyle(prog);
    celestialEl.style.left       = `${pos.x - sty.size / 2}px`;
    celestialEl.style.top        = `${pos.y - sty.size / 2}px`;
    celestialEl.style.width      = `${sty.size}px`;
    celestialEl.style.height     = `${sty.size}px`;
    celestialEl.style.opacity    = sty.brightness;
    celestialEl.style.right      = 'unset';
    celestialEl.style.background =
      `radial-gradient(circle at 40% 38%, #fff9c4 0%, ${sty.color} 50%, ${sty.glowColor} 100%)`;
  }

  // Draw sky canvas
  if (night) {
    drawNightSky();
  } else {
    clearSky();
  }

  requestAnimationFrame(frame);
}

// ── Clock ──────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function updateClock() {
  const now  = new Date();
  let   h    = now.getHours();
  const m    = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('hours').textContent   = String(h).padStart(2, '0');
  document.getElementById('minutes').textContent = String(m).padStart(2, '0');
  document.getElementById('ampm').textContent    = ampm;
  document.getElementById('date').textContent    =
    `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
}

// ── Start ──────────────────────────────────────────────
resizeCanvas();
updateClock();
setInterval(updateClock, 1000);
frame();
