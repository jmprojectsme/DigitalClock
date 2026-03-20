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

function drawStars(isNight) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!isNight) return; // no stars during the day
  const t = Date.now() / 1000;
  for (const s of stars) {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 215, 255, ${a})`;
    ctx.fill();
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Day / Night logic ──────────────────────────────────
// Day = 6:00 AM to 7:59 PM  |  Night = 8:00 PM to 5:59 AM
function isNightTime(hour) {
  return hour >= 20 || hour < 6;
}

let lastMode = null;

function applyDayNight(hour) {
  const night = isNightTime(hour);
  const mode  = night ? 'night' : 'day';
  if (mode === lastMode) return; // no change needed
  lastMode = mode;

  const sky       = document.querySelector('.sky');
  const celestial = document.getElementById('celestial');

  if (night) {
    sky.classList.remove('daytime');
    sky.classList.add('nighttime');
    celestial.classList.remove('sun');
    celestial.classList.add('moon');
  } else {
    sky.classList.remove('nighttime');
    sky.classList.add('daytime');
    celestial.classList.remove('moon');
    celestial.classList.add('sun');
  }
}

// ── Animation loop ─────────────────────────────────────
function loop() {
  const hour = new Date().getHours();
  drawStars(isNightTime(hour));
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

  applyDayNight(now.getHours());
}

updateClock();
setInterval(updateClock, 1000);
