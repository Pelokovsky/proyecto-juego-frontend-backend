// =======================================================
// frontend/script.js - Memorama con Integración Full Stack
// =======================================================

// --- Variables de Estado del Juego ---
let level = 1;
let lives = 3;
let timer = 0;
let currentScore = 0; 
let interval;
let flippedCards = [];
let matchedCards = [];

// NUEVA VARIABLE: Controla si el jugador puede hacer click
let isMemorizing = false; 
// NUEVA VARIABLE: Controla si el juego está activo (para bloquear clicks del tablero)
let isGameActive = false;

// --- Configuración de API ---
const BACKEND_URL = 'http://localhost:3000/api/scores'; 

// --- Referencias DOM ---
const board = document.getElementById("game-board");
const restartBtn = document.getElementById("restart");

// Elementos de Audio (variables declaradas, funcionalidad ignorada por errores)
const matchSound = document.getElementById("match-sound");
const failSound = document.getElementById("fail-sound");
const levelupSound = document.getElementById("levelup-sound");

const levelDisplay = document.getElementById("level");
const livesDisplay = document.getElementById("lives");
const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("current-score"); 
const overlay = document.getElementById("overlay");
const levelText = document.getElementById("level-text");
const gameOverButtons = document.getElementById("game-over-buttons"); 

// Elementos del Menú
const mainMenu = document.getElementById("main-menu");
const startGameBtn = document.getElementById("start-game");
const showRankingBtn = document.getElementById("show-ranking");
const hideRankingBtn = document.getElementById("hide-ranking");
const gameSection = document.getElementById("game-section");
const rankingContainer = document.getElementById('ranking-container'); 

// Botones del Overlay de Game Over
const restartOverlayBtn = document.getElementById("restart-overlay"); 
const menuOverlayBtn = document.getElementById("menu-overlay"); 

// --- Partículas (se mantiene igual) ---
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

/**
 * Muestra el overlay para mensajes (Nivel X) o Game Over.
 * @param {string} text - Mensaje a mostrar.
 * @param {boolean} showButtons - Si debe mostrar los botones de Game Over.
 */
function showOverlay(text, showButtons = false){
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "all";
  levelText.textContent = text;
    
    if (showButtons) {
        // Muestra botones y evita que se cierre automáticamente
        gameOverButtons.classList.remove('hidden');
    } else {
        // Cierra el overlay después de 1.5s
        gameOverButtons.classList.add('hidden');
        setTimeout(()=>{
            overlay.style.opacity = "0";
            overlay.style.pointerEvents = "none";
        },1500);
    }
}

function updateScore(points) {
    currentScore += points;
    scoreDisplay.textContent = `Puntaje: ${currentScore}`;
}

function updateDisplay(){
  levelDisplay.textContent = "Nivel: " + level;
  livesDisplay.textContent = "Vidas: " + lives;
  timerDisplay.textContent = "Tiempo: "+ timer +"s";
  scoreDisplay.textContent = `Puntaje: ${currentScore}`; 
}

