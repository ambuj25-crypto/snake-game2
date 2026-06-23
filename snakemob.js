// =============================================================================
//  snakemob.js — Full-screen invisible swipe controls
// =============================================================================
//
//  D-pad buttons are gone. Direction is controlled entirely by swiping
//  anywhere on the screen with a finger.
//
//  HOW IT WORKS:
//  ─────────────
//  • touchstart  → record finger's starting X/Y + timestamp
//  • touchend    → measure delta; pick the dominant axis; update direction
//
//  WHY document AND NOT board:
//  ────────────────────────────
//  Listening on `document` means the player can swipe literally anywhere on
//  the screen — the board, the info bar, anywhere — and the snake responds.
//  This is the UX players expect from mobile snake games.
//
//  WHY { passive: false } + e.preventDefault():
//  ─────────────────────────────────────────────
//  Mobile browsers register touch listeners as "passive" by default, meaning
//  they will start scrolling/pull-to-refreshing the page BEFORE your JS code
//  even runs.  { passive: false } opts out of that optimisation so that
//  e.preventDefault() can actually block the scroll before it begins.
// =============================================================================

// -- Stop the board element from triggering its own native scroll/zoom --------
board.style.touchAction = "none";

// -- Touch state --------------------------------------------------------------
let touchStartX  = 0;
let touchStartY  = 0;
let touchStartMs = 0;

// =============================================================================
//  touchstart — record where and when the finger landed
//  Listener is on `document` → works anywhere on the screen
// =============================================================================
document.addEventListener("touchstart", (e) => {
    // Prevent pull-to-refresh and any other native gesture from starting
    e.preventDefault();

    const touch  = e.touches[0];
    touchStartX  = touch.clientX;
    touchStartY  = touch.clientY;
    touchStartMs = Date.now();
}, { passive: false });   // passive:false is required for preventDefault() to work

// =============================================================================
//  touchend — compute delta and decide swipe direction
//  Listener is on `document` → works anywhere on the screen
// =============================================================================
document.addEventListener("touchend", (e) => {
    // Prevent the 300 ms tap-delay and tap-to-zoom
    e.preventDefault();

    // changedTouches[0] holds the finger that just lifted
    // (e.touches[] is empty at this point)
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;   // +ve → swiped right
    const diffY = touch.clientY - touchStartY;   // +ve → swiped down

    // Guard 1: minimum distance (30 px) — ignores taps and micro-jitter
    const MIN_PX = 30;
    if (Math.abs(diffX) < MIN_PX && Math.abs(diffY) < MIN_PX) return;

    // Guard 2: maximum duration (500 ms) — slow presses are not swipes
    if (Date.now() - touchStartMs > 500) return;

    // Determine dominant axis and update the snake's direction variable
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && direction !== "left")   direction = "right";
        else if (diffX < 0 && direction !== "right") direction = "left";
    } else {
        // Vertical swipe
        if (diffY > 0 && direction !== "up")     direction = "down";
        else if (diffY < 0 && direction !== "down")  direction = "up";
    }
}, { passive: false });   // passive:false is required for preventDefault() to work
