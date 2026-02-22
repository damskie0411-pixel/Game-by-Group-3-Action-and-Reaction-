const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.7;

const W = canvas.width;
const H = canvas.height;

const scoreEl = document.getElementById("score");
const explanation = document.getElementById("explanation");
const startScreen = document.getElementById("startScreen");
const playBtn = document.getElementById("playBtn");

let gameStarted = false;
let score = 0;

const explanations = [
"Newton’s Third Law: When the rocket pushes exhaust backward, the rocket moves forward.",
"The rocket accelerates because pushing particles backward creates an opposite force.",
"In space, motion happens due to forces between the rocket and exhaust gases.",
"Action and reaction forces allow rockets to travel even without air."
];

// SOUND
const  engineSound = new Audio("rocket.mp3");
engineSound.loop = true;
engineSound.volume = 0.3;

function Vec(x,y){ this.x=x; this.y=y; }

const rocket = {
pos:new Vec(0,0),
vel:new Vec(0,0),
angle:0
};

let goal;
let obstacles=[];
let exhaust=[];
const keys={};
let missionFailed=false;

/* MASSIVE STAR FIELD */
const stars = [];
for (let i = 0; i < 2000; i++) {
    stars.push({
        x: Math.random() * 12000 - 6000,
        y: Math.random() * 12000 - 6000,
        r: Math.random() * 2.2
    });
}

window.addEventListener("keydown",e=>keys[e.code]=true);
window.addEventListener("keyup",e=>keys[e.code]=false);

function bind(btn,key){
btn.addEventListener("touchstart",e=>{
keys[key]=true;
e.preventDefault();
});
btn.addEventListener("touchend",e=>{
keys[key]=false;
e.preventDefault();
});
}

bind(leftBtn,"ArrowLeft");
bind(rightBtn,"ArrowRight");
bind(upBtn,"ArrowUp");
bind(downBtn,"ArrowDown");
bind(restartBtn,"KeyR");

playBtn.onclick=()=>{
startScreen.style.display="none";
gameStarted=true;
};

function spawnGoal(){

let placed = false;

while(!placed){

// pick a random obstacle to place goal near
const base = obstacles[Math.floor(Math.random()*obstacles.length)];

const distance = 180 + Math.random()*220;
const angle = Math.random()*Math.PI*2;

const x = base.x + Math.cos(angle)*distance;
const y = base.y + Math.sin(angle)*distance;

let safe = true;

for(const o of obstacles){
const d = Math.hypot(o.x - x, o.y - y);
if(d < o.r + 80){
safe = false;
break;
}
}

if(safe){
goal = {
x: x,
y: y,
pulse: 0
};
placed = true;
}

}
}

function spawnObstacles(){
obstacles=[];
const pics=[
"asteroid.png",
"asteroid2.png",
"asteroid3.png"    
];
for(let i=0;i<10;i++){
let img=new Image();
img.src=pics[Math.floor(Math.random()*pics.length)];

obstacles.push({
x:rocket.pos.x+(Math.random()*1600-800),
y:rocket.pos.y+(Math.random()*1200-600),
vx:(Math.random()-0.5)*15,
vy:(Math.random()-0.5)*15,
r:35+Math.random()*20,
img:img,

/* NEW ROTATION */
angle: Math.random()*Math.PI*2,
rotSpeed: (Math.random()-0.5)*2
});
}
}

function restart(){
rocket.pos=new Vec(0,0);
rocket.vel=new Vec(0,0);
rocket.angle=0;

score=0;
scoreEl.textContent=score;

missionFailed=false;
explanation.classList.add("hidden");

spawnObstacles(); // only here
spawnGoal();
}

function step(dt){
if(!gameStarted || missionFailed) return;

if(keys["KeyR"]) restart();

// ROTATION
if(keys["ArrowLeft"] || keys["KeyA"]) rocket.angle -= 3*dt;
if(keys["ArrowRight"] || keys["KeyD"]) rocket.angle += 3*dt;

// THRUST
if(keys["ArrowUp"] || keys["KeyW"]){
  rocket.vel.x += Math.cos(rocket.angle) * 200 * dt;
  rocket.vel.y += Math.sin(rocket.angle) * 200 * dt;
    
if(engineSound.paused) engineSound.play();

exhaust.push({
x:rocket.pos.x,
y:rocket.pos.y,
life:1
});
}else{
engineSound.pause();
}

rocket.pos.x+=rocket.vel.x*dt;
rocket.pos.y+=rocket.vel.y*dt;

goal.pulse+=dt*3;

for(const o of obstacles){
o.x += o.vx*dt;
o.y += o.vy*dt;

/* ROTATE ASTEROID */
o.angle += o.rotSpeed * dt;

const d=Math.hypot(o.x-rocket.pos.x,o.y-rocket.pos.y);
if(d<o.r+18){
missionFailed=true;
engineSound.pause();
}
}2

const dx=goal.x-rocket.pos.x;
const dy=goal.y-rocket.pos.y;
if(Math.hypot(dx,dy)<40){
score++;
scoreEl.textContent=score;

explanation.innerText=
explanations[Math.floor(Math.random()*explanations.length)];
explanation.classList.remove("hidden");

spawnGoal(); // obstacles stay
}    
}

function clamp(v,min,max){
return Math.max(min,Math.min(max,v));
}

