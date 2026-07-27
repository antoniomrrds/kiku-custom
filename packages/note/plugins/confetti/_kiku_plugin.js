/**
 * @import { KikuPlugin } from "#/plugins/plugin-types";
 */

/** @type { KikuPlugin } */
export const plugin = {
  onPluginLoad: () => {
    setupConfetti();
  },
};

/** @type {Config} */
const CONFIG = {
  key: "3", // key to press to launch confetti
  maxProgress: 50, // press count to reach max values (stats cap here)
  particleCount: [20, 100], // number of particles [at press 0, at maxProgress]
  startVelocity: [45, 60], // initial speed [at press 0, at maxProgress]
  gravity: [1.5, 2], // how fast particles fall [at press 0, at maxProgress]
  spread: [45, 60], // launch angle spread [at press 0, at maxProgress]
  fireworksCheckpoints: [20, 40, 60, 80, 100, 150, 200, 300, 400, 500, 1000], // press counts that trigger a fireworks burst
  fireworksDuration: 1 * 1000, // how long fireworks last (ms)
};

const CDN_URL = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/+esm";

/**
 * @typedef {{
 *   particleCount?: number;
 *   angle?: number;
 *   spread?: number;
 *   startVelocity?: number;
 *   gravity?: number;
 *   origin?: { x: number; y: number };
 *   colors?: string[];
 *   ticks?: number;
 *   zIndex?: number;
 *   scalar?: number;
 *   shapes?: string[];
 * }} ConfettiOptions
 */

/**
 * @typedef {{
 *   key: string;
 *   maxProgress: number;
 *   fireworksCheckpoints: number[];
 *   particleCount: [number, number];
 *   startVelocity: [number, number];
 *   gravity: [number, number];
 *   spread: [number, number];
 *   fireworksDuration: number;
 * }} Config
 */

/**
 * @param {number} progress
 * @param {[number, number]} range
 */
function lerp(progress, [min, max]) {
  return min + (progress / CONFIG.maxProgress) * (max - min);
}

/**
 * @param {(opts: ConfettiOptions) => void} confetti
 * @param {number} duration
 */
function fireworks(confetti, duration) {
  var animationEnd = Date.now() + duration;
  var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  /** @param {number} min @param {number} max */
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  var interval = setInterval(function () {
    var timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    var particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * @param {(opts: ConfettiOptions) => void} confetti
 */
function starBurst(confetti) {
  var defaults = {
    spread: 360,
    ticks: 50,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
  };

  function shoot() {
    confetti({ ...defaults, particleCount: 40, scalar: 1.2, shapes: ["star"] });
    confetti({ ...defaults, particleCount: 10, scalar: 0.75, shapes: ["circle"] });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

function setupConfetti() {
  if (/** @type {{ __confettiLoaded?: boolean }} */ (window).__confettiLoaded) return;
  /** @type {{ __confettiLoaded?: boolean }} */ (window).__confettiLoaded = true;

  let lastFire = 0;
  let starFired = false;

  import(CDN_URL)
    .then((mod) => {
      /** @type {(opts: ConfettiOptions) => void} */
      const confetti = /** @type {any} */ (mod).default;
      /** @type {{ confetti?: typeof confetti }} */ (window).confetti = confetti;

      document.addEventListener("keyup", (e) => {
        if (e.key !== CONFIG.key) return;
        const now = Date.now();
        if (now - lastFire < 300) return;
        lastFire = now;

        const prev = parseInt(sessionStorage.getItem("confetti-press-count") ?? "0", 10);
        const count = prev + 1;
        const progress = Math.min(prev, CONFIG.maxProgress);
        sessionStorage.setItem("confetti-press-count", String(count));

        confetti({
          angle: 60,
          origin: { x: 0, y: 1 },
          spread: lerp(progress, CONFIG.spread),
          particleCount: Math.round(lerp(progress, CONFIG.particleCount)),
          startVelocity: lerp(progress, CONFIG.startVelocity),
          gravity: lerp(progress, CONFIG.gravity),
        });
        confetti({
          angle: 120,
          origin: { x: 1, y: 1 },
          spread: lerp(progress, CONFIG.spread),
          particleCount: Math.round(lerp(progress, CONFIG.particleCount)),
          startVelocity: lerp(progress, CONFIG.startVelocity),
          gravity: lerp(progress, CONFIG.gravity),
        });

        if (CONFIG.fireworksCheckpoints.includes(count))
          fireworks(confetti, CONFIG.fireworksDuration);

        if (progress >= CONFIG.maxProgress && !starFired) {
          starFired = true;
          starBurst(confetti);
        }
      });
    })
    .catch(() => {});
}
