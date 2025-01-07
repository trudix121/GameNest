const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreElement = document.getElementById('score');

canvas.width = 240;
canvas.height = 400;

const scale = 20;
const rows = canvas.height / scale;
const cols = canvas.width / scale;

let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;
let paused = true;
let gameStartTime = null
// Matrice pentru piesele Tetris cu culori gradient
const pieces = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0], [1, 0], [1, 1]], // L
    [[0, 1], [0, 1], [1, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
];

const colors = [
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

let arena = createMatrix(cols, rows);
let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    color: null
};

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
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
 
        const response = await fetch('/home/game/api/tetris', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin', // Added for security
            body: JSON.stringify({ 
                score,
                gameId: window.GAME_ID,
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

function createPiece() {
    const pieceIndex = Math.floor(Math.random() * pieces.length);
    const piece = pieces[pieceIndex];
    player.color = colors[pieceIndex];
    return piece;
}

function draw() {
    // Background grid
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    context.strokeStyle = '#333';
    context.lineWidth = 0.5;
    
    for(let i = 0; i <= cols; i++) {
        context.beginPath();
        context.moveTo(i * scale, 0);
        context.lineTo(i * scale, canvas.height);
        context.stroke();
    }
    
    for(let i = 0; i <= rows; i++) {
        context.beginPath();
        context.moveTo(0, i * scale);
        context.lineTo(canvas.width, i * scale);
        context.stroke();
    }
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = player.color;
                context.fillRect(
                    (x + offset.x) * scale + 1,
                    (y + offset.y) * scale + 1,
                    scale - 2,
                    scale - 2
                );
                
                // Add shine effect
                context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                context.fillRect(
                    (x + offset.x) * scale + 1,
                    (y + offset.y) * scale + 1,
                    scale - 2,
                    (scale - 2) / 2
                );
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    matrix.reverse();
}

function playerReset() {
    player.matrix = createPiece();
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - 
                  Math.floor(player.matrix[0].length / 2);
    
    if (collide(arena, player)) {
        gameOver = true;
        paused = true;
        startBtn.textContent = 'New Game';
        sendScore(score)
        alert('Game Over! Your Score: ' + score);
        arena.forEach(row => row.fill(0));
        score = 0;
        scoreElement.textContent = score;
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        score += rowCount * 100;
        rowCount *= 2;
        scoreElement.textContent = score;
    }
}

function update(time = 0) {
    if (!paused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
        draw();
    }
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!paused) {
        if (event.keyCode === 37) {
            playerMove(-1);
        } else if (event.keyCode === 39) {
            playerMove(1);
        } else if (event.keyCode === 40) {
            playerDrop();
        } else if (event.keyCode === 38) {
            playerRotate();
        }
    }
});

startBtn.addEventListener('click', () => {
    if (paused) {
        paused = false;
        gameOver = false;
        playerReset();
        score = 0;
        scoreElement.textContent = score;
        startBtn.textContent = 'Pauză';
    } else {
        paused = true;
        startBtn.textContent = 'Continuă';
    }
});

update();