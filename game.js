// Game State
const gameState = {
    isRunning: false,
    isPaused: false,
    difficulty: 'easy',
    playerScore: 0,
    aiScore: 0,
    gameOver: false
};

// Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Rules
const GAME_RULES = {
    WIN_SCORE: 11,
    MIN_LEAD: 2,
    TABLE_WIDTH: 800,
    TABLE_HEIGHT: 400,
    NET_X: 400,
    PADDLE_HEIGHT: 80,
    PADDLE_WIDTH: 12,
    BALL_RADIUS: 8
};

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: {
        ballSpeed: 4,
        aiReactionTime: 100,
        spinMultiplier: 0.5,
        predictionAccuracy: 0.6,
        paddleSpeed: 5
    },
    medium: {
        ballSpeed: 6,
        aiReactionTime: 50,
        spinMultiplier: 0.75,
        predictionAccuracy: 0.75,
        paddleSpeed: 6
    },
    hard: {
        ballSpeed: 8,
        aiReactionTime: 20,
        spinMultiplier: 1.0,
        predictionAccuracy: 0.95,
        paddleSpeed: 7
    }
};

// Player Paddle
const playerPaddle = {
    x: 20,
    y: (GAME_RULES.TABLE_HEIGHT - GAME_RULES.PADDLE_HEIGHT) / 2,
    width: GAME_RULES.PADDLE_WIDTH,
    height: GAME_RULES.PADDLE_HEIGHT,
    dy: 0,
    speed: 0
};

// AI Paddle
const aiPaddle = {
    x: GAME_RULES.TABLE_WIDTH - 20 - GAME_RULES.PADDLE_WIDTH,
    y: (GAME_RULES.TABLE_HEIGHT - GAME_RULES.PADDLE_HEIGHT) / 2,
    width: GAME_RULES.PADDLE_WIDTH,
    height: GAME_RULES.PADDLE_HEIGHT,
    dy: 0,
    speed: 0
};

// Ball Object
const ball = {
    x: GAME_RULES.TABLE_WIDTH / 2,
    y: GAME_RULES.TABLE_HEIGHT / 2,
    dx: DIFFICULTY_SETTINGS.easy.ballSpeed,
    dy: 0,
    radius: GAME_RULES.BALL_RADIUS,
    spin: 0,
    friction: 0.99,
    maxSpeed: 0
};

// AI State
const aiState = {
    targetY: 0,
    lastReactionTime: 0,
    predictedBallY: 0
};

// Input Handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        togglePause();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start Game
function startGame(difficulty) {
    gameState.difficulty = difficulty;
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.gameOver = false;
    gameState.playerScore = 0;
    gameState.aiScore = 0;

    // Hide menu, show game
    document.getElementById('menu').classList.remove('active');
    document.getElementById('game-container').classList.remove('game-hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('difficulty-label').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1) + ' AI';

    // Reset game objects
    resetBall();
    resetPaddles();

    // Set max speed based on difficulty
    const settings = DIFFICULTY_SETTINGS[difficulty];
    ball.maxSpeed = settings.ballSpeed * 2;

    // Start game loop
    gameLoop();
}

// Reset Ball
function resetBall() {
    ball.x = GAME_RULES.TABLE_WIDTH / 2;
    ball.y = GAME_RULES.TABLE_HEIGHT / 2;
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * settings.ballSpeed;
    ball.dy = (Math.random() - 0.5) * 2;
    ball.spin = 0;
    ball.friction = 0.99;
}

// Reset Paddles
function resetPaddles() {
    playerPaddle.y = (GAME_RULES.TABLE_HEIGHT - GAME_RULES.PADDLE_HEIGHT) / 2;
    playerPaddle.dy = 0;
    aiPaddle.y = (GAME_RULES.TABLE_HEIGHT - GAME_RULES.PADDLE_HEIGHT) / 2;
    aiPaddle.dy = 0;
}

// Toggle Pause
function togglePause() {
    if (!gameState.gameOver && gameState.isRunning) {
        gameState.isPaused = !gameState.isPaused;
        const statusText = document.getElementById('status-text');
        statusText.textContent = gameState.isPaused ? '⏸ PAUSED - Press Space to Resume' : 'Arrow Keys / WASD to Move | Space to Pause';
    }
}

// Update Player Paddle
function updatePlayerPaddle() {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    playerPaddle.dy = 0;

    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        playerPaddle.dy = -settings.paddleSpeed;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        playerPaddle.dy = settings.paddleSpeed;
    }

    playerPaddle.y += playerPaddle.dy;

    // Boundary checking
    if (playerPaddle.y < 0) playerPaddle.y = 0;
    if (playerPaddle.y + playerPaddle.height > GAME_RULES.TABLE_HEIGHT) {
        playerPaddle.y = GAME_RULES.TABLE_HEIGHT - playerPaddle.height;
    }
}

