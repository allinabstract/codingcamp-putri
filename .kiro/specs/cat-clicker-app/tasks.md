# Implementation Plan: Cat Clicker App

## Overview

Build a single-page, zero-build cat clicker web app using HTML5, Tailwind CSS (CDN), and Vanilla JavaScript. The implementation follows a thin MVC pattern: a plain JS state object (Model), direct DOM manipulation (View), and a `handlePet()` controller function. All logic, styling, and markup is delivered in at most 3 files with no build step.

## Tasks

- [x] 1. Set up project file structure and base HTML
  - Create `index.html` with the full HTML5 boilerplate
  - Add `<link>` tag in `<head>` to load Quicksand from Google Fonts with `sans-serif` fallback
  - Add Tailwind CSS v3 CDN `<script>` tag in `<head>`
  - Add an inline `<style>` block for critical fallback styles (pastel gradient, flexbox centering, min-sizes) in case Tailwind CDN fails
  - Add `<script src="app.js">` tag (or inline `<script>`) at the bottom of `<body>`
  - Apply `font-family: 'Quicksand', sans-serif` to `body` or `:root` in the style block
  - _Requirements: 7.1, 7.2, 9.1, 9.2, 9.3, 9.4_

- [x] 2. Implement the pastel gradient background and layout wrapper
  - [x] 2.1 Apply the full-viewport pastel gradient to `<body>`
    - Use `background: linear-gradient(135deg, #fce4ec 0%, #ede7f6 40%, #fff3e0 70%, #e8f5e9 100%)` with `min-height: 100vh`
    - Ensure no horizontal or vertical scrollbars are introduced by the gradient itself
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 2.2 Create the `<main>` layout wrapper
    - Apply Tailwind classes `flex flex-col items-center justify-center min-h-screen gap-4 p-4`
    - Arrange children top-to-bottom: Reaction Display → Cat Container → Pet Counter
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 3. Build the Cat component
  - [x] 3.1 Implement the cat container and image element
    - Create `<div id="cat-container">` with `class="aspect-square cursor-pointer select-none"` and a minimum rendered size of 200×200 px
    - Add `<img id="cat-img" src="cat.svg" alt="A cute cat">` inside the container
    - Add a CSS-drawn or emoji `.cat-fallback` element (initially hidden) in the same position and size
    - Wire `onerror` on `<img>` to hide `#cat-img` and show `.cat-fallback`
    - Apply a drop shadow or soft platform style so the cat is visually separated from the background
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 3.2 Add the cat bounce animation
    - Define a `cat-bounce` CSS keyframe animation (scale ≥ 1.15× or bounce ≥ 6 px, duration 300 ms)
    - In `app.js`, toggle the `cat-bounce` class on `#cat-container` when a pet event fires; remove it via the `animationend` event listener
    - Handle rapid tapping by removing and re-adding `cat-bounce` so the animation restarts from the beginning on each pet event
    - _Requirements: 2.4, 2.5, 2.6_

- [x] 4. Implement the app state model and core logic in `app.js`
  - [x] 4.1 Define the AppState object and ReactionPool constant
    - Create `const state = { petCount: 0, currentReaction: "", isAnimating: false }`
    - Create `const REACTIONS = [...]` with at least 12 distinct strings
    - Define `const ANIMATION_DURATION_MS = 300` and `const REACTION_MIN_VISIBLE_MS = 1500`
    - _Requirements: 2.3, 3.1, 4.2_
  - [x] 4.2 Implement the `pickReaction(currentReaction)` pure function
    - Randomly select from `REACTIONS` using `Math.floor(Math.random() * REACTIONS.length)`
    - If result equals `currentReaction`, re-roll once to guarantee variety
    - Return the selected reaction string; never return empty string or undefined
    - _Requirements: 2.3, 3.2, 3.3_
  - [x]* 4.3 Write property test for `pickReaction` — Property 2: Reaction always from pool
    - **Property 2: Reaction is always from the pool**
    - **Validates: Requirements 2.3, 3.1, 3.2**
    - Use fast-check: `fc.property(fc.integer({ min: 1, max: 200 }), ...)` — run ≥ 100 iterations
  - [x]* 4.4 Write property test for `pickReaction` — Property 3: Consecutive reactions always differ
    - **Property 3: Consecutive reactions always differ**
    - **Validates: Requirements 3.3**
    - Use fast-check: verify that for any sequence of ≥ 2 pet events, no two consecutive reactions are equal — run ≥ 100 iterations
  - [x] 4.5 Implement the `handlePet(state)` controller function
    - Increment `state.petCount` by 1
    - Call `pickReaction(state.currentReaction)` and assign result to `state.currentReaction`
    - Trigger the bounce animation (remove/re-add `cat-bounce` class)
    - Call `renderReaction(state.currentReaction)` and `renderCounter(state.petCount)` to update the DOM
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 4.3_
  - [x]* 4.6 Write property test for `handlePet` — Property 1: Pet counter monotonically increases
    - **Property 1: Pet counter monotonically increases**
    - **Validates: Requirements 2.2, 4.2, 4.3**
    - Use fast-check: `fc.property(fc.integer({ min: 1, max: 500 }), (n) => { ... return s.petCount === n; })` — run ≥ 100 iterations

