const board = document.querySelector(".board");
const startbtn = document.querySelector(".startbtn");
const modal = document.querySelector(".modal");
const startgame = document.querySelector(".startgame");
const gameover = document.querySelector(".gameover");
const restartbtn = document.querySelector(".restartbtn");
const score = document.querySelector(".Score");
const highscore = document.querySelector(".High-score");
const time = document.querySelector(".timer");

// ── Dynamic grid dimensions (set by buildGrid, never hardcoded) ──────────────
// CHANGED: These are now 'let' variables so buildGrid() can recalculate them
// whenever the board is resized/re-oriented. Hardcoding COLS/ROWS to 15 caused
// the grid to overflow on portrait-mobile viewports where the board is narrower
// than 15 × minimum-block-size pixels.
let COLS = 15;
let ROWS = 15;

let Score = 0;
let Highscore = localStorage.getItem("Highscores") || 0;
let timerSeconds = 0;

highscore.innerText = Highscore;
score.innerText = Score;
time.innerText = "00:00";

let timeinterval = null;
let intervalid = null;
let speed = 250;

// Food position is re-randomised after the first buildGrid() call (below)
let food = { x: 2, y: 2 };
let blocks = [];
let snake = [{ x: 1, y: 3 }];
var direction = "down";

// ── Build the grid after CSS has rendered ─────────────────────────────────────
// CHANGED: buildGrid now DERIVES COLS and ROWS from the board's actual pixel
// dimensions instead of using fixed constants.
//
// Why this fixes the mobile scaling bug:
//   On a portrait phone the board can be ~360 px wide × ~440 px tall. With a
//   hard-coded 15×15 grid the block size would be floor(360/15) = 24 px, making
//   the full grid 360×360 — which fits width-wise but leaves the ROWS correct.
//   However, when the CSS square is smaller (e.g. 300 px on very small phones)
//   the blocks were spilling outside the board rect, breaking click-target
//   lookup and causing wrap-around movement bugs.
//
//   Now we:
//     1. Measure the board's rendered width AND height separately.
//     2. Choose a cell size that fills the SMALLER dimension with 15 cells,
//        but never smaller than MIN_CELL_PX (keeps cells touchable).
//     3. Derive ROWS from height and COLS from width using that cell size.
//     4. Keep the board a perfect grid of integer-pixel cells (no fractional px).
function buildGrid() {
    board.innerHTML = "";
    blocks = [];

    // -- Step 1: Read available space from the WRAPPER, not the board ----------
    // We measure the wrapper (the stable 100%-wide parent) rather than the board
    // itself. Measuring the board would create a feedback loop: each call reads
    // the already-shrunk px value JS set last time, making the grid smaller on
    // every resize. The wrapper always reflects the true available screen space.
    const wrapper  = board.parentElement;
    const wrapperW = wrapper.clientWidth;   // full available width  in CSS px
    const wrapperH = wrapper.clientHeight;  // full available height in CSS px

    // Subtract the wrapper's own padding (0 8px 8px 8px) so the grid sits
    // flush inside the padded area. wrapper.clientWidth already excludes padding
    // because clientWidth = content width, so no further adjustment needed.
    const boardW = wrapperW;
    const boardH = wrapperH;

    // -- Step 2: Compute cell size ---------------------------------------------
    // Cell size is driven by the SHORTER dimension so cells are always square.
    // On a wide desktop (e.g. 1920×950 minus info bar) the height is shorter,
    // so blockSize = floor(950 / 15) = 63 px → a wide landscape grid.
    // On a tall portrait phone (e.g. 412×700) width is shorter,
    // so blockSize = floor(412 / 15) = 27 px → a tall portrait grid.
    const MIN_CELL_PX  = 18;  // never smaller than 18 px (touchable minimum)
    const TARGET_CELLS = 15;  // cells on the short axis
    const rawCell  = Math.floor(Math.min(boardW, boardH) / TARGET_CELLS);
    const blockSize = Math.max(rawCell, MIN_CELL_PX);

    // -- Step 3: Derive COLS and ROWS from blockSize ---------------------------
    // How many whole cells fit across width? How many down height?
    // This is the key: COLS and ROWS fill the FULL available space.
    COLS = Math.floor(boardW / blockSize);
    ROWS = Math.floor(boardH / blockSize);

    if (COLS < 5) COLS = 5;
    if (ROWS < 5) ROWS = 5;

    // -- Step 4: Snap the board to exact integer-pixel multiples ---------------
    // exactW and exactH are guaranteed multiples of blockSize, so the snake
    // ALWAYS touches the border exactly — no fractional-pixel dead zone.
    // The inline style overrides the CSS class rule (inline > class; no !important).
    const exactW = COLS * blockSize;
    const exactH = ROWS * blockSize;
    board.style.width  = `${exactW}px`;
    board.style.height = `${exactH}px`;

    board.style.gridTemplateColumns = `repeat(${COLS}, ${blockSize}px)`;
    board.style.gridTemplateRows    = `repeat(${ROWS}, ${blockSize}px)`;
    board.style.backgroundSize      = `${blockSize}px ${blockSize}px`;

    // -- Step 5: Populate the block lookup map ---------------------------------
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const block = document.createElement("div");
            block.classList.add("block");
            block.style.width  = `${blockSize}px`;
            block.style.height = `${blockSize}px`;
            board.appendChild(block);
            blocks[`${i},${j}`] = block;
        }
    }
}