// Update AI Paddle
function updateAIPaddle() {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    const now = Date.now();

    // AI Reaction Time
    if (now - aiState.lastReactionTime > settings.aiReactionTime) {
        // Predict ball position
        aiState.predictedBallY = predictBallPosition();
        aiState.lastReactionTime = now;
    }

    // Move towards predicted position
    const aiCenter = aiPaddle.y + aiPaddle.height / 2;
    const targetCenter = aiState.predictedBallY;
    const diff = targetCenter - aiCenter;

    if (Math.abs(diff) > 5) {
        aiPaddle.dy = diff > 0 ? settings.paddleSpeed : -settings.paddleSpeed;
    } else {
        aiPaddle.dy = 0;
    }

    aiPaddle.y += aiPaddle.dy;

    // Boundary checking
    if (aiPaddle.y < 0) aiPaddle.y = 0;
    if (aiPaddle.y + aiPaddle.height > GAME_RULES.TABLE_HEIGHT) {
        aiPaddle.y = GAME_RULES.TABLE_HEIGHT - aiPaddle.height;
    }
}

// Predict Ball Position
function predictBallPosition() {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];
    let predictedY = ball.y;
    let predictedDy = ball.dy;
    let predictedX = ball.x;
    let predictedDx = ball.dx;
    let friction = ball.friction;

    // Simulate ball movement until it reaches AI paddle
    while (predictedX < aiPaddle.x) {
        predictedX += predictedDx;
        predictedY += predictedDy;
        predictedDy *= friction;

        // Wall bouncing
        if (predictedY - GAME_RULES.BALL_RADIUS < 0 || predictedY + GAME_RULES.BALL_RADIUS > GAME_RULES.TABLE_HEIGHT) {
            predictedDy *= -0.95;
            predictedY = Math.max(GAME_RULES.BALL_RADIUS, Math.min(GAME_RULES.TABLE_HEIGHT - GAME_RULES.BALL_RADIUS, predictedY));
        }
    }

    // Apply prediction accuracy (lower accuracy = more random)
    const randomVariation = (Math.random() - 0.5) * (1 - settings.predictionAccuracy) * 100;
    return predictedY + randomVariation;
}