- [x] 5. Build the Reaction Display component and Pet Counter component
  - [x] 5.1 Implement the Reaction Display in HTML and wire the `renderReaction` function
    - Create `<div id="reaction-display">` with Tailwind classes `bg-white/30 backdrop-blur-lg rounded-full border border-white/40 px-6 py-2`
    - Set default text content to `"Pet me! 🐾"` so the idle prompt appears on load
    - Write `renderReaction(text)` in `app.js` to set `#reaction-display` textContent
    - Ensure min font size is 14 px and contrast ratio ≥ 4.5:1 (WCAG AA) against the glassmorphism + gradient background
    - _Requirements: 3.2, 3.4, 3.5, 6.1, 6.2, 6.3_
  - [x] 5.2 Implement the Pet Counter in HTML and wire the `renderCounter` function
    - Create `<div id="pet-counter">` with the same glassmorphism Tailwind classes; include `Pets: <span id="counter-value">0</span>`
    - Write `renderCounter(n)` in `app.js` to update `#counter-value` textContent to `String(n)`
    - Ensure `#counter-value` is updated within 100 ms of the pet event (synchronous JS guarantees this)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2_
  - [x]* 5.3 Write property test for `renderCounter` — Property 4: Counter display always contains label and count
    - **Property 4: Counter display string always contains label and count**
    - **Validates: Requirements 4.5**
    - Use fast-check: `fc.property(fc.integer({ min: 0, max: 500 }), (n) => { const text = renderCounter(n); return text.includes("Pets:") && text.includes(String(n)); })` — run ≥ 100 iterations

- [x] 6. Wire click/tap event listener and integrate all components
  - [x] 6.1 Attach click event listener to `#cat-container`
    - Add `document.getElementById('cat-container').addEventListener('click', () => handlePet(state))`
    - Ensure the listener fires for both mouse clicks and touch taps
    - _Requirements: 2.1_
  - [x] 6.2 Verify initial page load state
    - On `DOMContentLoaded`, confirm `#counter-value` shows `"0"` and `#reaction-display` shows `"Pet me! 🐾"`
    - _Requirements: 3.4, 4.1, 4.2_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement CDN fallback resilience
  - [x] 8.1 Add inline critical CSS fallback styles
    - In the `<style>` block, duplicate all layout-critical rules: flexbox centering, gradient background, `min-height: 100 vh`, `min-width: 200 px` for the cat container, and base font-family with `sans-serif` fallback
    - Verify these styles produce a functional layout when Tailwind CDN is blocked
    - _Requirements: 9.4_
  - [x] 8.2 Validate cat image fallback
    - Ensure the `onerror` handler on `<img id="cat-img">` hides the image and shows `.cat-fallback` emoji element at the same 200×200 px minimum size
    - _Requirements: 1.5, 9.4_

- [x] 9. Apply typography and final styling polish
  - [x] 9.1 Verify font loading and fallback
    - Confirm the Google Fonts `<link>` tag is present in `<head>` with Quicksand
    - Confirm the CSS rule `font-family: 'Quicksand', sans-serif` applies to `body` or `:root`
    - Confirm Pet_Counter values and Reaction_Display text render in Quicksand when the font is available
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Final checkpoint — Ensure all tests pass and do a responsive layout review
  - Ensure all tests pass, ask the user if questions arise.
  - Manually verify layout at 320 px, 640 px, 1280 px, and 1920 px widths to confirm: no horizontal overflow, cat is centered, correct stacking order, and minimum 16 px gap between elements at ≥ 640 px.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- The design explicitly uses Vanilla JavaScript (ES2020+) — no framework or library dependencies
- Property-based tests use [fast-check](https://github.com/dubzzz/fast-check); core logic (`pickReaction`, `handlePet`, `renderCounter`) must be exported as pure functions or isolated in a testable module
- Checkpoints ensure incremental validation at logical milestones
- All four correctness properties from the design are covered by property-based test sub-tasks (4.3, 4.4, 4.6, 5.3)
- WCAG AA contrast (4.5:1) should be verified with a browser accessibility tool or contrast checker

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2"] },
    { "id": 1, "tasks": ["3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "4.2", "5.1", "5.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "4.5", "5.3"] },
    { "id": 4, "tasks": ["4.6", "6.1", "6.2"] },
    { "id": 5, "tasks": ["8.1", "8.2", "9.1"] }
  ]
}
```
