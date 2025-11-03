let level = 1;
let lives = 3;
let timer = 0;
let interval;
let flippedCards = [];
let matchedCards = [];

const board = document.getElementById("game-board");
const restartBtn = document.getElementById("restart");
const matchSound = document.getElementById("match-sound");
const failSound = document.getElementById("fail-sound");
const levelupSound = document.getElementById("levelup-sound");
const levelDisplay = document.getElementById("level");
const livesDisplay = document.getElementById("lives");
const timerDisplay = document.getElementById("timer");
const overlay = document.getElementById("overlay");
const levelText = document.getElementById("level-text");

// --- Partículas ---
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const particlesArray = [];

class Particle {
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 2;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.color = "yellow";
  }
  update(){
    this.x += this.speedX;
    this.y += this.speedY;
    this.size *= 0.95;
  }
  draw(){
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
  }
}

function handleParticles(x, y){
  const count = level >= 4 ? 50 : 20;
  for(let i=0;i<count;i++){
    particlesArray.push(new Particle(x,y));
  }
}

function animateParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=particlesArray.length-1;i>=0;i--){
    particlesArray[i].update();
    particlesArray[i].draw();
    if(particlesArray[i].size < 0.5) particlesArray.splice(i,1);
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// --- Funciones del juego ---
function shuffle(array){
  return array.sort(()=> Math.random() - 0.5);
}

function createSymbols(level){
  const base = ["🍎","🍌","🍇","🍒","🍉","🍍","🍑","🥝","🍋","🥥","🍐","🍓","🥭","🥑","🍈","🍊"];
  const needed = Math.min(level*2 + 4, base.length);
  const selected = base.slice(0, needed);
  return shuffle([...selected, ...selected]);
}

function showOverlay(text){
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "all";
  levelText.textContent = text;
  setTimeout(()=>{
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
  },1500);
}

function updateDisplay(){
  levelDisplay.textContent = "Nivel: " + level;
  livesDisplay.textContent = "Vidas: " + lives;
  timerDisplay.textContent = "Tiempo: "+ timer +"s";
}

function createBoard(){
  board.innerHTML = "";
  flippedCards = [];
  matchedCards = [];
  const symbols = createSymbols(level);

  board.className = "grid-cards level-" + level;
  document.body.className = "level-" + level;

  symbols.forEach((symbol,index)=>{
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.index = index;

    const cardInner = document.createElement("div");
    cardInner.classList.add("card-inner");

    const cardFront = document.createElement("div");
    cardFront.classList.add("card-front");
    cardFront.textContent = symbol;

    const cardBack = document.createElement("div");
    cardBack.classList.add("card-back");
    cardBack.textContent = "❓";

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    card.appendChild(cardInner);
    board.appendChild(card);

    card.classList.add("flipped");
    setTimeout(()=> card.classList.remove("flipped"), 1500 + index*80);

    card.addEventListener("click",()=>flipCard(card,symbol));
  });

  clearInterval(interval);
  timer = 0;
  interval = setInterval(()=>{
    timer++;
    timerDisplay.textContent = `Tiempo: ${timer}s`;
  },1000);

  showOverlay(`Nivel ${level}`);
  updateDisplay();
}

function flipCard(card,symbol){
  if(card.classList.contains("flipped") || card.classList.contains("matched")) return;
  card.classList.add("flipped");
  flippedCards.push({card,symbol});

  if(flippedCards.length === 2){
    if(flippedCards[0].symbol === flippedCards[1].symbol){
      flippedCards.forEach(c=>{
        c.card.classList.add("matched");
        handleParticles(c.card.offsetLeft + 50, c.card.offsetTop + 70);
      });
      matchSound.play();
      matchedCards.push(...flippedCards);
    }else{
      lives--;
      failSound.play();
      setTimeout(()=>{
        flippedCards.forEach(c=>c.card.classList.remove("flipped"));
        updateDisplay();
      },800);
    }
    flippedCards = [];
    updateDisplay();
  }

  if(matchedCards.length === board.children.length){
    levelupSound.play();
    level++;
    lives = 3;
    createBoard();
  }

  if(lives <= 0){
    alert("¡Game Over! Reiniciando nivel.");
    lives = 3;
    createBoard();
  }
}

restartBtn.addEventListener("click",()=>{
  level = 1;
  lives = 3;
  createBoard();
});

function saveScore(player, level, time){
  fetch('http://localhost:3000/scores', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({player, level, time})
  })
  .then(res => res.json())
  .then(data => console.log(data));
}


// --- Iniciar juego ---
createBoard();
