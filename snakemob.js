
board.style.touchAction = "none";

let startX = 0;
let startY = 0;

// Use pointerdown/pointerup for reliable cross-device detection
board.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
});

board.addEventListener("pointerup", (e) => {
    let endX = e.clientX;
    let endY = e.clientY;

    let diffX = endX - startX;
    let diffY = endY - startY;

    // Require a minimum swipe distance to register
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && direction !== "left")  direction = "right";
        else if (diffX < 0 && direction !== "right") direction = "left";
    } else {
        // Vertical swipe
        if (diffY > 0 && direction !== "up")    direction = "down";
        else if (diffY < 0 && direction !== "down") direction = "up";
    }
});

// D-pad button controls
document.querySelectorAll(".dpad-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const dir = btn.dataset.dir;
        if (dir === "left"  && direction !== "right") direction = "left";
        if (dir === "right" && direction !== "left")  direction = "right";
        if (dir === "up"    && direction !== "down")  direction = "up";
        if (dir === "down"  && direction !== "up")    direction = "down";
    });
});