function createBoard(){
    // 1. Configuración inicial del tablero
  board.innerHTML = "";
  flippedCards = [];
  matchedCards = [];
  const symbols = createSymbols(level);

  board.className = "grid-cards level-" + level;
  document.body.className = "level-" + level;
    
    // 2. Habilitar la fase de memorización
    isMemorizing = true;
    isGameActive = false; // Desactiva el juego
    // Ocultar la barra de información durante la memorización
    document.querySelector('.info-bar').style.opacity = '0.5';

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

    // Mantiene la carta volteada al inicio
    card.classList.add("flipped");
    // Remueve el listener de click DURANTE la memorización
    card.removeEventListener("click",()=>flipCard(card,symbol));
    
  });

    // 3. Retardo de 10 segundos para memorizar
    let memorizeTimer = 10; // 10 segundos de memorización
    const COUNTDOWN_TIME = 3; // 3 segundos de cuenta regresiva

    showOverlay(`Memoriza: ${memorizeTimer}s`); // Muestra la duración
    
    // Inicia el cronómetro de memorización
    const memorizeInterval = setInterval(() => {
        memorizeTimer--;
        if (memorizeTimer > 0) {
            showOverlay(`Memoriza: ${memorizeTimer}s`);
        } else {
            clearInterval(memorizeInterval);

            // Voltea todas las cartas de vuelta
            document.querySelectorAll('.card').forEach(card => {
                card.classList.remove("flipped");
            });
            
            // --- INICIA CUENTA REGRESIVA ANTES DE EMPEZAR EL JUEGO ---
            let countdown = COUNTDOWN_TIME;
            showOverlay(`¡Prepárate! ${countdown}s`);
            
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showOverlay(`¡Prepárate! ${countdown}s`);
                } else {
                    clearInterval(countdownInterval);
                    
                    isMemorizing = false; // Desactiva el bloqueo de memorización
                    isGameActive = true; // Habilita el juego
                    document.querySelector('.info-bar').style.opacity = '1'; // Restaura opacidad
                    
                    // 4. Iniciar Cronómetro del Juego
                    clearInterval(interval);
                    timer = 0;
                    interval = setInterval(()=>{
                        timer++;
                        timerDisplay.textContent = `Tiempo: ${timer}s`;
                    },1000);

                    // Vuelve a añadir el listener de click para el juego activo
                    document.querySelectorAll('.card').forEach(card => {
                        card.addEventListener("click", () => flipCard(card, card.querySelector('.card-front').textContent));
                    });

                    // Cierra el overlay después de mostrar el mensaje de inicio
                    showOverlay(`¡Comienza el juego!`); 
                }
            }, 1000);
        }
    }, 1000);

  updateDisplay();
  cargarRanking(); 
}

function flipCard(card,symbol){
    // Bloquea el click si NO está activo, si estamos en memorización, o volteando 2 cartas
  if(!isGameActive || card.classList.contains("flipped") || card.classList.contains("matched")) return; 
    
  card.classList.add("flipped");
  flippedCards.push({card,symbol});

  if(flippedCards.length === 2){
    // Bloquea temporalmente clicks mientras se comprueban las cartas
    isGameActive = false; 
    
    if(flippedCards[0].symbol === flippedCards[1].symbol){
      flippedCards.forEach(c=>{
        c.card.classList.add("matched");
        handleParticles(c.card.offsetLeft + 50, c.card.offsetTop + 70);
      });
      updateScore(100); 
      // matchSound.play(); 
      matchedCards.push(...flippedCards);
      
      // Habilita clicks inmediatamente después de un match
      isGameActive = true;
    }else{
      lives--;
      // failSound.play(); 
      
      // Retardo corto para ver el error y luego voltear (300ms)
      setTimeout(()=>{
            // LÓGICA DE VOLTEO: Remueve la clase 'flipped' para ocultar las cartas
        flippedCards.forEach(c=>c.card.classList.remove("flipped"));
        updateDisplay();
        isGameActive = true; // ¡IMPORTANTE! Habilita clicks después de que se ocultan
      },300); 
      
      // Animación de sacudida al perder vida
      const infoBar = document.querySelector('.info-bar');
      infoBar.classList.add('shake');
      setTimeout(() => infoBar.classList.remove('shake'), 400);

    }
    flippedCards = [];
    updateDisplay();
  }

  if(matchedCards.length === board.children.length){
    // levelupSound.play(); 
    level++;
    lives = 3;
    createBoard();
  }

    // --- LÓGICA DE GAME OVER Y GUARDADO DE PUNTAJE ---
  if(lives <= 0){
    clearInterval(interval); 

    // 1. Calcular Puntaje Final 
    const finalScore = Math.max(0, currentScore + (level * 1000 - timer * 10)); 
    
    // 2. Pedir nombre al jugador
    const playerName = prompt(`¡GAME OVER! Score Final: ${finalScore}. Ingresa tu nombre para el Ranking:`);

    if (playerName && playerName.trim() !== '') {
        // 3. Llamar a la función de guardado con el nivel mapeado (CORREGIDO para Mongoose)
        guardarPuntaje(playerName, finalScore, timer, mapLevelToDifficulty(level)); 
    } else {
        console.warn("Puntaje no guardado: Se requiere un nombre válido.");
    }

    // 4. Mostrar la pantalla de Game Over con botones
    resetGame();
    showOverlay(`GAME OVER! Score: ${finalScore}`, true); 
  }
}