function draw(){
ctx.clearRect(0,0,W,H);

ctx.save();
ctx.translate(W/2-rocket.pos.x,H/2-rocket.pos.y);

/* stars */
ctx.fillStyle="white";
for(const s of stars){
ctx.globalAlpha = 0.8 + Math.random() * 0.2;    
ctx.beginPath();
ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
ctx.fill();
}
ctx.globalAlpha=1;    

/* glowing goal (original design) */
const pulse=Math.sin(goal.pulse)*6+30;
const grad=ctx.createRadialGradient(goal.x,goal.y,10,goal.x,goal.y,60);
grad.addColorStop(0,"#00fff2");
grad.addColorStop(1,"transparent");
ctx.fillStyle=grad;
ctx.beginPath();
ctx.arc(goal.x,goal.y,60,0,Math.PI*2);
ctx.fill();

ctx.strokeStyle="#00eaff";
ctx.lineWidth=3;
ctx.beginPath();
ctx.arc(goal.x,goal.y,pulse,0,Math.PI*2);
ctx.stroke();

/* obstacles */
for(const o of obstacles){
ctx.save();
ctx.translate(o.x,o.y);
ctx.rotate(o.angle);
ctx.drawImage(o.img,-o.r,-o.r,o.r*2,o.r*2);
ctx.restore();
}
    
/* ROCKET */
ctx.save();
ctx.translate(rocket.pos.x,rocket.pos.y);
ctx.rotate(rocket.angle);

/* GLOW ENGINE */
const glow=ctx.createRadialGradient(-10,0,0,-10,0,25);
glow.addColorStop(0,"rgba(255,200,100,0.7)");
glow.addColorStop(1,"transparent");
ctx.fillStyle=glow;
ctx.beginPath();
ctx.arc(-10,0,25,0,Math.PI*2);
ctx.fill();

/* ORIGINAL LONG FLAME */
if(keys["ArrowUp"]){
const flameLength=28+Math.random()*20;

const flameGrad=ctx.createLinearGradient(-14,0,-50,0);
flameGrad.addColorStop(0,"#ffffff");
flameGrad.addColorStop(0.3,"#ffd000");
flameGrad.addColorStop(1,"#ff5a00");

ctx.fillStyle=flameGrad;
ctx.beginPath();
ctx.moveTo(-14,0);
ctx.lineTo(-14,-7);
ctx.lineTo(-flameLength,-3);
ctx.lineTo(-flameLength,3);
ctx.lineTo(-14,7);
ctx.closePath();
ctx.fill();
}

/* ROCKET BODY */
ctx.fillStyle="#e6f2ff";
ctx.beginPath();
ctx.moveTo(22,0);
ctx.lineTo(-14,10);
ctx.lineTo(-14,-10);
ctx.closePath();
ctx.fill();

ctx.fillStyle="#00d4ff";
ctx.beginPath();
ctx.arc(4,0,4,0,Math.PI*2);
ctx.fill();

ctx.fillStyle="#ff4d4d";
ctx.fillRect(-14,-10,6,6);
ctx.fillRect(-14,4,6,6);

ctx.restore();
ctx.restore();
    

/* MINIMAP (clamped inside box) */
const size=130;
const x0=W-size-20;
const y0=20;

ctx.fillStyle="rgba(0,0,0,0.5)";
ctx.fillRect(x0,y0,size,size);
ctx.strokeStyle="#00eaff";
ctx.strokeRect(x0,y0,size,size);

const scale=0.04;
const centerX=x0+size/2;
const centerY=y0+size/2;

function mapPos(dx,dy){
let x=centerX+dx*scale;
let y=centerY+dy*scale;
x=clamp(x,x0+5,x0+size-5);
y=clamp(y,y0+5,y0+size-5);
return {x,y};
}

let g=mapPos(goal.x-rocket.pos.x,goal.y-rocket.pos.y);

ctx.fillStyle="#00ffcc";
ctx.beginPath();
ctx.arc(g.x,g.y,4,0,Math.PI*2);
ctx.fill();

ctx.fillStyle="white";
ctx.beginPath();
ctx.arc(centerX,centerY,4,0,Math.PI*2);
ctx.fill();

ctx.fillStyle="red";
for(const o of obstacles){
let m=mapPos(o.x-rocket.pos.x,o.y-rocket.pos.y);
ctx.beginPath();
ctx.arc(m.x,m.y,3,0,Math.PI*2);
ctx.fill();
}

if(missionFailed){
ctx.fillStyle="rgba(0,0,0,0.7)";
ctx.fillRect(0,0,W,H);

ctx.fillStyle="#ff4d4d";
ctx.font="48px Segoe UI";
ctx.textAlign="center";
ctx.fillText("🚨 Mission Failed 🚨",W/2,H/2-40);

ctx.fillStyle="#00ffcc";
ctx.font="24px Segoe UI";
ctx.fillText("Tap / Click or Press R to Retry",W/2,H/2+20);
}
}

let last=performance.now();
function loop(now){
const dt=Math.min(0.04,(now-last)/1000);
step(dt);
draw();
last=now;
requestAnimationFrame(loop);
}

canvas.addEventListener("touchstart",()=>{
if(missionFailed) restart();
});

canvas.addEventListener("mousedown",()=>{
if(missionFailed) restart();
});

restart();
requestAnimationFrame(loop);