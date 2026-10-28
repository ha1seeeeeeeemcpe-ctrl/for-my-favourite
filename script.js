
const SECRET_CODE = "129";
const lockScreen = document.getElementById("lockScreen");
const lockCard = document.getElementById("lockCard");
const surpriseScreen = document.getElementById("surpriseScreen");
const statusText = document.getElementById("status");
const unlockButton = document.getElementById("unlockButton");
const replayButton = document.getElementById("replayButton");
const codeDisplay = document.getElementById("codeDisplay");
const digitControls = document.getElementById("codeDisplay");
const canvas = document.getElementById("heartCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let digits = [0, 0, 0], isUnlocking = false, particles = [], animationId;
let canvasWidth = 0, canvasHeight = 0;
const colors = ["#ff5ca8", "#ff9bc7", "#ffd1e4", "#c78aff", "#fff0f7"];

// Floating background decorations
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

// Three independent digit wheels. Values wrap around: 0 - 1 becomes 9,
// and 9 + 1 becomes 0.
function renderCode() {
  digitControls.querySelectorAll(".code-digit").forEach((slot, index) => {
    slot.textContent = String(digits[index]);
  });
}
function changeDigit(index, step) {
  if (isUnlocking) return;
  digits[index] = (digits[index] + step + 10) % 10;
  renderCode();
  statusText.textContent = "A little surprise is waiting...";
  statusText.classList.remove("error");
}
digitControls.addEventListener("click", event => {
  const button = event.target.closest("button[data-index][data-step]");
  if (!button) return;
  changeDigit(Number(button.dataset.index), Number(button.dataset.step));
});

// Keyboard support: left/right selects a digit, up/down changes it.
let selectedDigit = 0;
document.addEventListener("keydown", event => {
  if (isUnlocking || lockScreen.style.display === "none") return;
  if (event.key === "ArrowLeft") { selectedDigit = Math.max(0, selectedDigit - 1); event.preventDefault(); }
  else if (event.key === "ArrowRight") { selectedDigit = Math.min(2, selectedDigit + 1); event.preventDefault(); }
  else if (event.key === "ArrowUp") { changeDigit(selectedDigit, 1); event.preventDefault(); }
  else if (event.key === "ArrowDown") { changeDigit(selectedDigit, -1); event.preventDefault(); }
  else if (event.key === "Enter") unlock();
});

// Unlock animation
function unlock() {
  if (isUnlocking) return;
  const enteredCode = digits.join("");
  if (enteredCode !== SECRET_CODE) {
    statusText.textContent = "Not quite! Try another code.";
    statusText.classList.add("error");
    lockCard.classList.remove("wrong");
    void lockCard.offsetWidth;
    lockCard.classList.add("wrong");
    return;
  }
  isUnlocking = true;
  statusText.textContent = "The lock is opening...";
  unlockButton.disabled = true;
  digitControls.querySelectorAll("button").forEach(button => button.disabled = true);
  lockCard.classList.add("unlocking");
  setTimeout(() => {
    lockScreen.classList.add("hide");
    setTimeout(() => {
      lockScreen.style.display = "none";
      surpriseScreen.classList.add("visible");
      surpriseScreen.setAttribute("aria-hidden", "false");
      document.body.classList.add("particles-active");
      resizeCanvas();
      createSceneParticles();
      animateParticles();
    }, 480);
  }, 760);
}
unlockButton.addEventListener("click", unlock);

// Full-screen particle scene
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.round(canvasWidth * dpr);
  canvas.height = Math.round(canvasHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (surpriseScreen.classList.contains("visible")) createSceneParticles();
}
function heartPoint(t, scale) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
  return { x: x * scale, y: y * scale };
}
function makeParticle(x, y, size = 1.5) {
  return {
    x, y, size: size * (.75 + Math.random() * .65),
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: Math.random() * .25, targetAlpha: .55 + Math.random() * .45,
    phase: Math.random() * Math.PI * 2, drift: .4 + Math.random() * 1.1
  };
}
function getTextPoints(text, cx, cy, maxWidth, fontSize) {
  const sample = document.createElement("canvas");
  const sctx = sample.getContext("2d");
  sample.width = Math.ceil(maxWidth);
  sample.height = Math.ceil(fontSize * 1.65);
  sctx.fillStyle = "#fff";
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.font = `700 ${fontSize}px Georgia, serif`;
  sctx.fillText(text, sample.width / 2, sample.height / 2, maxWidth * .96);
  const pixels = sctx.getImageData(0, 0, sample.width, sample.height).data;
  const points = [];
  const step = Math.max(3, Math.round(fontSize / 10));
  for (let y = 0; y < sample.height; y += step) {
    for (let x = 0; x < sample.width; x += step) {
      if (pixels[(y * sample.width + x) * 4 + 3] > 100) {
        points.push({ x: cx + x - sample.width / 2, y: cy + y - sample.height / 2 });
      }
    }
  }
  return points;
}
function createSceneParticles() {
  if (!canvasWidth || !canvasHeight) return;
  particles = [];

  // Ambient particles distributed across the entire screen
  const ambientCount = Math.min(620, Math.round(canvasWidth * canvasHeight / 1500));
  for (let i = 0; i < ambientCount; i++) {
    particles.push(makeParticle(Math.random() * canvasWidth, Math.random() * canvasHeight, .9 + Math.random() * .8));
  }

  // Glowing heart outline
  const scale = Math.min(canvasWidth / 48, canvasHeight / 43, 13.5);
  const cx = canvasWidth / 2, cy = canvasHeight * .47;
  const heartCount = Math.min(760, Math.max(420, Math.round(canvasWidth * .9)));
  for (let i = 0; i < heartCount; i++) {
    const p = heartPoint(i / heartCount * Math.PI * 2, scale);
    particles.push(makeParticle(cx + p.x, cy + p.y, 1.25));
  }

  // The message itself is sampled into individual particle positions
  const fontSize = Math.min(42, Math.max(22, canvasWidth * .075));
  const textPoints = getTextPoints("I LOVE YOU", cx, cy + 3, Math.min(canvasWidth * .72, 430), fontSize);
  for (const p of textPoints) particles.push(makeParticle(p.x, p.y, 1.45));
}
function animateParticles() {
  cancelAnimationFrame(animationId);
  function frame(time) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    for (const p of particles) {
      const shimmer = .78 + Math.sin(time * .0012 * p.drift + p.phase) * .22;
      p.alpha += (p.targetAlpha * shimmer - p.alpha) * .035;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 7;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    animationId = requestAnimationFrame(frame);
  }
  frame(0);
}
window.addEventListener("resize", resizeCanvas);
replayButton.addEventListener("click", () => {
  createSceneParticles();
  animateParticles();
});
