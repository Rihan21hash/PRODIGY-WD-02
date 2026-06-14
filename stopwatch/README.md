# Stopwatch — Prodigy Infotech · Task 02

A precision, instrument-panel-style stopwatch built with plain HTML, CSS, and JavaScript. No libraries, no build tools, no network required after the first load.

---

## How to Open

1. Navigate to the `stopwatch/` folder.
2. Double-click **`index.html`** — it opens directly from the filesystem (`file://`).
3. No server, no installation, no `npm install`.

> **Tip:** If you're using VS Code, the *Live Server* extension also works fine.

---

## Features

| Feature | Detail |
|---|---|
| **Precision timing** | `performance.now()` delta — no drift over long runs |
| **Display format** | `HH:MM:SS.cs` (centiseconds, 2 digits) |
| **Start / Pause / Resume** | Single button; no time lost on pause/resume |
| **Reset** | Zeroes display and clears lap list instantly |
| **Lap recording** | Split + cumulative, most recent on top |
| **Accent line** | 2px sweep animation across the timer (60s loop, runs-only) |
| **Keyboard shortcuts** | See table below |
| **Accessibility** | WCAG 2.1 AA contrast, `aria-live`, `:focus-visible`, `prefers-reduced-motion` |
| **Offline** | Zero external requests required after first font cache |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Start / Pause |
| `L` | Record lap *(only while running)* |
| `R` | Reset |

---

## Browser Support

| Browser | Minimum version |
|---|---|
| Chrome | 108+ |
| Firefox | 110+ |
| Safari | 15.4+ |
| Edge | 108+ |

---

## File Structure

```
stopwatch/
├── index.html   ← Entry point; open this in your browser
├── style.css    ← All styles (design tokens, layout, animations)
├── app.js       ← All logic (timing, state machine, lap recording)
└── README.md    ← This file
```

---

## Design Notes

- **Palette:** Dark instrument panel (`#0F0F0F` background, `#C8F04A` accent)
- **Typography:** *JetBrains Mono* for digits (Google Fonts, falls back to Courier New); *Inter* for labels
- **Accent line:** Animates `width: 0%→100%` over 60 s while running, resets to 0 on pause. Disabled when `prefers-reduced-motion: reduce` is set.
- **Lap button** is visually disabled (opacity 0.28, `cursor: not-allowed`) when the watch is idle or paused — matches PRD spec F-07.

---

## Open Questions (from PRD)

| # | Question | Status |
|---|---|---|
| OQ-01 | Persist laps via `localStorage`? | Out of scope for v1 — laps clear on refresh |
| OQ-02 | Single `.html` file vs. 3-file structure? | 3-file structure chosen for maintainability |
| OQ-03 | Accent line tied to elapsed seconds vs. fixed 60s loop? | Fixed 60s loop (resets on pause) |
