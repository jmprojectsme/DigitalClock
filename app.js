// ── Stars ──────────────────────────────────────────────
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
const stars = [];

function initStars() {
  stars.length = 0;
  const count = Math.floor((canvas.width * canvas.height) / 4000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.008 + 0.002,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

// ── Falling / Shooting Stars ───────────────────────────
const shootingStars = [];

function spawnShootingStar() {
  // subtle slow-falling star, diagonal drift
  shootingStars.push({
    x: Math.random() * canvas.width * 1.2 - canvas.width * 0.1,
    y: Math.random() * canvas.height * 0.5, // spawn in upper half
    len: Math.random() * 80 + 40,           // tail length
    speed: Math.random() * 1.2 + 0.5,       // slow & subtle
    angle: (Math.PI / 4) + (Math.random() - 0.5) * 0.3, // ~45deg diagonal
    alpha: Math.random() * 0.5 + 0.4,
    life: 1.0,                               // fade out over time
    decay: Math.random() * 0.008 + 0.004,   // slow fade
  });
}

// Spawn a new shooting star occasionally
let shootingStarTimer = 0;
function maybeSpawnShootingStar(nightOpacity) {
  if (nightOpacity <= 0) return;
  shootingStarTimer++;
  // random spawn roughly every 3-8 seconds (at 60fps)
  if (shootingStarTimer > Math.random() * 300 + 180) {
    spawnShootingStar();
    shootingStarTimer = 0;
  }
}

function drawShootingStars(opacity) {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.life -= s.decay;

    if (s.life <= 0 || s.x > canvas.width + 50 || s.y > canvas.height + 50) {
      shootingStars.splice(i, 1);
      continue;
    }

    const a = s.alpha * s.life * opacity;
    const tailX = s.x - Math.cos(s.angle) * s.len;
    const tailY = s.y - Math.sin(s.angle) * s.len;

    const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
    grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
    grad.addColorStop(0.7, `rgba(200, 220, 255, ${a * 0.5})`);
    grad.addColorStop(1, `rgba(255, 255, 255, ${a})`);

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(s.x, s.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // tiny bright head
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.fill();
  }
}

function drawStars(opacity) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (opacity <= 0) {
    shootingStars.length = 0; // clear when daytime
    return;
  }
  const t = Date.now() / 1000;
  for (const s of stars) {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase)) * opacity;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 215, 255, ${a})`;
    ctx.fill();
  }
  maybeSpawnShootingStar(opacity);
  drawShootingStars(opacity);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Celestial arc & color logic ────────────────────────
// Sun: rises 6AM, peaks noon, sets 8PM  → 14 hour arc
// Moon: rises 8PM, peaks 2AM, sets 6AM  → 10 hour arc

function getSunProgress(h, m) {
  // 6:00 = 0.0, 20:00 = 1.0
  const totalMinutes = (h - 6) * 60 + m;
  return Math.max(0, Math.min(1, totalMinutes / (14 * 60)));
}

function getMoonProgress(h, m) {
  // 20:00 = 0.0, 06:00 next day = 1.0  (10 hour arc)
  let adj = h < 6 ? h + 24 : h;
  const totalMinutes = (adj - 20) * 60 + m;
  return Math.max(0, Math.min(1, totalMinutes / (10 * 60)));
}

function isNightTime(h) {
  return h >= 20 || h < 6;
}

// Arc path: progress 0 = left horizon, 0.5 = top center, 1 = right horizon
function getCelestialPosition(progress) {
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Arc from left to right along a smooth curve
  const margin = W * 0.08;
  const x = margin + progress * (W - margin * 2);

  // Parabolic arc — peaks near top 15% of screen
  const arcHeight = H * 0.72;
  const peak      = H * 0.12;
  const p = progress * 2 - 1; // -1 to 1
  const y = peak + arcHeight * (p * p); // parabola

  return { x, y };
}

// Sun color based on time of day
function getSunStyle(progress) {
  // progress 0 = sunrise/sunset (orange-red), 0.5 = noon (bright yellow-white)
  const mid = 1 - Math.abs(progress - 0.5) * 2; // 0 at edges, 1 at noon

  // Brightness: dim at horizon, bright at noon
  const brightness = 0.45 + mid * 0.55;

  // Color: red-orange at horizon → yellow-white at noon
  const r = 255;
  const g = Math.round(120 + mid * 135);   // 120 → 255
  const b = Math.round(mid * 120);          // 0   → 120

  // Glow color shifts too
  const glowR = 255;
  const glowG = Math.round(100 + mid * 100);
  const glowB = Math.round(mid * 50);

  const size = Math.round(90 + mid * 40); // slightly bigger at noon

  return { brightness, color: `rgb(${r},${g},${b})`, glowColor: `rgb(${glowR},${glowG},${glowB})`, size };
}

// Moon color based on progress
function getMoonStyle(progress) {
  const mid = 1 - Math.abs(progress - 0.5) * 2;
  const brightness = 0.4 + mid * 0.6;
  const size = Math.round(80 + mid * 30);
  return { brightness, size };
}

// Sky background gradient based on hour
function getSkyGradient(h, m) {
  const totalMins = h * 60 + m;

  // Key times and their sky colors [top, bottom]
  const keyframes = [
    { t: 0,    top: '#05071a', bot: '#05071a' }, // midnight
    { t: 300,  top: '#05071a', bot: '#05071a' }, // 5am still night
    { t: 360,  top: '#1a1a3a', bot: '#e8602a' }, // 6am sunrise
    { t: 420,  top: '#2a5a8a', bot: '#f0a050' }, // 7am
    { t: 480,  top: '#3a7ab8', bot: '#87ceeb' }, // 8am
    { t: 600,  top: '#4a90d9', bot: '#87ceeb' }, // 10am
    { t: 720,  top: '#1a5fa8', bot: '#4a90d9' }, // noon peak blue
    { t: 900,  top: '#3a7ab8', bot: '#87ceeb' }, // 3pm
    { t: 1080, top: '#2a5a8a', bot: '#f0a050' }, // 6pm golden hour
    { t: 1140, top: '#1a1a3a', bot: '#e8602a' }, // 7pm sunset
    { t: 1200, top: '#05071a', bot: '#05071a' }, // 8pm night
    { t: 1440, top: '#05071a', bot: '#05071a' }, // midnight
  ];

  // Find surrounding keyframes
  let a = keyframes[0], b = keyframes[keyframes.length - 1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (totalMins >= keyframes[i].t && totalMins <= keyframes[i+1].t) {
      a = keyframes[i];
      b = keyframes[i+1];
      break;
    }
  }

  const frac = (totalMins - a.t) / (b.t - a.t || 1);
  return { top: a.top, bot: a.bot, frac, aTop: a.top, bTop: b.top, aBot: a.bot, bBot: b.bot };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return { r, g, b };
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return `rgb(${Math.round(a.r+(b.r-a.r)*t)},${Math.round(a.g+(b.g-a.g)*t)},${Math.round(a.b+(b.b-a.b)*t)})`;
}

// ── Main update ────────────────────────────────────────
const celestial = document.getElementById('celestial');
const sky       = document.querySelector('.sky');

function updateCelestial() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = now.getMinutes();
  const night = isNightTime(h);

  // Stars fade in at night, out during day
  const starOpacity = night ? 1 : 0;

  // Sky gradient
  const sg = getSkyGradient(h, m);
  const topColor = lerpColor(sg.aTop, sg.bTop, sg.frac);
  const botColor = lerpColor(sg.aBot, sg.bBot, sg.frac);
  sky.style.background = `linear-gradient(to bottom, ${topColor} 0%, ${botColor} 100%)`;

  // Celestial position & style
  if (night) {
    celestial.classList.remove('sun');
    celestial.classList.add('moon');

    const prog  = getMoonProgress(h, m);
    const pos   = getCelestialPosition(prog);
    const style = getMoonStyle(prog);

    celestial.style.left   = `${pos.x - style.size/2}px`;
    celestial.style.top    = `${pos.y - style.size/2}px`;
    celestial.style.width  = `${style.size}px`;
    celestial.style.height = `${style.size}px`;
    celestial.style.opacity = style.brightness;
    celestial.style.right  = 'unset';

  } else {
    celestial.classList.remove('moon');
    celestial.classList.add('sun');

    const prog  = getSunProgress(h, m);
    const pos   = getCelestialPosition(prog);
    const style = getSunStyle(prog);

    celestial.style.left   = `${pos.x - style.size/2}px`;
    celestial.style.top    = `${pos.y - style.size/2}px`;
    celestial.style.width  = `${style.size}px`;
    celestial.style.height = `${style.size}px`;
    celestial.style.opacity = style.brightness;
    celestial.style.right  = 'unset';

    // Dynamic sun color
    celestial.style.background =
      `radial-gradient(circle at 40% 38%, #fff9c4 0%, ${style.color} 50%, ${style.glowColor} 100%)`;
  }

  drawStars(starOpacity);
}

// ── Animation loop ─────────────────────────────────────
function loop() {
  updateCelestial();
  requestAnimationFrame(loop);
}
loop();

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

updateClock();
setInterval(updateClock, 1000);