// Update Ball
function updateBall() {
    const settings = DIFFICULTY_SETTINGS[gameState.difficulty];

    // Apply friction
    ball.dx *= ball.friction;
    ball.dy *= ball.friction;

    // Apply spin
    ball.dy += ball.spin;

    // Apply speed cap
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (speed > ball.maxSpeed) {
        ball.dx = (ball.dx / speed) * ball.maxSpeed;
        ball.dy = (ball.dy / speed) * ball.maxSpeed;
    }

    // Update position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom boundary collisions
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy *= -0.95;
    }
    if (ball.y + ball.radius > GAME_RULES.TABLE_HEIGHT) {
        ball.y = GAME_RULES.TABLE_HEIGHT - ball.radius;
        ball.dy *= -0.95;
    }

    // Player paddle collision
    if (ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height &&
        ball.dx < 0) {
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        ball.dx *= -1.05;
        
        // Add spin based on paddle movement
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height;
        ball.spin = (hitPos - 0.5) * 4 * settings.spinMultiplier;
        ball.dy += playerPaddle.dy * 0.3;
    }

    // AI paddle collision
    if (ball.x + ball.radius > aiPaddle.x &&
        ball.y > aiPaddle.y &&
        ball.y < aiPaddle.y + aiPaddle.height &&
        ball.dx > 0) {
        ball.x = aiPaddle.x - ball.radius;
        ball.dx *= -1.05;
        
        // Add spin based on paddle movement
        const hitPos = (ball.y - aiPaddle.y) / aiPaddle.height;
        ball.spin = (hitPos - 0.5) * 4 * settings.spinMultiplier;
        ball.dy += aiPaddle.dy * 0.3;
    }

    // Scoring
    if (ball.x < 0) {
        gameState.aiScore++;
        updateScoreboard();
        checkWinCondition();
        if (!gameState.gameOver) resetBall();
    }
    if (ball.x > GAME_RULES.TABLE_WIDTH) {
        gameState.playerScore++;
        updateScoreboard();
        checkWinCondition();
        if (!gameState.gameOver) resetBall();
    }
}

// Check Win Condition
function checkWinCondition() {
    const playerLead = gameState.playerScore - gameState.aiScore;
    const aiLead = gameState.aiScore - gameState.playerScore;

    if (gameState.playerScore >= GAME_RULES.WIN_SCORE && playerLead >= GAME_RULES.MIN_LEAD) {
        endGame('You Win!', `Final Score: ${gameState.playerScore} - ${gameState.aiScore}`);
    } else if (gameState.aiScore >= GAME_RULES.WIN_SCORE && aiLead >= GAME_RULES.MIN_LEAD) {
        endGame('AI Wins!', `Final Score: ${gameState.playerScore} - ${gameState.aiScore}`);
    }
}

// Update Scoreboard
function updateScoreboard() {
    document.getElementById('player-score').textContent = gameState.playerScore;
    document.getElementById('ai-score').textContent = gameState.aiScore;
}

// End Game
function endGame(title, message) {
    gameState.gameOver = true;
    gameState.isRunning = false;
    document.getElementById('game-over-title').textContent = title;
    document.getElementById('game-over-message').textContent = message;
    document.getElementById('final-player-score').textContent = gameState.playerScore;
    document.getElementById('final-ai-score').textContent = gameState.aiScore;
    document.getElementById('game-over').classList.remove('hidden');
}

// Return to Menu
function returnToMenu() {
    document.getElementById('menu').classList.add('active');
    document.getElementById('game-container').classList.add('game-hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('status-text').textContent = 'Arrow Keys / WASD to Move | Space to Pause';
}

// Draw Functions
function drawTable() {
    // Table background
    ctx.fillStyle = '#0f5438';
    ctx.fillRect(0, 0, GAME_RULES.TABLE_WIDTH, GAME_RULES.TABLE_HEIGHT);

    // Net
    ctx.strokeStyle = 'white';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME_RULES.NET_X, 0);
    ctx.lineTo(GAME_RULES.NET_X, GAME_RULES.TABLE_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Court line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, GAME_RULES.TABLE_HEIGHT / 2);
    ctx.lineTo(GAME_RULES.TABLE_WIDTH, GAME_RULES.TABLE_HEIGHT / 2);
    ctx.stroke();
}

function drawPaddle(paddle) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF4444';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GAME_RULES.TABLE_WIDTH, GAME_RULES.TABLE_HEIGHT);

    // Draw game elements
    drawTable();
    drawPaddle(playerPaddle);
    drawPaddle(aiPaddle);
    drawBall();
}

// Game Loop
function gameLoop() {
    if (!gameState.isRunning) return;

    if (!gameState.isPaused) {
        updatePlayerPaddle();
        updateAIPaddle();
        updateBall();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Table Tennis Game Initialized');
    console.log('Press a difficulty button to start!');
});