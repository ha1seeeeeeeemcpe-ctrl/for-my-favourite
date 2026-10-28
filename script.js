// ===== SETTINGS =====
const SECRET_CODE = "129";

// ===== ELEMENTS =====
const lockScreen = document.getElementById("lockScreen");
const surpriseScreen = document.getElementById("surpriseScreen");
const codeInput = document.getElementById("codeInput");
const statusText = document.getElementById("status");
const unlockButton = document.getElementById("unlockButton");
const replayButton = document.getElementById("replayButton");
const musicButton = document.getElementById("musicButton");
const musicLabel = document.getElementById("musicLabel");
const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");

// ===== FLOATING BACKGROUND HEARTS =====
const floatingLayer = document.querySelector(".floating-hearts");
for (let i = 0; i < 24; i++) {
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.textContent = Math.random() > .5 ? "♥" : "♡";
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${10 + Math.random() * 17}px`;
  heart.style.animationDuration = `${12 + Math.random() * 17}s`;
  heart.style.animationDelay = `${-Math.random() * 25}s`;
  floatingLayer.appendChild(heart);
}

// Small, slow-moving light particles across the whole page.
for (let i = 0; i < 38; i++) {
  const dot = document.createElement("span");
  dot.className = "float-dot";
  dot.style.left = `${Math.random() * 100}%`;
  dot.style.top = `${Math.random() * 100}%`;
  dot.style.setProperty("--drift-x", `${-35 + Math.random() * 70}px`);
  dot.style.setProperty("--drift-y", `${-45 + Math.random() * 90}px`);
  dot.style.animationDuration = `${14 + Math.random() * 20}s`;
  dot.style.animationDelay = `${-Math.random() * 25}s`;
  floatingLayer.appendChild(dot);
}

// ===== CODE CHECK =====
function unlock() {
  const entered = codeInput.value.trim();
  if (entered !== SECRET_CODE) {
    statusText.textContent = "That's not the right code. Try again.";
    statusText.classList.add("error");
    codeInput.value = "";
    codeInput.focus();
    return;
  }

  statusText.textContent = "Unlocked with love!";
  statusText.classList.remove("error");
  lockScreen.classList.add("hide");
  setTimeout(() => {
    lockScreen.style.display = "none";
    surpriseScreen.classList.add("visible");
    surpriseScreen.setAttribute("aria-hidden", "false");
    resizeCanvas();
    createHeartParticles();
    animateParticles();
    startMusic(); // Starts only after the visitor interacts with the page.
  }, 550);
}
unlockButton.addEventListener("click", unlock);
codeInput.addEventListener("keydown", event => {
  if (event.key === "Enter") unlock();
});
codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/[^0-9]/g, "").slice(0, 3);
  statusText.textContent = "Enter the secret code";
  statusText.classList.remove("error");
});

// ===== PARTICLE HEART =====
let particles = [];
let animationId;
let canvasWidth = 0;
let canvasHeight = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = rect.width;
  canvasHeight = rect.height;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (surpriseScreen.classList.contains("visible")) createHeartParticles();
}

function heartPoint(t, scale) {
  // Parametric heart curve.
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x: x * scale, y: y * scale };
}

function createHeartParticles() {
  if (!canvasWidth || !canvasHeight) return;
  const scale = Math.min(canvasWidth / 39, canvasHeight / 34) * .88;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight * .49;
  particles = [];

  // Points around the heart outline.
  const outlineCount = 850;
  for (let i = 0; i < outlineCount; i++) {
    const t = (i / outlineCount) * Math.PI * 2;
    const p = heartPoint(t, scale);
    particles.push(makeParticle(centerX + p.x, centerY + p.y, true));
  }

  // Only the heart outline is filled with particles.
  // This keeps the inside of the heart clean and uncluttered.
}

function makeParticle(x, y, outline) {
  const colors = ["#ff5ca8", "#ff9bc7", "#ffd1e4", "#c78aff", "#fff0f7"];
  return {
    x: Math.random() * canvasWidth, y: Math.random() * canvasHeight,
    tx: x, ty: y, size: outline ? 1 + Math.random() * 1.8 : .7 + Math.random() * 1.4,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: .55 + Math.random() * .45,
    speed: .025 + Math.random() * .055
  };
}

function animateParticles() {
  cancelAnimationFrame(animationId);
  function frame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    for (const p of particles) {
      p.x += (p.tx - p.x) * p.speed;
      p.y += (p.ty - p.y) * p.speed;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    animationId = requestAnimationFrame(frame);
  }
  frame();
}
window.addEventListener("resize", resizeCanvas);
replayButton.addEventListener("click", () => {
  createHeartParticles();
  animateParticles();
});

// ===== ORIGINAL CALM SYNTH MELODY (NO AUDIO FILE NEEDED) =====
let audioContext = null;
let musicTimer = null;
let musicOn = false;
let noteIndex = 0;
const melody = [261.63, 329.63, 392.00, 329.63, 293.66, 349.23, 440.00, 349.23];
const bass = [130.81, 146.83, 110.00, 123.47];

function playNote(frequency, duration, volume, wave = "sine") {
  if (!audioContext || !musicOn) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = wave;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + .12);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + .03);
}

function musicStep() {
  const i = noteIndex % melody.length;
  playNote(melody[i], 1.8, .045);
  if (i % 2 === 0) playNote(bass[Math.floor(i / 2) % bass.length], 3.2, .025);
  noteIndex++;
}

function startMusic() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext = new AudioCtx();
  }
  audioContext.resume();
  musicOn = true;
  musicButton.classList.add("playing");
  musicLabel.textContent = "MUSIC ON";
  clearInterval(musicTimer);
  musicStep();
  musicTimer = setInterval(musicStep, 850);
}

function stopMusic() {
  musicOn = false;
  clearInterval(musicTimer);
  musicButton.classList.remove("playing");
  musicLabel.textContent = "MUSIC OFF";
}

musicButton.addEventListener("click", () => {
  if (musicOn) stopMusic();
  else startMusic();
});
