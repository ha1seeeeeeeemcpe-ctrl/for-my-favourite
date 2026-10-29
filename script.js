
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

// Full-screen particle scene.
// The lock screen above this section is intentionally left unchanged.
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.round(canvasWidth * dpr);
  canvas.height = Math.round(canvasHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (surpriseScreen.classList.contains("visible")) {
    createSceneParticles();
    animateParticles();
  }
}

function heartPoint(t, scale) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x: x * scale, y: y * scale };
}

function makeParticle(x, y, size = 1.5, target = null) {
  return {
    x,
    y,
    startX: x,
    startY: y,
    targetX: target ? target.x : x,
    targetY: target ? target.y : y,
    size: size * (0.75 + Math.random() * 0.65),
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: target ? 0 : Math.random() * 0.28,
    targetAlpha: target ? 0.82 + Math.random() * 0.18 : 0.18 + Math.random() * 0.3,
    phase: Math.random() * Math.PI * 2,
    drift: 0.4 + Math.random() * 1.1,
    delay: target ? Math.random() * 420 : 0,
    isShape: Boolean(target)
  };
}

function getTextPoints(text, cx, cy, maxWidth, fontSize) {
  const sample = document.createElement("canvas");
  const sctx = sample.getContext("2d");
  sample.width = Math.max(1, Math.ceil(maxWidth));
  sample.height = Math.max(1, Math.ceil(fontSize * 1.8));

  sctx.fillStyle = "#fff";
  sctx.textAlign = "center";
  sctx.textBaseline = "middle";
  sctx.font = `700 ${fontSize}px Georgia, serif`;
  sctx.fillText(text, sample.width / 2, sample.height / 2, maxWidth * 0.96);

  const pixels = sctx.getImageData(0, 0, sample.width, sample.height).data;
  const points = [];
  const step = Math.max(3, Math.round(fontSize / 10));

  for (let y = 0; y < sample.height; y += step) {
    for (let x = 0; x < sample.width; x += step) {
      if (pixels[(y * sample.width + x) * 4 + 3] > 100) {
        points.push({
          x: cx + x - sample.width / 2,
          y: cy + y - sample.height / 2
        });
      }
    }
  }
  return points;
}

function createSceneParticles() {
  if (!canvasWidth || !canvasHeight || !ctx) return;
  particles = [];

  // Measure the reserved area between the heading and the subtitle.
  // The lock screen and its markup/styles are not changed.
  const stage = document.querySelector(".heart-stage");
  const rect = stage ? stage.getBoundingClientRect() : {
    left: 0, top: 0, width: canvasWidth, height: canvasHeight * 0.58
  };

  const stageWidth = Math.max(220, rect.width || canvasWidth * 0.8);
  const stageHeight = Math.max(260, rect.height || canvasHeight * 0.55);
  const cx = rect.left + stageWidth / 2;
  const cy = rect.top + stageHeight / 2;
  const scale = Math.min(stageWidth / 37, stageHeight / 36, 12.5);

  // Every heart/text particle starts at a random point across the full viewport.
  // Their destinations are the sampled heart outline and the particle lettering.
  const heartCount = Math.min(760, Math.max(430, Math.round(stageWidth * 1.15)));
  for (let i = 0; i < heartCount; i++) {
    const point = heartPoint((i / heartCount) * Math.PI * 2, scale);
    const originX = Math.random() * canvasWidth;
    const originY = Math.random() * canvasHeight;
    particles.push(makeParticle(originX, originY, 1.45, {
      x: cx + point.x,
      y: cy + point.y
    }));
  }

  const fontSize = Math.min(37, Math.max(20, stageWidth * 0.072));
  const textPoints = getTextPoints(
    "I LOVE YOU",
    cx,
    cy + stageHeight * 0.015,
    Math.min(stageWidth * 0.76, 430),
    fontSize
  );

  for (const point of textPoints) {
    const originX = Math.random() * canvasWidth;
    const originY = Math.random() * canvasHeight;
    particles.push(makeParticle(originX, originY, 1.55, point));
  }

  // A smaller layer of soft ambient sparkles remains around the formed shape.
  const ambientCount = Math.min(170, Math.round(canvasWidth * canvasHeight / 5200));
  for (let i = 0; i < ambientCount; i++) {
    particles.push(makeParticle(
      Math.random() * canvasWidth,
      Math.random() * canvasHeight,
      0.8 + Math.random() * 0.8
    ));
  }
}

function animateParticles() {
  if (!ctx) return;
  cancelAnimationFrame(animationId);
  const startTime = performance.now();
  const gatherDuration = 2450;

  function frame(now) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    for (const p of particles) {
      if (p.isShape) {
        const elapsed = Math.max(0, now - startTime - p.delay);
        const progress = Math.min(1, elapsed / gatherDuration);
        // Smooth ease-out: particles visibly travel in from across the screen.
        const eased = 1 - Math.pow(1 - progress, 3);
        p.x = p.startX + (p.targetX - p.startX) * eased;
        p.y = p.startY + (p.targetY - p.startY) * eased;
        p.alpha = Math.min(p.targetAlpha, progress * 1.45);
      } else {
        p.alpha += (p.targetAlpha - p.alpha) * 0.018;
      }

      const shimmer = 0.78 + Math.sin(now * 0.0012 * p.drift + p.phase) * 0.22;
      ctx.globalAlpha = Math.max(0, p.alpha * shimmer);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.isShape ? 8 : 5;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    animationId = requestAnimationFrame(frame);
  }

  frame(startTime);
}

// Replay starts a fresh gathering animation from new random positions.
replayButton.addEventListener("click", () => {
  createSceneParticles();
  animateParticles();
});

window.addEventListener("resize", resizeCanvas);
