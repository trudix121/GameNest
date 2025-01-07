// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
let gameStartTime = null;

const GAME_CONFIG = {
    box: 20,
    width: canvas.width,
    height: canvas.height,
    speed: 100
};

// Initialize game state
let gameState = {
    snake: [{ x: 9 * GAME_CONFIG.box, y: 9 * GAME_CONFIG.box }],
    direction: null,
    food: null,
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    gameInterval: null
};

// Initialize high score display
document.getElementById('highScore').innerText = `High Score: ${gameState.highScore}`;

// New function to draw grid
function drawGrid() {
    ctx.strokeStyle = '#5a8a66'; // Light gray color for grid
    ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = 0; x <= GAME_CONFIG.width; x += GAME_CONFIG.box) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_CONFIG.height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= GAME_CONFIG.height; y += GAME_CONFIG.box) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_CONFIG.width, y);
        ctx.stroke();
    }
}

function generateFoodPosition(snake) {
    const position = {
        x: Math.floor(Math.random() * (GAME_CONFIG.width / GAME_CONFIG.box)) * GAME_CONFIG.box,
        y: Math.floor(Math.random() * (GAME_CONFIG.height / GAME_CONFIG.box)) * GAME_CONFIG.box
    };

    // Check if food spawns on snake
    if (snake.some(segment => segment.x === position.x && segment.y === position.y)) {
        return generateFoodPosition(snake);
    }
    return position;
}

function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#059669' : '#34D399';
        ctx.fillRect(segment.x, segment.y, GAME_CONFIG.box - 2, GAME_CONFIG.box - 2);
        
        ctx.strokeStyle = '#047857';
        ctx.strokeRect(segment.x, segment.y, GAME_CONFIG.box - 2, GAME_CONFIG.box - 2);
    });
}

function drawFood() {
    if (gameState.food) {
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(
            gameState.food.x + GAME_CONFIG.box / 2,
            gameState.food.y + GAME_CONFIG.box / 2,
            GAME_CONFIG.box / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

function draw() {
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    
    // Draw grid first
    drawGrid();

    if (!gameState.food) {
        gameState.food = generateFoodPosition(gameState.snake);
    }
    
    drawSnake();
    drawFood();

    let snakeX = gameState.snake[0].x;
    let snakeY = gameState.snake[0].y;

    // Update snake position based on direction
    if (gameState.direction === 'LEFT') snakeX -= GAME_CONFIG.box;
    if (gameState.direction === 'UP') snakeY -= GAME_CONFIG.box;
    if (gameState.direction === 'RIGHT') snakeX += GAME_CONFIG.box;
    if (gameState.direction === 'DOWN') snakeY += GAME_CONFIG.box;

    // Check if snake eats food
    if (snakeX === gameState.food.x && snakeY === gameState.food.y) {
        gameState.score++;
        document.getElementById('score').innerText = `Score: ${gameState.score}`;
        gameState.food = generateFoodPosition(gameState.snake);
    } else {
        gameState.snake.pop();
    }

    // Check collision with walls or self
    if (snakeX < 0 || snakeY < 0 || 
        snakeX >= GAME_CONFIG.width || snakeY >= GAME_CONFIG.height || 
        collision(snakeX, snakeY)) {
        gameOver();
        return;
    }

    const newHead = { x: snakeX, y: snakeY };
    gameState.snake.unshift(newHead);
}

function collision(x, y) {
    return gameState.snake.some((segment, index) => {
        if (index === 0) return false;
        return segment.x === x && segment.y === y;
    });
}

function gameOver() {
    clearInterval(gameState.gameInterval);
    
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
        document.getElementById('highScore').innerText = `High Score: ${gameState.highScore}`;
    }

    startButton.classList.add('hidden');
    restartButton.classList.remove('hidden');
    overlay.style.display = 'flex';
    
    if (gameState.score > 0) {
        sendScore(gameState.score);
    }
}

async function sendScore(score) {
    try {
        // Calculate game duration
        const gameDuration = Date.now() - gameStartTime;
        
        // Only send score if game duration is reasonable
        if (gameDuration < 1000) {
            console.error('Invalid game duration');
            return;
        }

        const response = await fetch('/home/game/api/snake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', // Added for security
            body: JSON.stringify({ 
                score,
                gameId: window.GAME_ID,
                duration: gameDuration
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit score');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error('Score submission failed');
        }
        
   } catch (error) {
       console.error('Error sending score:', error);
       alert('Failed to save score. Please try again.');
   }
}

function startGame() {
   // Set game start time
   gameStartTime = Date.now();
   
   // Reset game state
   gameState = {
       snake: [{ x: 9 * GAME_CONFIG.box, y: 9 * GAME_CONFIG.box }],
       direction: 'RIGHT', // Set initial direction
       food: generateFoodPosition([{ x: 9 * GAME_CONFIG.box, y: 9 * GAME_CONFIG.box }]),
       score: 0,
       highScore: gameState.highScore,
       gameInterval: null
   };

   // Update UI
   document.getElementById('score').innerText = 'Score: 0';
   startButton.classList.add('hidden');
   restartButton.classList.add('hidden');
   overlay.style.display = 'none';

   // Clear any existing interval
   if (gameState.gameInterval) {
       clearInterval(gameState.gameInterval);
   }

   // Start game loop
   gameState.gameInterval = setInterval(draw, GAME_CONFIG.speed);
}

// Handle keyboard controls
document.addEventListener('keydown', (event) => {
   const newDirection = {
       'ArrowLeft': 'LEFT',
       'ArrowUp': 'UP',
       'ArrowRight': 'RIGHT',
       'ArrowDown': 'DOWN'
   }[event.key];

   if (newDirection) {
       const opposites = {
           'LEFT': 'RIGHT',
           'RIGHT': 'LEFT',
           'UP': 'DOWN',
           'DOWN': 'UP'
       };

       // Prevent 180-degree turns
       if (gameState.direction !== opposites[newDirection]) {
           gameState.direction = newDirection;
       }
   }
});

// Add click event listeners for buttons
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
   window.location.href = '/home/game/snake';
});
