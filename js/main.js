/* ============================================
MAZE RACE — Computer Engineering Edition
============================================ */
(function() {
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

const CELL = 10;
const GOLD   = { r: 228, g: 168, b: 0   };
const PURPLE = { r: 124, g: 58,  b: 237 };

// Added fontSize here so it's accessible everywhere
let cols, rows, maze, visited, queueA, queueB, phase, resetTimer, fontSize;
let loopCount = 0;
const MAX_LOOPS = 5;
let isRunning = true;
let animationId;

function resize() {
canvas.width  = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
cols = Math.floor(canvas.width  / CELL);
rows = Math.floor(canvas.height / CELL);
if (cols % 2 === 0) cols--;
if (rows % 2 === 0) rows--;
initRace();
}

function generateMaze() {
maze = [];
for (let r = 0; r < rows; r++) maze[r] = new Array(cols).fill(false);
const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
const stack = [{ r: 1, c: 1 }];
maze[1][1] = true;

while (stack.length > 0) {
const { r, c } = stack[stack.length - 1];
const neighbours = [
{ r: r-2, c }, { r: r+2, c }, { r, c: c-2 }, { r, c: c+2 }
].filter(n => inBounds(n.r, n.c) && !maze[n.r][n.c]);

if (neighbours.length === 0) stack.pop();
else {
const next = neighbours[Math.floor(Math.random() * neighbours.length)];
maze[(r + next.r) / 2][(c + next.c) / 2] = true;
maze[next.r][next.c] = true;
stack.push(next);
}
}
}

function randPassage() {
let r, c;
do {
r = 1 + Math.floor(Math.random() * Math.floor(rows / 2)) * 2;
c = 1 + Math.floor(Math.random() * Math.floor(cols / 2)) * 2;
} while (!maze[r][c]);
return { r, c };
}

function drawTextMask() {
const text = 'Zakaria Bouzada';
const offscreen = document.createElement('canvas');
offscreen.width  = canvas.width;
offscreen.height = canvas.height;
const offCtx = offscreen.getContext('2d');

fontSize = Math.floor(canvas.width * 0.055);
offCtx.font = `900 ${fontSize}px 'Times New Roman', serif`;
offCtx.textAlign = 'center';
offCtx.textBaseline = 'middle';

while (offCtx.measureText(text).width > canvas.width * 0.85 && fontSize > 8) {
fontSize--;
offCtx.font = `900 ${fontSize}px 'Times New Roman', serif`;
}

offCtx.fillStyle = 'white';
offCtx.fillText(text, canvas.width / 2, canvas.height / 2);

const pixels = offCtx.getImageData(0, 0, canvas.width, canvas.height).data;
for (let r = 0; r < rows; r++) {
for (let c = 0; c < cols; c++) {
const index = (Math.floor(r * CELL + CELL / 2) * canvas.width + Math.floor(c * CELL + CELL / 2)) * 4;
if (pixels[index + 3] > 128) visited[r][c] = -1;
}
}
}

function initRace() {
generateMaze();
visited = Array.from({ length: rows }, () => new Array(cols).fill(0));
drawTextMask();

let startA = randPassage(), startB = randPassage();
visited[startA.r][startA.c] = 1;
visited[startB.r][startB.c] = 2;

queueA = [{ ...startA, pr: startA.r, pc: startA.c }];
queueB = [{ ...startB, pr: startB.r, pc: startB.c }];
phase = 'racing';
conqueredA = conqueredB = 0;
ctx.clearRect(0, 0, canvas.width, canvas.height);
}

const DIRS = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];
let conqueredA = 0, conqueredB = 0;

function stepAndDraw(queue, id, color) {
const steps = Math.max(1, Math.floor(1 + (id === 1 ? conqueredA : conqueredB) * 0.005));
for (let s = 0; s < steps; s++) {
if (queue.length === 0) break;
const { r, c, pr, pc } = queue.splice(Math.floor(Math.random() * Math.min(5, queue.length)), 1)[0];

// Draw logic
const x = c * CELL, y = r * CELL;
const cx2 = x + CELL / 2;
const cy2 = y + CELL / 2;

if (visited[r][c] !== id + 10) { // If not already visually drawn as text
ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.2)`;
ctx.fillRect(x, y, CELL, CELL);
ctx.strokeStyle = `rgba(${color.r},${color.g},${color.b},0.6)`;
ctx.lineWidth = CELL * 0.5;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(pc * CELL + CELL/2, pr * CELL + CELL/2);
ctx.lineTo(x + CELL/2, y + CELL/2);
ctx.stroke();

const glow = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, CELL * 1.8);
glow.addColorStop(0, `rgba(${color.r},${color.g},${color.b}, 1.0)`); // Brighter core
glow.addColorStop(0.4, `rgba(${color.r},${color.g},${color.b}, 0.2)`);
glow.addColorStop(1, `rgba(${color.r},${color.g},${color.b}, 0)`);

ctx.fillStyle = glow;
ctx.beginPath();
ctx.arc(cx2, cy2, CELL * 1.8, 0, Math.PI * 2);
ctx.fill();
}
DIRS.sort(() => Math.random() - 0.5).forEach(d => {
const nr = r + d.r, nc = c + d.c;
if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc]) {
if (visited[nr][nc] === 0) { // Priority 1: Normal Maze
visited[nr][nc] = id;
queue.push({ r: nr, c: nc, pr: r, pc: c });
id === 1 ? conqueredA++ : conqueredB++;
} else if (visited[nr][nc] === -1) { // Priority 2: The Text (Delayed)
// We "push" text cells to the BACK of the queue so they fill last
visited[nr][nc] = id + 10;
queue.push({ r: nr, c: nc, pr: r, pc: c });
}
}
});
}
}

function stopAnimation() {
isRunning = false;
cancelAnimationFrame(animationId);
clearTimeout(resetTimer); // Stop any pending resets

// Draw default background (e.g., solid dark color)
ctx.fillStyle = '#0d0f1a';
ctx.fillRect(0, 0, canvas.width, canvas.height);

/*// Optional: Draw your name statically so it's always there
ctx.font = `900 ${fontSize}px 'JetBrains Mono', monospace`;
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Zakaria Bouzada', canvas.width / 2, canvas.height / 2);*/
}

function draw() {
if (!isRunning) return;

if (phase === 'racing') {
stepAndDraw(queueA, 1, GOLD);
stepAndDraw(queueB, 2, PURPLE);

if (queueA.length === 0 && queueB.length === 0) {
phase = 'waiting'; // Set to waiting so this block only runs once
loopCount++;
// DELAY: Wait 3 seconds after maze is full
setTimeout(() => {
phase = 'done';

// THE REVEAL
ctx.shadowBlur = 30;
ctx.shadowColor = 'white';
ctx.font = `900 ${fontSize}px 'Times New Roman', serif`;
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Zakaria Bouzada', canvas.width / 2, canvas.height / 2);
ctx.shadowBlur = 0;

// FINAL DELAY: Let the name sit for 2 seconds before fading
if (loopCount < MAX_LOOPS) {
resetTimer = setTimeout(() => {
let f = 0;
// FADE OUT: This clears the screen gradually
const interval = setInterval(() => {
ctx.fillStyle = 'rgba(13, 15, 26, 0.1)'; // Matches background
ctx.fillRect(0, 0, canvas.width, canvas.height);
if (++f > 40) {
clearInterval(interval);
initRace(); // Restarts everything
}
}, 40);
}, 2000);
} else {
console.log("Maze animation complete. Freezing on reveal.");
}
}, 1000); // The 3-second delay you wanted
}
}
animationId = requestAnimationFrame(draw);
}

resize();
window.addEventListener('resize', debounce(resize, 250));
draw();
document.getElementById('stop-maze-btn').addEventListener('click', function() {
stopAnimation();
this.style.display = 'none';
});
})();
/* ============================================
2. TYPING ANIMATION
============================================ */
(function() {
const roles = [
'Data Engineer',
'ML & AI Engineer',
'Backend Developer',
'Cloud Engineer',
'Full-Stack Developer'
];
const el = document.getElementById('typed-role');
let roleIndex = 0, charIndex = 0, deleting = false;

function type() {
const current = roles[roleIndex];
if (!deleting) {
el.textContent = current.slice(0, ++charIndex);
if (charIndex === current.length) {
deleting = true;
setTimeout(type, 1800);
return;
}
} else {
el.textContent = current.slice(0, --charIndex);
if (charIndex === 0) {
deleting = false;
roleIndex = (roleIndex + 1) % roles.length;
}
}
setTimeout(type, deleting ? 45 : 80);
}
setTimeout(type, 800);
})();

/* ============================================
3. SCROLL REVEAL — Intersection Observer
============================================ */
(function() {
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add('visible');
observer.unobserve(entry.target);
}
});
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up, .slide-in-left').forEach(el => observer.observe(el));
})();

/* ============================================
4. ANIMATED STAT COUNTERS
============================================ */
(function() {
const counters = document.querySelectorAll('.stat-number[data-target]');
const seen = new Set();

const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting && !seen.has(entry.target)) {
seen.add(entry.target);
const el = entry.target;
const target = parseInt(el.dataset.target);
const suffix = el.dataset.suffix || '';
const duration = 1200;
const step = target / (duration / 16);
let current = 0;

const timer = setInterval(() => {
current = Math.min(current + step, target);
el.textContent = Math.floor(current).toLocaleString() + suffix;
if (current >= target) clearInterval(timer);
}, 16);
}
});
}, { threshold: 0.5 });

counters.forEach(c => observer.observe(c));
})();

/* ============================================
5. CURSOR DOT TRAIL
============================================ */
(function() {
const dot = document.getElementById('cursorDot');
let mouseX = 0, mouseY = 0;
let dotX = 0, dotY = 0;

document.addEventListener('mousemove', e => {
mouseX = e.clientX;
mouseY = e.clientY;
});

function animate() {
dotX += (mouseX - dotX) * 0.15;
dotY += (mouseY - dotY) * 0.15;
dot.style.left = dotX + 'px';
dot.style.top  = dotY + 'px';
requestAnimationFrame(animate);
}
animate();

// Hide on mobile
if ('ontouchstart' in window) dot.style.display = 'none';
})();

function trackProjectClick(projectName) {
    if (typeof gtag === 'function') {
        gtag('event', 'project_click', { project_name: projectName });
    }
}

function trackCVDownload() {
    if (typeof gtag === 'function') {
        gtag('event', 'cv_download');
    }
}