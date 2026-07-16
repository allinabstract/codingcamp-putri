# Design Document — Cat Clicker App

## Overview

The Cat Clicker App is a single-page, zero-build web application delivered as a minimal file set (≤ 3 files). Users see a large minimalist cat graphic in the center of the page and can click or tap it to trigger randomized cute reactions. Every pet increments a persistent in-session counter, and the entire experience is wrapped in a soft Cottagecore/Kawaii aesthetic using Tailwind CSS (CDN), a pastel gradient background, and glassmorphism containers.

The implementation language is **Vanilla JavaScript** (ES2020+) with **HTML5** and **Tailwind CSS via CDN**. No build step, no framework, no external JS libraries.

### Key Design Goals

- Immediate interactivity — no loading spinners, no build step, no dependencies to install.
- Resilient degradation — every CDN asset (font, Tailwind, graphic) has a visible fallback so the core interaction is never broken.
- Accessibility baseline — WCAG AA contrast ratios (4.5:1) for all text; interactive elements reachable without horizontal scrolling at 320 px–1920 px.

---

## Architecture

The app follows a **thin MVC** pattern implemented entirely within `index.html` (or split into `index.html` + `style.css` + `app.js`). Because there is no server side, all state lives in the browser's memory for the session duration.

```
┌─────────────────────────────────────────────────────┐
│                     index.html                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   View     │  │  Controller  │  │    Model    │ │
│  │ (HTML/CSS) │◄─│  (app.js)   │─►│ (JS object) │ │
│  └────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Data flow:**

1. User clicks/taps the cat graphic.
2. Controller's `handlePet()` is called.
3. Model state is updated (`petCount++`, new reaction selected).
4. View is re-rendered from the new model state (DOM updates only — no full re-render).

**No routing, no component framework, no virtual DOM.** Direct DOM manipulation keeps the implementation footprint tiny.

### Technology Stack

| Concern | Technology | Loaded via |
|---|---|---|
| Markup & layout | HTML5 | static file |
| Utility CSS | Tailwind CSS v3 | CDN `<script>` |
| Custom styles | Inline `<style>` or `style.css` | static file |
| Interaction logic | Vanilla JS (ES2020+) | `<script>` tag / `app.js` |
| Typography | Google Fonts — Quicksand or Varela Round | CDN `<link>` |
| Cat graphic | SVG inline or `<img>` | static file or inline |

---

## Components and Interfaces

### Cat Component

**Responsibility:** Render the cat graphic and be the click/tap target.

```html
<div id="cat-container" class="aspect-square cursor-pointer select-none ...">
  <img id="cat-img" src="cat.svg" alt="A cute cat" ...>
  <!-- fallback: emoji cat rendered in CSS if img fails -->
  <div class="cat-fallback hidden">🐱</div>
</div>
```

- `id="cat-container"` — receives the click event listener.
- Minimum rendered size 200 × 200 px at all supported viewports (Req 1.1).
- `onerror` on `<img>` hides the `<img>` and shows the `.cat-fallback` element in the same position and size (Req 1.5).
- A drop shadow or soft platform element ensures the cat is visually separated from the page background (Req 1.4).
- Animation class `cat-bounce` toggled on pet; removed after animation ends via `animationend` event.
- `cat-bounce` keyframe must include a scale of at least **1.15×** the Cat's normal size or a bounce displacement of at least **6 px** (Req 2.5).

### Reaction Display Component

**Responsibility:** Show the current reaction text or the idle prompt.

```html
<div id="reaction-display"
     class="bg-white/30 backdrop-blur-lg rounded-full border border-white/40 px-6 py-2 ...">
  Pet me! 🐾
</div>
```

- Default content: `"Pet me! 🐾"` (idle prompt shown before first pet event — Req 3.4).
- Updated by `Controller.renderReaction(text)`.
- Min font size 14 px; contrast ratio ≥ 4.5:1 (WCAG AA) against glassmorphism + gradient background (Req 3.5).

### Pet Counter Component

**Responsibility:** Display the cumulative pet count.

```html
<div id="pet-counter"
     class="bg-white/30 backdrop-blur-lg rounded-full border border-white/40 px-6 py-2 ...">
  Pets: <span id="counter-value">0</span>
