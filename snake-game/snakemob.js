

// board.style.touchAction = "none";

// let startX = 0;
// let startY = 0;

// board.addEventListener("touchstart", (e) => {
  
//     startX = e.touches[0].clientX;
//     startY = e.touches[0].clientY;
// }, { passive: true });

// board.addEventListener("touchend", (e) => {
//       console.log("Touch started");
//     let endX = e.changedTouches[0].clientX;
//     let endY = e.changedTouches[0].clientY;

//     let diffX = endX - startX;
//     let diffY = endY - startY;

//     if (Math.abs(diffX) > Math.abs(diffY)) {
//         if (diffX > 30 && direction !== "left") direction = "right";
//         else if (diffX < -30 && direction !== "right") direction = "left";
//     } else {
//         if (diffY > 30 && direction !== "up") direction = "down";
//         else if (diffY < -30 && direction !== "down") direction = "up";
//     }
// }, { passive: true });




board.style.touchAction = "none";

let startX = 0;
let startY = 0;

board.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
});

board.addEventListener("pointerup", (e) => {
    let endX = e.clientX;
    let endY = e.clientY;

    let diffX = endX - startX;
    let diffY = endY - startY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 30 && direction !== "left") direction = "right";
        else if (diffX < -30 && direction !== "right") direction = "left";
    } else {
        if (diffY > 30 && direction !== "up") direction = "down";
        else if (diffY < -30 && direction !== "down") direction = "up";
    }
});
