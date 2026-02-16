const board=document.querySelector(".board");
const startbtn=document.querySelector(".startbtn");
const modal=document.querySelector(".modal");
const startgame=document.querySelector(".startgame");
const gameover=document.querySelector(".gameover");
const restartbtn=document.querySelector(".restartbtn");
const score=document.querySelector(".Score");
const highscore=document.querySelector(".High-score");
const time=document.querySelector(".timer");

const blockheight=40;
const blockwidth=40;

const cols=Math.floor(board.clientWidth/blockwidth);
const rows=Math.floor(board.clientHeight/blockheight);

let Score=0;
let Highscore=localStorage.getItem("Highscores") || 0;
let timer=`00:00`;

highscore.innerText=Highscore;
score.innerText=Score;
time.innerText=timer;

let timeinterval=null;
let intervalid=null;
let speed = 250;

// playbtn.classList.add("Play-btn");
// playbtn.innerText="play";
// board.appendChild(playbtn);
let food={x:Math.floor(Math.random()*rows),y:Math.floor(Math.random()*cols)};
let blocks=[];
let snake=[{x:1,y:3}];

for(let i=0;i<rows;i++){
    for(let j=0;j<cols;j++){
        const block=document.createElement("div");
        block.classList.add("block");
        board.appendChild(block);
        // block.innerText=`${i},${j}`;
        blocks[`${i},${j}`]=block;
    }
}
 var direction="down";

function render() {

    blocks[`${food.x},${food.y}`].classList.add("food");

    
    let head=null;
    if(direction==="left"){
        head={x:snake[0].x,y:snake[0].y-1};
    }
    if(direction==="right"){
        head={x:snake[0].x,y:snake[0].y+1};
    }
    if(direction==="up"){
        head={x:snake[0].x-1,y:snake[0].y};
    }
    if(direction==="down"){
        head={x:snake[0].x+1,y:snake[0].y};
    }
    if(head.x<0|| head.x>=rows || head.y<0 || head.y>=cols){
        // alert("Game Over");
        clearInterval(intervalid);
        modal.style.display="flex";
        startgame.style.display="none";
        gameover.style.display="flex";
        return;
    }

    // Self collision check
for(let segment of snake){
    if(segment.x === head.x && segment.y === head.y){
        clearInterval(intervalid);
        modal.style.display="flex";
        startgame.style.display="none";
        gameover.style.display="flex";
        return;
    }
}

    
     
    if(food.x===head.x && food.y===head.y){
            blocks[`${food.x},${food.y}`].classList.remove("food");
    
        food={x:Math.floor(Math.random()*rows),y:Math.floor(Math.random()*cols)};
        blocks[`${food.x},${food.y}`].classList.add("food"); 
        snake.unshift(head); 
        Score +=10;
        score.innerText=Score;
        if(Score>Highscore){
            Highscore=Score;
            localStorage.setItem("Highscores",Highscore.toString());
        }
        if(Score % 50 === 0){
    speed -= 30;

    if(speed < 50) speed = 50; // minimum limit

    clearInterval(intervalid);
    intervalid = setInterval(render, speed);
}
    }
        
    snake.forEach(val=>{
       blocks[`${val.x},${val.y}`].classList.remove("fill");
    })
    snake.unshift(head);
    snake.pop();
    snake.forEach(segment=>{
        blocks[`${segment.x},${segment.y}`].classList.add("fill");
    })

   
}
   


startbtn.addEventListener("click",()=>{
    modal.style.display="none";
    // modal.style.pointerEvents = "none";

    // intervalid=setInterval(()=>{render()},250)
    intervalid=setInterval(render, speed);
    timeinterval=setInterval(()=>{
        let [min,sec]=timer.split(":").map(Number);
         if(sec==59){
            min+=1;
            sec=0;
         }
         else{
            sec+=1;
         }
         timer=`${min}:${sec}`;
            time.innerText=timer;
    },1000)
})
restartbtn.addEventListener("click",restartgame)

function restartgame(){
    modal.style.display="none";
    // modal.style.pointerEvents = "auto";

    Score=0;
    timer=`00:00`;
    highscore.innerText=Highscore;
    score.innerText=Score;
    time.innerText=timer;
     blocks[`${food.x},${food.y}`].classList.remove("food");
    snake.forEach(val=>{
       blocks[`${val.x},${val.y}`].classList.remove("fill");
    })
    snake.length=1;
    snake[0]={x:1,y:3};
    direction="down";
    food={x:Math.floor(Math.random()*rows),y:Math.floor(Math.random()*cols)};
    speed = 250;   // reset speed
clearInterval(intervalid);
intervalid = setInterval(render, speed);


}


addEventListener("keydown",(event)=>{
   if(event.key==="ArrowLeft" && direction !== "right"){
    direction="left";
}
if(event.key==="ArrowRight" && direction !== "left"){
    direction="right";
}
if(event.key==="ArrowUp" && direction !== "down"){
    direction="up";
}
if(event.key==="ArrowDown" && direction !== "up"){
    direction="down";
}

})