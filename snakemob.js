// =============================================================================
//  snakemob.js — Mobile swipe controls
// =============================================================================
//
//  FIX SUMMARY:
//  ─────────────────────────────────────────────────────────────────────────
//  BEFORE: touchstart + touchend were on `document` with e.preventDefault()
//  on both. This blocked ALL synthetic click events site-wide, making the
//  "Start Game" and "Restart" buttons impossible to tap on mobile.
//
//  AFTER (3-listener pattern):
//  1. touchstart  on BOARD  — record finger position. No preventDefault().
//  2. touchend    on BOARD  — compute delta, update direction. No preventDefault().
//  3. touchmove   on BOARD  — ONLY prevents the browser scroll/pull-to-refresh.
//
//  Why this works:
//  • Gestures are captured on the game board only. UI buttons outside the
//    board are completely untouched and receive clicks normally.
//  • touchmove fires while the finger is moving (before touchend), so
//    preventing it blocks scroll without affecting tap-to-click flow.
//  • board.style.touchAction = "none" is a CSS-layer hint that tells the
//    browser not to claim the touch event for its own scroll gesture — this
//    works together with the touchmove preventDefault as a belt-and-braces
//    approach for maximum browser compatibility.
// =============================================================================

// CSS-level hint: browser should not handle touch gestures on the board
board.style.touchAction = "none";

// -- Touch state --------------------------------------------------------------
let touchStartX  = 0;
let touchStartY  = 0;
let touchStartMs = 0;

// =============================================================================
//  1. touchstart — record where and when the finger landed
//     Listener: board only (NOT document)
//     No e.preventDefault() — allows synthetic click events to fire normally
// =============================================================================
board.addEventListener("touchstart", (e) => {
    // No preventDefault() here — removing it lets tap events (clicks) on
    // any overlapping UI still fire. The modal buttons are outside the board
    // so this doesn't affect them anyway, but it's correct practice.
    const touch  = e.touches[0];
    touchStartX  = touch.clientX;
    touchStartY  = touch.clientY;
    touchStartMs = Date.now();
}, { passive: true });   // passive:true is safe here since we don't call preventDefault()

// =============================================================================
//  2. touchend — compute delta, decide direction
//     Listener: board only (NOT document)
//     No e.preventDefault() — tap-to-click is unaffected
// =============================================================================
board.addEventListener("touchend", (e) => {
    // No preventDefault() — we only need to read coordinates here, not block anything
    const touch = e.changedTouches[0];   // changedTouches[0] = the finger that lifted
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // Guard: ignore taps (< 30 px) and slow deliberate drags (> 500 ms)
    const MIN_PX = 30;
    const MAX_MS = 500;
    if (Math.abs(diffX) < MIN_PX && Math.abs(diffY) < MIN_PX) return;
    if (Date.now() - touchStartMs > MAX_MS) return;

    // Determine dominant axis and update direction
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && direction !== "left")       direction = "right";
        else if (diffX < 0 && direction !== "right") direction = "left";
    } else {
        // Vertical swipe
        if (diffY > 0 && direction !== "up")         direction = "down";
        else if (diffY < 0 && direction !== "down")  direction = "up";
    }
}, { passive: true });   // passive:true is safe here since we don't call preventDefault()

// =============================================================================
//  3. touchmove — block browser scroll/pull-to-refresh ONLY
//     Listener: board only
//     This is the ONLY place e.preventDefault() is called.
//     touchmove fires while the finger is sliding, which is exactly when
//     the browser would start scrolling the page. Blocking it here is safe
//     because touchmove does not participate in the tap-to-click flow.
// =============================================================================
board.addEventListener("touchmove", (e) => {
    e.preventDefault();   // stop page scroll / pull-to-refresh over the board
}, { passive: false });   // passive:false is REQUIRED for preventDefault() to work
