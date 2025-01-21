// Selectare elemente DOM
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const scoreElement = document.getElementById('score');

// Configurare canvas
canvas.width = 240;
canvas.height = 400;
const scale = 20;
const rows = canvas.height / scale;
const cols = canvas.width / scale;

// Variabile de stare joc
let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;
let paused = true;
let gameStartTime = null;

// Definire piese și culori
const pieces = [
    [[1, 1, 1, 1]],            // I
    [[1, 1], [1, 1]],         // O
    [[0, 1, 0], [1, 1, 1]],  // T
    [[1, 0], [1, 0], [1, 1]], // L
    [[0, 1], [0, 1], [1, 1]], // J
    [[1, 1, 0], [0, 1, 1]],  // S
    [[0, 1, 1], [1, 1, 0]]   // Z
];

const colors = [
    '#FF0D72', // Roșu
    '#0DC2FF', // Albastru
    '#0DFF72', // Verde
    '#F538FF', // Roz
    '#FF8E0D', // Portocaliu
    '#FFE138', // Galben
    '#3877FF'  // Albastru închis
];

// Inițializare arena și player
let arena = createMatrix(cols, rows);
let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    color: null
};

// Funcții de inițializare
function createMatrix(w, h) {
    return Array(h).fill().map(() => Array(w).fill(0));
}

function createPiece() {
    const pieceIndex = Math.floor(Math.random() * pieces.length);
    const piece = pieces[pieceIndex];
    player.color = colors[pieceIndex];
    return piece.map(row => [...row]); // Deep copy
}

// Funcții de desenare
function draw() {
    // Desenare fundal
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenare grid
    drawGrid();
    
    // Desenare piese
    drawMatrix(arena, { x: 0, y: 0 });
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
}

function drawGrid() {
    context.strokeStyle = '#333';
    context.lineWidth = 0.5;
    
    // Linii verticale
    for (let i = 0; i <= cols; i++) {
        context.beginPath();
        context.moveTo(i * scale, 0);
        context.lineTo(i * scale, canvas.height);
        context.stroke();
    }
    
    // Linii orizontale
    for (let i = 0; i <= rows; i++) {
        context.beginPath();
        context.moveTo(0, i * scale);
        context.lineTo(canvas.width, i * scale);
        context.stroke();
    }
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Desenare bloc
                context.fillStyle = player.color;
                context.fillRect(
                    (x + offset.x) * scale + 1,
                    (y + offset.y) * scale + 1,
                    scale - 2,
                    scale - 2
                );
                
                // Efect de strălucire
                context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                context.fillRect(
                    (x + offset.x) * scale + 1,
                    (y + offset.y) * scale + 1,
                    scale - 2,
                    (scale - 2) / 2
                );
                
                // Efect de umbră
                context.fillStyle = 'rgba(0, 0, 0, 0.1)';
                context.fillRect(
                    (x + offset.x) * scale + 1,
                    (y + offset.y) * scale + scale/2,
                    scale - 2,
                    (scale - 2) / 2
                );
            }
        });
    });
}

// Funcții de control piese
function rotate(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const result = Array(M).fill().map(() => Array(N).fill(0));
    
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            result[j][N-1-i] = matrix[i][j];
        }
    }
    
    matrix.length = 0;
    result.forEach(row => matrix.push(row));
    return matrix;
}

function playerRotate() {
    const originalX = player.pos.x;
    const originalY = player.pos.y;
    const originalMatrix = player.matrix.map(row => [...row]);
    
    rotate(player.matrix);
    
    const maxOffset = Math.ceil(player.matrix[0].length / 2);
    
    if (!collide(arena, player)) {
        return;
    }
    
    // Încercare poziții alternative
    for (let i = 1; i <= maxOffset; i++) {
        // Dreapta
        player.pos.x = originalX + i;
        if (!collide(arena, player)) return;
        
        // Stânga
        player.pos.x = originalX - i;
        if (!collide(arena, player)) return;
        
        // Sus
        player.pos.x = originalX;
        player.pos.y = originalY - i;
        if (!collide(arena, player)) return;
    }
    
    // Revenire la poziția originală
    player.pos.x = originalX;
    player.pos.y = originalY;
    player.matrix = originalMatrix;
}

// Funcții de coliziune și fuziune
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

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Funcții de gameplay
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

function playerReset() {
    player.matrix = createPiece();
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - 
                   Math.floor(player.matrix[0].length / 2);
    
    if (collide(arena, player)) {
        handleGameOver();
    }
}

function handleGameOver() {
    gameOver = true;
    paused = true;
    startBtn.classList.add('hidden');
    tryAgainBtn.classList.remove('hidden');
    sendScore(score);
    alert('Joc terminat! Scorul tău: ' + score);
    arena.forEach(row => row.fill(0));
    score = 0;
    scoreElement.textContent = score;
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

// Funcție pentru trimitere scor
async function sendScore(score) {
    try {
        const gameDuration = Date.now() - gameStartTime;
        
        if (gameDuration < 1000) {
            console.error('Durată invalidă de joc');
            return;
        }

        const response = await fetch('/home/game/api/tetris', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ 
                score,
                gameId: window.GAME_ID,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Eroare la trimiterea scorului');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error('Trimiterea scorului a eșuat');
        }
    } catch (error) {
        console.error('Eroare la trimiterea scorului:', error);
        alert('Salvarea scorului a eșuat. Te rugăm să încerci din nou.');
    }
}

// Loop principal joc
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

// Event listeners
document.addEventListener('keydown', event => {
    if (!paused) {
        switch(event.keyCode) {
            case 37: // Stânga
                playerMove(-1);
                break;
            case 39: // Dreapta
                playerMove(1);
                break;
            case 40: // Jos
                playerDrop();
                break;
            case 38: // Sus (Rotire)
                playerRotate();
                break;
        }
    }
});

startBtn.addEventListener('click', () => {
    if (paused) {
        paused = false;
        gameOver = false;
        gameStartTime = Date.now();
        playerReset();
        score = 0;
        scoreElement.textContent = score;
        startBtn.textContent = 'Pauză';
        tryAgainBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');
    } else {
        paused = true;
        startBtn.textContent = 'Continuă';
    }
});

// Inițializare joc
update();