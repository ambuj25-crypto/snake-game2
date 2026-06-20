const board = document.querySelector(".board");
const startbtn = document.querySelector(".startbtn");
const modal = document.querySelector(".modal");
const startgame = document.querySelector(".startgame");
const gameover = document.querySelector(".gameover");
const restartbtn = document.querySelector(".restartbtn");
const score = document.querySelector(".Score");
const highscore = document.querySelector(".High-score");
const time = document.querySelector(".timer");

// ── Grid config: always 15×15 cells ─────────────────────────
const COLS = 15;
const ROWS = 15;

// Block size is computed dynamically from board's rendered size
function getBlockSize() {
    const bw = board.clientWidth;
    const bh = board.clientHeight;
    return Math.floor(Math.min(bw / COLS, bh / ROWS));
}

let Score = 0;
let Highscore = localStorage.getItem("Highscores") || 0;
let timerStr = "00:00";
let timerSeconds = 0;

highscore.innerText = Highscore;
score.innerText = Score;
time.innerText = timerStr;

let timeinterval = null;
let intervalid = null;
let speed = 250;

let food = { x: Math.floor(Math.random() * ROWS), y: Math.floor(Math.random() * COLS) };
let blocks = [];
let snake = [{ x: 1, y: 3 }];
var direction = "down";

// ── Build the grid ────────────────────────────────────────────
function buildGrid() {
    board.innerHTML = "";
    blocks = [];

    const blockSize = getBlockSize();

    // Set grid via inline style so it always matches computed block size
    board.style.gridTemplateColumns = `repeat(${COLS}, ${blockSize}px)`;
    board.style.gridTemplateRows = `repeat(${ROWS}, ${blockSize}px)`;

    // Center the grid inside the board container
    board.style.width = `${blockSize * COLS}px`;
    board.style.height = `${blockSize * ROWS}px`;

    // Update background grid size to match block size
    board.style.backgroundSize = `${blockSize}px ${blockSize}px`;

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const block = document.createElement("div");
            block.classList.add("block");
            block.style.width = `${blockSize}px`;
            block.style.height = `${blockSize}px`;
            board.appendChild(block);
            blocks[`${i},${j}`] = block;
        }
    }
}

// Rebuild grid on window resize (handles orientation change on mobile)
let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        buildGrid();
        // Re-render current snake & food positions
        renderStatic();
    }, 150);
});

function renderStatic() {
    // Re-draw food
    if (blocks[`${food.x},${food.y}`]) {
        blocks[`${food.x},${food.y}`].classList.add("food");
    }
    // Re-draw snake
    snake.forEach(seg => {
        if (blocks[`${seg.x},${seg.y}`]) {
            blocks[`${seg.x},${seg.y}`].classList.add("fill");
        }
    });
}

buildGrid();

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
        endGame();
        return;
    }

    // Self collision
    for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            endGame();
            return;
        }
    }

    // Food eaten
    if (food.x === head.x && food.y === head.y) {
        blocks[`${food.x},${food.y}`].classList.remove("food");

        // Place new food — make sure it doesn't land on snake
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * ROWS),
                y: Math.floor(Math.random() * COLS)
            };
        } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));

        food = newFood;
        blocks[`${food.x},${food.y}`].classList.add("food");

        snake.unshift(head);  // grow snake
        Score += 10;
        score.innerText = Score;

        if (Score > Highscore) {
            Highscore = Score;
            highscore.innerText = Highscore;
            localStorage.setItem("Highscores", Highscore.toString());
        }

        // Speed up every 50 points
        if (Score % 50 === 0) {
            speed -= 30;
            if (speed < 50) speed = 50;
            clearInterval(intervalid);
            intervalid = setInterval(render, speed);
        }
    } else {
        // Move snake: clear tail, add new head
        snake.forEach(val => {
            blocks[`${val.x},${val.y}`].classList.remove("fill");
        });
        snake.unshift(head);
        snake.pop();
        snake.forEach(segment => {
            blocks[`${segment.x},${segment.y}`].classList.add("fill");
        });
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

// ── Timer helper ──────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }

function startTimer() {
    timerSeconds = 0;
    timerStr = "00:00";
    time.innerText = timerStr;
    clearInterval(timeinterval);
    timeinterval = setInterval(() => {
        timerSeconds++;
        const min = Math.floor(timerSeconds / 60);
        const sec = timerSeconds % 60;
        timerStr = `${pad(min)}:${pad(sec)}`;
        time.innerText = timerStr;
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

    // Clear old positions
    blocks[`${food.x},${food.y}`].classList.remove("food");
    snake.forEach(val => {
        blocks[`${val.x},${val.y}`].classList.remove("fill");
    });

    // Reset state
    snake.length = 1;
    snake[0] = { x: 1, y: 3 };
    direction = "down";

    // New food position (not on snake)
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * ROWS),
            y: Math.floor(Math.random() * COLS)
        };
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