// ── Clamp a position to stay inside the current grid ─────────────────────────
// CHANGED: After a resize COLS/ROWS can shrink. This helper moves any out-of-
// bounds coordinate back inside the new grid so we never get a missing-key crash.
function clampToGrid(pos) {
    return {
        x: Math.min(pos.x, ROWS - 1),
        y: Math.min(pos.y, COLS - 1)
    };
}

// ── Rebuild on resize / orientation change ────────────────────────────────────
// CHANGED: After rebuilding we also clamp food & snake positions to the new
// COLS/ROWS so no segment references a cell outside the fresh block map.
let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        buildGrid();

        // Clamp food inside new grid bounds
        food = clampToGrid(food);

        // Clamp every snake segment inside new grid bounds
        snake = snake.map(clampToGrid);
        // Remove duplicate positions that clamping might have created
        snake = snake.filter((seg, idx) =>
            snake.findIndex(s => s.x === seg.x && s.y === seg.y) === idx
        );
        if (snake.length === 0) snake = [{ x: 1, y: 1 }];

        // Re-paint
        if (blocks[`${food.x},${food.y}`]) blocks[`${food.x},${food.y}`].classList.add("food");
        snake.forEach(s => { if (blocks[`${s.x},${s.y}`]) blocks[`${s.x},${s.y}`].classList.add("fill"); });
    }, 150);
});

// ── Wait for full layout before building grid ─────────────────────────────────
// CHANGED: We use two nested rAF calls to make sure flexbox has finished its
// second layout pass (the first rAF fires before flex children have their final
// size on some mobile browsers).
window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            buildGrid();
            // Safe-randomise food AFTER COLS/ROWS are known
            food = {
                x: Math.floor(Math.random() * ROWS),
                y: Math.floor(Math.random() * COLS)
            };
        });
    });
});

// ── Game loop ─────────────────────────────────────────────────
function render() {
    blocks[`${food.x},${food.y}`].classList.add("food");

    let head = null;
    if (direction === "left")  head = { x: snake[0].x,     y: snake[0].y - 1 };
    if (direction === "right") head = { x: snake[0].x,     y: snake[0].y + 1 };
    if (direction === "up")    head = { x: snake[0].x - 1, y: snake[0].y     };
    if (direction === "down")  head = { x: snake[0].x + 1, y: snake[0].y     };

    // Wall collision
    if (head.x < 0 || head.x >= ROWS || head.y < 0 || head.y >= COLS) {
        endGame(); return;
    }

    // Self collision
    for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            endGame(); return;
        }
    }

    // Food eaten
    if (food.x === head.x && food.y === head.y) {
        blocks[`${food.x},${food.y}`].classList.remove("food");

        let newFood;
        do {
            newFood = { x: Math.floor(Math.random() * ROWS), y: Math.floor(Math.random() * COLS) };
        } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));
        food = newFood;
        blocks[`${food.x},${food.y}`].classList.add("food");

        snake.unshift(head);
        Score += 10;
        score.innerText = Score;

        if (Score > Highscore) {
            Highscore = Score;
            highscore.innerText = Highscore;
            localStorage.setItem("Highscores", Highscore.toString());
        }

        if (Score % 50 === 0) {
            speed -= 30;
            if (speed < 50) speed = 50;
            clearInterval(intervalid);
            intervalid = setInterval(render, speed);
        }
    } else {
        snake.forEach(val => { blocks[`${val.x},${val.y}`].classList.remove("fill"); });
        snake.unshift(head);
        snake.pop();
        snake.forEach(seg => { blocks[`${seg.x},${seg.y}`].classList.add("fill"); });
    }
}

function endGame() {
    clearInterval(intervalid);
    clearInterval(timeinterval);
    intervalid = null;
    timeinterval = null;
    modal.style.display = "flex";
    startgame.style.display = "none";
    gameover.style.display = "flex";
}

// ── Timer ─────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }

function startTimer() {
    timerSeconds = 0;
    time.innerText = "00:00";
    clearInterval(timeinterval);
    timeinterval = setInterval(() => {
        timerSeconds++;
        time.innerText = `${pad(Math.floor(timerSeconds / 60))}:${pad(timerSeconds % 60)}`;
    }, 1000);
}

// ── Start / Restart ───────────────────────────────────────────
startbtn.addEventListener("click", () => {
    modal.style.display = "none";
    intervalid = setInterval(render, speed);
    startTimer();
});

restartbtn.addEventListener("click", restartgame);

function restartgame() {
    modal.style.display = "none";

    Score = 0;
    speed = 250;
    score.innerText = Score;
    highscore.innerText = Highscore;

    blocks[`${food.x},${food.y}`].classList.remove("food");
    snake.forEach(val => { blocks[`${val.x},${val.y}`].classList.remove("fill"); });

    snake.length = 1;
    snake[0] = { x: 1, y: 3 };
    direction = "down";

    let newFood;
    do {
        newFood = { x: Math.floor(Math.random() * ROWS), y: Math.floor(Math.random() * COLS) };
    } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));
    food = newFood;

    clearInterval(intervalid);
    intervalid = setInterval(render, speed);
    startTimer();
}

// ── Keyboard controls ─────────────────────────────────────────
addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft"  && direction !== "right") direction = "left";
    if (event.key === "ArrowRight" && direction !== "left")  direction = "right";
    if (event.key === "ArrowUp"    && direction !== "down")  direction = "up";
    if (event.key === "ArrowDown"  && direction !== "up")    direction = "down";
});
