// app.js — Cat Clicker App
// Core logic is implemented in Tasks 4–6.
// This stub is present so the <script src="app.js"> tag in index.html
// does not produce a 404 error during development.

// --- Model (Task 4.1) --------------------------------------------------------
const state = {
  petCount: 0,
  currentReaction: "",
  isAnimating: false,
  lastReactionTime: 0,
};

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

const ANIMATION_DURATION_MS = 300;    // within 200–500ms range (Req 2.4)
const REACTION_MIN_VISIBLE_MS = 1500; // minimum ms a reaction stays visible (Req 3.2)

// --- Animation (Task 3.2) ----------------------------------------------------

/**
 * triggerBounce — plays the cat-bounce CSS animation on #cat-container.
 *
 * Req 2.4, 2.5: Animation duration is 300ms (within the 200–500ms window);
 *   the keyframe in index.html scales the cat to ≥1.15× (scale 1.18) and
 *   displaces it ≥6px (translateY -6px).
 * Req 2.6: Removing the class, forcing a DOM reflow, then re-adding it
 *   ensures the animation restarts from the beginning even when called
 *   while a previous animation is still playing (rapid-tap support).
 *
 * NOTE: handlePet (Task 4.5) will call this function. The animationend
 *   listener below resets state.isAnimating when the animation finishes.
 */
function triggerBounce() {
  const container = document.getElementById('cat-container');
  container.classList.remove('cat-bounce');
  void container.offsetWidth; // force reflow so animation restarts from frame 0
  container.classList.add('cat-bounce');
  state.isAnimating = true;
}

// Req 2.4, 2.6: Remove cat-bounce class and reset isAnimating flag when the
// animation finishes naturally. Placed at module scope (script executes after
// DOM is ready because the <script> tag is at the bottom of <body>), so
// getElementById is safe here. handlePet (Task 4.5) will call triggerBounce();
// this listener cleans up afterwards.
document.getElementById('cat-container').addEventListener('animationend', () => {
  document.getElementById('cat-container').classList.remove('cat-bounce');
  state.isAnimating = false;
});

// --- Controller (Tasks 4.2, 4.5) ---------------------------------------------

/**
 * pickReaction(currentReaction) — Req 2.3, 3.2, 3.3
 *
 * Pure function: randomly selects a reaction from REACTIONS that differs
 * from the currently displayed one. Re-rolls once (wrap-around) if the
 * first pick matches currentReaction, guaranteeing visible variety.
 * Never returns an empty string or undefined.
 *
 * @param {string} currentReaction - The reaction currently displayed
 * @returns {string} A reaction string from REACTIONS
 */
function pickReaction(currentReaction) {
  let idx = Math.floor(Math.random() * REACTIONS.length);
  if (REACTIONS[idx] === currentReaction) {
    // re-roll once to avoid showing the same reaction consecutively
    idx = (idx + 1) % REACTIONS.length;
  }
  return REACTIONS[idx];
}

/**
 * handlePet(state) — Req 2.1, 2.2, 2.3, 2.4, 2.6, 4.3
 *
 * Controller function invoked on every click/tap of the cat.
 *
 * 1. Increments state.petCount (Req 2.2).
 * 2. Checks the 1500ms reaction visibility window (Req 3.2):
 *    - If no reaction has been shown yet (lastReactionTime === 0), or if at
 *      least REACTION_MIN_VISIBLE_MS have elapsed since the last reaction was
 *      set, selects a new reaction via pickReaction(), updates
 *      state.currentReaction and state.lastReactionTime, and calls
 *      renderReaction() to update the DOM.
 *    - Otherwise the displayed reaction is kept unchanged.
 * 3. Calls triggerBounce() to play the cat animation (Req 2.4, 2.6).
 * 4. Calls renderCounter() to update the pet count in the DOM (Req 4.3).
 *
 * @param {object} state - The shared AppState object
 */
function handlePet(state) {
  state.petCount++;

  const now = Date.now();
  // Only update reaction if 1500ms have passed since last reaction change (Req 3.2)
  // or if no reaction has been shown yet (lastReactionTime === 0)
  if (state.lastReactionTime === 0 || now - state.lastReactionTime >= REACTION_MIN_VISIBLE_MS) {
    state.currentReaction = pickReaction(state.currentReaction);
    state.lastReactionTime = now;
    renderReaction(state.currentReaction);
  }

  triggerBounce();
  renderCounter(state.petCount);
}

// --- View (Tasks 5.1, 5.2) ---------------------------------------------------

/**
 * renderReaction(text) — Req 3.2, 3.4, 3.5, 6.1, 6.2, 6.3
 *
 * Updates the #reaction-display element with the given text.
 *
 * @param {string} text - The reaction string to display
 */
function renderReaction(text) {
  document.getElementById('reaction-display').textContent = text;
}

/**
 * renderCounter(n) — Req 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2
 *
 * Updates the #counter-value span in the DOM synchronously (JS execution
 * guarantees the DOM write completes well within 100 ms — Req 4.3).
 *
 * Also returns the full display string "Pets: <n>" so this function can
 * act as a pure render function for Property Test 4 (Req 4.5).
 *
 * @param {number} n - The current pet count (integer >= 0)
 * @returns {string} The full counter label string, e.g. "Pets: 42"
 */
function renderCounter(n) {
  const displayString = "Pets: " + String(n);
  const el = document.getElementById("counter-value");
  if (el) {
    el.textContent = String(n);
  }
  return displayString;
}

// --- Event wiring (Task 6.1) -------------------------------------------------
document.getElementById('cat-container').addEventListener('click', () => handlePet(state));
