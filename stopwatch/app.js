/**
 * Stopwatch — app.js
 *
 * Timing strategy: performance.now() delta, NOT setInterval tick-counting.
 * setInterval is used only to schedule display refreshes (~50ms cadence).
 *
 * State machine:
 *   IDLE ──[Start]──► RUNNING ──[Pause]──► PAUSED
 *     ▲                  │                    │
 *     └──────[Reset]─────┴────────[Reset]─────┘
 *                        │
 *                     [Lap] → appends to lap list (no state change)
 */

'use strict';

// ── State ────────────────────────────────────────────────────────────────────

let state            = 'idle';   // 'idle' | 'running' | 'paused'
let startTimestamp   = 0;        // performance.now() anchor
let accumulatedMs    = 0;        // ms elapsed before the current run segment
let rafId            = null;     // requestAnimationFrame handle
let laps             = [];       // { num, split, cumulative } objects
let lastLapMs        = 0;        // cumulative ms at the last lap recording

// ── DOM refs ─────────────────────────────────────────────────────────────────

const timerDisplay  = document.getElementById('timer-display');
const btnStart      = document.getElementById('btn-start');
const btnLap        = document.getElementById('btn-lap');
const btnReset      = document.getElementById('btn-reset');
const lapList       = document.getElementById('lap-list');
const lapBody       = document.getElementById('lap-body');
const lapEmpty      = document.getElementById('lap-empty');
const lapCount      = document.getElementById('lap-count');
const accentLine    = document.getElementById('accent-line');
const appLabel      = document.getElementById('app-label');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * @param {number} n
 * @returns {string} zero-padded two-digit string
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Format milliseconds → HH:MM:SS.cs (centiseconds = 2 digits)
 * @param {number} ms
 * @returns {string}
 */
function formatTime(ms) {
  const totalCentiseconds = Math.floor(ms / 10);
  const cs   = totalCentiseconds % 100;
  const secs = Math.floor(totalCentiseconds / 100) % 60;
  const mins = Math.floor(totalCentiseconds / 6000) % 60;
  const hrs  = Math.floor(totalCentiseconds / 360000);
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(cs)}`;
}

/**
 * Render the timer display, colouring the centiseconds separately.
 * @param {number} ms
 */
function renderDisplay(ms) {
  const formatted = formatTime(ms);
  // Split at the last '.' to isolate centiseconds
  const dotIdx = formatted.lastIndexOf('.');
  const main   = formatted.slice(0, dotIdx + 1);  // "HH:MM:SS."
  const cs     = formatted.slice(dotIdx + 1);      // "cs"

  timerDisplay.innerHTML =
    `${main}<span class="timer-ms" aria-hidden="true">${cs}</span>`;

  // Keep the accessible label in sync (plain text, no extra DOM)
  timerDisplay.setAttribute('aria-label', `Elapsed time: ${formatted}`);
}

/**
 * Current elapsed ms — always safe to call regardless of state.
 * @returns {number}
 */
function getElapsedMs() {
  if (state === 'running') {
    return performance.now() - startTimestamp;
  }
  return accumulatedMs;
}

// ── Accent line animation ─────────────────────────────────────────────────────
// The line sweeps 0→100% over 60s using a CSS animation.
// On pause, we freeze it in place by snapshotting computed width and removing
// the animation class. On resume, we restart from 0 — simple and reliable.

function startAccentLine() {
  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  accentLine.style.width = '';           // let CSS animation control width
  accentLine.classList.add('is-animating');
}

function stopAccentLine() {
  accentLine.classList.remove('is-animating');
  accentLine.style.width = '0%';
}

// ── Animation loop ────────────────────────────────────────────────────────────

function tick() {
  if (state !== 'running') return;
  renderDisplay(getElapsedMs());
  rafId = requestAnimationFrame(tick);
}

// ── State transitions ─────────────────────────────────────────────────────────

function start() {
  if (state === 'running') return;
  // Compute new anchor: now minus whatever we already have accumulated
  startTimestamp = performance.now() - accumulatedMs;
  state = 'running';
  rafId = requestAnimationFrame(tick);
  startAccentLine();
  updateUI();
}

function pause() {
  if (state !== 'running') return;
  cancelAnimationFrame(rafId);
  accumulatedMs = performance.now() - startTimestamp;
  state = 'paused';
  stopAccentLine();
  renderDisplay(accumulatedMs);  // freeze display at exact pause moment
  updateUI();
}

function reset() {
  cancelAnimationFrame(rafId);
  state          = 'idle';
  accumulatedMs  = 0;
  startTimestamp = 0;
  lastLapMs      = 0;
  laps           = [];
  stopAccentLine();
  renderDisplay(0);
  renderLaps();
  updateUI();
}

function recordLap() {
  if (state !== 'running') return;
  const cumulative = getElapsedMs();
  const split      = cumulative - lastLapMs;
  lastLapMs        = cumulative;
  const lapNum     = laps.length + 1;   // ordinal computed BEFORE unshift

  laps.unshift({ num: lapNum, split, cumulative });

  renderLaps();
}

// ── UI updater ────────────────────────────────────────────────────────────────

function updateUI() {
  const isRunning = state === 'running';
  const isIdle    = state === 'idle';

  // Start / Pause button
  btnStart.textContent  = isRunning ? 'Pause' : 'Start';
  btnStart.setAttribute('aria-label', isRunning ? 'Pause stopwatch' : 'Start stopwatch');
  btnStart.classList.toggle('is-running', isRunning);

  // Lap button — only active while running
  btnLap.disabled = !isRunning;
  btnLap.setAttribute('aria-disabled', String(!isRunning));

  // Running indicator dot on header label
  appLabel.classList.toggle('is-running', isRunning);
}

// ── Lap list renderer ─────────────────────────────────────────────────────────

function renderLaps() {
  lapCount.textContent = laps.length > 0 ? `${laps.length} lap${laps.length !== 1 ? 's' : ''}` : '';

  if (laps.length === 0) {
    lapList.innerHTML = '';
    lapEmpty.hidden   = false;
    return;
  }

  lapEmpty.hidden = true;

  const fragment = document.createDocumentFragment();

  laps.forEach((lap) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="lap-num">${pad(lap.num)}</span>
      <span class="lap-split">${formatTime(lap.split)}</span>
      <span class="lap-cumulative">${formatTime(lap.cumulative)}</span>
    `;
    fragment.appendChild(li);
  });

  lapList.innerHTML = '';
  lapList.appendChild(fragment);

  // Scroll to top so newest lap is visible
  lapBody.scrollTop = 0;
}

// ── Button event listeners ────────────────────────────────────────────────────

btnStart.addEventListener('click', () => {
  if (state === 'running') {
    pause();
  } else {
    start();
  }
});

btnLap.addEventListener('click', () => {
  recordLap();
});

btnReset.addEventListener('click', () => {
  reset();
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  // Ignore if focus is inside an input/textarea (none here, but defensive)
  if (e.target.matches('input, textarea, select')) return;

  switch (e.key) {
    case ' ':
    case 'Spacebar':          // legacy Firefox
      e.preventDefault();    // prevent page scroll
      if (state === 'running') {
        pause();
      } else {
        start();
      }
      break;

    case 'l':
    case 'L':
      if (state === 'running') recordLap();
      break;

    case 'r':
    case 'R':
      reset();
      break;
  }
});

// ── Initialise ────────────────────────────────────────────────────────────────

(function init() {
  renderDisplay(0);
  renderLaps();
  updateUI();
})();