// --- Lógica de Navegación del Menú ---

function resetGame() {
    level = 1;
    lives = 3;
    timer = 0;
    currentScore = 0;
    clearInterval(interval);
    updateDisplay();
}

function showMenuScreen() {
    // Detiene el cronómetro si el juego estaba activo y regresa
    clearInterval(interval);
    isGameActive = false;
    isMemorizing = false;

    // Cierra el overlay si estaba abierto
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    
    mainMenu.classList.remove('hidden');
    gameSection.classList.add('hidden');
    rankingContainer.classList.add('hidden');
    cargarRanking(); 
}

function showGameScreen() {
    mainMenu.classList.add('hidden');
    rankingContainer.classList.add('hidden');
    gameSection.classList.remove('hidden');
    // Cierra el overlay si estaba abierto 
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    createBoard();
}

function showRankingScreen() {
    mainMenu.classList.add('hidden');
    gameSection.classList.add('hidden');
    rankingContainer.classList.remove('hidden');
    cargarRanking();
}


// --- Funciones de API y Utilidades ---

/**
 * Función auxiliar para mapear el número de nivel a la cadena de dificultad
 * requerida por el modelo Mongoose ('Facil', 'Medio', 'Dificil').
 */
function mapLevelToDifficulty(levelNumber) {
    if (levelNumber <= 2) {
        return 'Facil';
    } else if (levelNumber <= 4) {
        return 'Medio';
    } else {
        return 'Dificil'; 
    }
}


function guardarPuntaje(username, finalScore, finalTime, finalLevel) {
    const scoreData = {
        username: username,
        score: finalScore,
        time_taken: finalTime,
        level: finalLevel
    };

    fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: No se pudo guardar el puntaje.`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Puntaje guardado exitosamente:', data.score);
    })
    .catch(error => {
        console.error('Fallo al guardar el puntaje:', error);
    });
}


function cargarRanking() {
    if(rankingContainer) {
        rankingContainer.innerHTML = '<h3>🏆 Top 10 Memorama</h3><div class="loader">Cargando datos...</div>';
    }

    fetch(BACKEND_URL)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}: Fallo al cargar el ranking.`);
        }
        return response.json();
    })
    .then(scores => {
        if (!rankingContainer) return;

        let html = '<h3>🏆 Top 10 Memorama</h3><ol>';
        scores.forEach((score, index) => {
            const levelText = score.level; 
            html += `<li>${index + 1}. ${score.username} - Score: ${score.score} (${score.time_taken}s) - Dificultad: ${levelText}</li>`;
        });
        html += '</ol><button id="hide-ranking" class="button secondary">Volver al Menú</button>';
        rankingContainer.innerHTML = html;
        
        document.getElementById("hide-ranking").addEventListener("click", showMenuScreen);
    })
    .catch(error => {
        console.error('Fallo al cargar el ranking:', error);
        if (rankingContainer) rankingContainer.innerHTML = '<h3>Ranking: No se pudo conectar al servidor.</h3><button id="hide-ranking" class="button secondary">Volver al Menú</button>';
        if (document.getElementById("hide-ranking")) {
            document.getElementById("hide-ranking").addEventListener("click", showMenuScreen);
        }
    });
}

// --- Event Listeners Iniciales ---
startGameBtn.addEventListener("click", showGameScreen);
showRankingBtn.addEventListener("click", showRankingScreen);
restartBtn.addEventListener("click", showGameScreen); 

// Botones del Overlay de Game Over
restartOverlayBtn.addEventListener("click", showGameScreen); 
menuOverlayBtn.addEventListener("click", showMenuScreen); 


// Iniciar en la pantalla de menú al cargar
document.addEventListener('DOMContentLoaded', () => {
    gameSection.classList.add('hidden');
    showMenuScreen();
});