</div>
```

- Label "Pets:" always visible alongside `<span id="counter-value">` (Req 4.5).
- Updated by `Controller.renderCounter(n)`.
- DOM update completes within 100 ms of the pet event (synchronous JS execution guarantees this — Req 4.3).
- Initial displayed value is `0` on page load (Req 4.2).

### Page Background

**Responsibility:** Render the full-viewport pastel gradient.

Applied to `<body>` or a dedicated wrapper `<div>`:

```css
background: linear-gradient(135deg, #fce4ec 0%, #ede7f6 40%, #fff3e0 70%, #e8f5e9 100%);
min-height: 100vh;
```

Covers 100% of viewport width and height with no scrollbars introduced by the gradient itself (Req 5.3). Uses at least two soft pastel color stops from pinks, lavenders, peaches, and mints (Req 5.2).

### Layout Wrapper

**Responsibility:** Center all elements, manage responsive stacking.

```html
<main class="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
  <!-- Cat Container -->
  <!-- Reaction Display -->
  <!-- Pet Counter -->
</main>
```

- Single column at all widths (320 px–1920 px) per requirements.
- `gap-4` (16 px) minimum gap between elements at ≥ 640 px (Req 8.4).
- Stack order from top to bottom: **Cat → Reaction Display → Pet Counter** (Req 8.3).
  - At viewport widths < 640 px (mobile), this vertical single-column order applies.
  - At viewport widths ≥ 640 px, the same centered single-column layout is maintained with a minimum 16 px vertical gap between elements.

---

## Data Models

### AppState

The entire runtime state is held in a single plain JavaScript object:

```js
const state = {
  petCount: 0,              // integer ≥ 0; total pets in this session
  currentReaction: "",      // string; the reaction currently shown (empty before first pet)
  isAnimating: false,       // boolean; true while cat bounce animation plays
  lastReactionTime: 0,      // number; timestamp (ms) when the current reaction was set
};
```

`lastReactionTime` is used to enforce the 1500 ms minimum visibility window for each reaction (Req 3.2). `handlePet` checks `Date.now() - state.lastReactionTime < REACTION_MIN_VISIBLE_MS`; if true, it increments the counter and replays the animation but does not replace the displayed reaction.

### ReactionPool

An array of at least 10 distinct reaction strings, defined as a constant:

```js
const REACTIONS = [
  "Purr purr~ 😻",
  "Nyaa~ 🐱",
  "*happy kneading* 🐾",
  "Mrrrow! 💕",
  "headbutt~ 🥺",
  "belly rubs?? 🌸",
  "*slow blink* 💤",
  "BISCUITS TIME 🍞",
  "chirp chirp! 🐦",
  "zzz... 😴",
  "loves you back 💖",
  "*zooms* 🌀",
];
```

**Selection rule:** Pick a random index `Math.floor(Math.random() * REACTIONS.length)`. If the result equals `state.currentReaction`, re-roll once (one retry is sufficient given pool size ≥ 10, probability of collision ≤ 10%). The selected reaction is never an empty string or `undefined` (Req 3.2, 2.3).

### Animation Timing Constants

```js
const ANIMATION_DURATION_MS = 300;    // within 200–500ms range (Req 2.4)
const REACTION_MIN_VISIBLE_MS = 1500; // minimum ms a reaction stays visible (Req 3.2)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The prework analysis identified four acceptance criteria suitable for property-based testing. All other criteria are best validated through example-based unit tests, DOM inspection, or manual/accessibility review (see Testing Strategy). After property reflection, all four properties are distinct and non-redundant.

### Property 1: Pet counter monotonically increases

*For any* positive integer `n`, calling `handlePet()` exactly `n` times on a fresh state SHALL result in `state.petCount === n`. The counter SHALL never skip a value or decrease between consecutive pet events.

**Validates: Requirements 2.2, 4.2, 4.3**

---

### Property 2: Reaction is always from the pool

*For any* sequence of pet events of any length, every value assigned to `state.currentReaction` SHALL be a member of the `REACTIONS` array and SHALL never be an empty string or `undefined`.

**Validates: Requirements 2.3, 3.1, 3.2**

---

### Property 3: Consecutive reactions always differ

*For any* sequence of two or more consecutive pet events on a state where `REACTIONS` contains at least 2 distinct strings, the reaction selected after each event SHALL differ from the reaction selected in the immediately preceding event.

**Validates: Requirements 3.3**

---

### Property 4: Counter display string always contains label and count

*For any* value of `petCount` in the range [0, ∞), the string produced by `renderCounter(petCount)` SHALL contain both the label string `"Pets:"` and the decimal string representation of `petCount`, so that the counter is unambiguously readable.

**Validates: Requirements 4.5**

---

## Error Handling

| Failure scenario | Detected by | Recovery behavior |
|---|---|---|
| Cat image fails to load | `<img onerror>` handler | Hide `<img>`, show `.cat-fallback` emoji element in same position/size (Req 1.5) |
| Google Font fails to load | Browser falls back automatically | CSS rule specifies `font-family: 'Quicksand', sans-serif` (or Varela Round); system sans-serif renders (Req 7.2) |
| Tailwind CDN fails to load | Inline `<style>` fallback block | Critical layout styles (flexbox centering, gradient, min-sizes) duplicated in a `<style>` tag (Req 9.4) |
| `Math.random` returns edge values (0 or ~1) | Handled by `Math.floor` clamping | Index always in `[0, REACTIONS.length - 1]`; no out-of-bounds |
| Rapid clicking during animation | Checked by `animationend` reset | Animation class is removed then re-added on each pet event so animation restarts from the beginning (Req 2.6) |
| Rapid clicking within reaction visible window | `lastReactionTime` guard | Counter still increments and animation replays, but reaction text is not replaced until 1500 ms have passed (Req 3.2) |

---

## Testing Strategy

### PBT Applicability Assessment

This feature is primarily a **UI/DOM application** with a thin logic layer. Most acceptance criteria concern visual rendering, aesthetic properties, and responsive layout — none of which are suitable for property-based testing. However, the core logic functions (`pickReaction`, `handlePet`, `renderCounter`) are **pure functions** or near-pure with clear input/output behavior and universal properties, making them good candidates for PBT.

| Layer | Testing approach |
|---|---|
| Reaction selection logic (`pickReaction`) | Property-based tests |
| Counter increment logic (`handlePet`) | Property-based tests |
| Counter render function (`renderCounter`) | Property-based tests |
| DOM update timing | Example-based unit tests |
| Animation class toggling | Example-based unit tests |
| Visual aesthetics / layout | Manual/visual inspection; snapshot tests optional |
| CDN fallback behavior | Example-based integration tests |
| Responsive layout | Manual testing at 320 px, 640 px, 1920 px breakpoints |

### Unit Tests (Example-Based)

- **CT-U1**: On first load, `state.petCount === 0` and `#counter-value` displays `"0"`.
- **CT-U2**: On first load, `#reaction-display` contains the idle prompt `"Pet me! 🐾"`.
- **CT-U3**: After one pet event, `state.petCount === 1` and `#counter-value` displays `"1"`.
- **CT-U4**: After one pet event, `#reaction-display` contains a string from `REACTIONS`.
- **CT-U5**: Triggering `handlePet()` while `isAnimating === true` removes and re-adds `cat-bounce` class so the animation restarts.
- **CT-U6**: When cat `<img>` `onerror` fires, `.cat-fallback` becomes visible and `#cat-img` is hidden.
- **CT-U7**: `#pet-counter` and `#reaction-display` both have Tailwind classes `bg-white/30`, `backdrop-blur-lg`, `rounded-full`, `border`, `border-white/40`.
- **CT-U8**: Rapid clicks within 1500 ms of the last reaction change increment the counter but do not replace `state.currentReaction`.

### Property-Based Tests

Using [fast-check](https://github.com/dubzzz/fast-check), a mature JS property-based testing library. Each test is configured to run a minimum of 100 iterations.

**Property Test 1 — Counter monotonically increases**
```js
// Feature: cat-clicker-app, Property 1: pet counter monotonically increases
fc.assert(
  fc.property(fc.integer({ min: 1, max: 500 }), (n) => {
    const s = freshState();
    for (let i = 0; i < n; i++) handlePet(s);
    return s.petCount === n;
  }),
  { numRuns: 100 }
);
```

**Property Test 2 — Reaction always from pool**
```js
// Feature: cat-clicker-app, Property 2: reaction is always from the pool
fc.assert(
  fc.property(fc.integer({ min: 1, max: 200 }), (n) => {
    const s = freshState();
    for (let i = 0; i < n; i++) handlePet(s);
    return REACTIONS.includes(s.currentReaction) && s.currentReaction !== "";
  }),
  { numRuns: 100 }
);
```

**Property Test 3 — Consecutive reactions differ**
```js
// Feature: cat-clicker-app, Property 3: consecutive reactions always differ
fc.assert(
  fc.property(fc.integer({ min: 2, max: 200 }), (n) => {
    const s = freshState();
    let prev = null;
    for (let i = 0; i < n; i++) {
      handlePet(s);
      if (prev !== null && prev === s.currentReaction) return false;
      prev = s.currentReaction;
    }
    return true;
  }),
  { numRuns: 100 }
);
```

**Property Test 4 — Counter display contains label and count**
```js
// Feature: cat-clicker-app, Property 4: counter display string contains label and count
fc.assert(
  fc.property(fc.integer({ min: 0, max: 500 }), (n) => {
    const text = renderCounter(n); // pure render function
    return text.includes("Pets:") && text.includes(String(n));
  }),
  { numRuns: 100 }
);
```

### Integration / Manual Tests

- **CDN failure simulation**: Block Tailwind CDN in DevTools Network tab; confirm layout and interaction still work via inline fallback styles.
- **Font failure simulation**: Block Google Fonts; confirm text renders in system sans-serif.
- **Viewport testing**: Manually verify layout at 320 px, 640 px, 1280 px, 1920 px widths — no horizontal overflow, cat centered, correct stack order (Cat → Reaction Display → Pet Counter), minimum 16 px gap at ≥ 640 px.
- **Animation restart test**: Click cat rapidly (< 100 ms between clicks); confirm each click produces a visible animation restart.
- **Reaction 1500 ms window test**: Click twice in rapid succession (< 1500 ms); confirm reaction text does not change on the second click but counter does increment.
