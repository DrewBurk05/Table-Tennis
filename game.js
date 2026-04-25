// ==================== GAME STATE ====================
const gameState = {
    player: {
        name: 'Player',
        avatar: 0,
        score: 0,
        paddleColor: '#FF6B6B',
        paddleType: 'standard'
    },
    ai: {
        score: 0,
        difficulty: 'beginner'
    },
    gameActive: false,
    gamePaused: false,
    gameOver: false,
    stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        totalPoints: 0,
        byDifficulty: {
            beginner: { wins: 0, losses: 0 },
            intermediate: { wins: 0, losses: 0 },
            advanced: { wins: 0, losses: 0 },
            expert: { wins: 0, losses: 0 }
        }
    },
    coins: 0,
    ownedPaddles: ['standard']
};

// ==================== DIFFICULTY SETTINGS ====================
const DIFFICULTY_SETTINGS = {
    beginner: {
        ballSpeed: 3,
        aiReactionTime: 150,
        predictionAccuracy: 0.5,
        spinMultiplier: 0.3,
        label: '🌱 Beginner'
    },
    intermediate: {
        ballSpeed: 5,
        aiReactionTime: 80,
        predictionAccuracy: 0.7,
        spinMultiplier: 0.6,
        label: '🎮 Intermediate'
    },
    advanced: {
        ballSpeed: 7,
        aiReactionTime: 40,
        predictionAccuracy: 0.85,
        spinMultiplier: 0.85,
        label: '⚡ Advanced'
    },
    expert: {
        ballSpeed: 9,
        aiReactionTime: 15,
        predictionAccuracy: 0.95,
        spinMultiplier: 1.0,
        label: '🔥 Expert'
    }
};

// ==================== PADDLE SETTINGS ====================
const PADDLE_SPECS = {
    standard: {
        speedMultiplier: 1.0,
        spinMultiplier: 1.0,
        name: 'Standard',
        price: 0
    },
    power: {
        speedMultiplier: 1.2,
        spinMultiplier: 0.7,
        name: 'Power Shot',
        price: 500
    },
    spin: {
        speedMultiplier: 0.8,
        spinMultiplier: 1.5,
        name: 'Spin Master',
        price: 750
    },
    elite: {
        speedMultiplier: 1.15,
        spinMultiplier: 1.2,
        name: 'Elite Pro',
        price: 1000
    },
    quantum: {
        speedMultiplier: 1.3,
        spinMultiplier: 1.4,
        name: 'Quantum Leap',
        price: 2000
    }
};

// ==================== GAME RULES ====================
const GAME_RULES = {
    tableWidth: 1000,
    tableHeight: 600,
    winPoints: 11,
    minPointLead: 2,
    ballRadius: 8,
    paddleWidth: 12,
    paddleHeight: 100,
    maxBallSpeed: 12,
    friction: 0.98
};

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ==================== GAME OBJECTS ====================
let playerPaddle = {
    x: 20,
    y: GAME_RULES.tableHeight / 2 - GAME_RULES.paddleHeight / 2,
    width: GAME_RULES.paddleWidth,
    height: GAME_RULES.paddleHeight,
    velocityY: 0,
    maxSpeed: 8
};

let aiPaddle = {
    x: GAME_RULES.tableWidth - GAME_RULES.paddleWidth - 20,
    y: GAME_RULES.tableHeight / 2 - GAME_RULES.paddleHeight / 2,
    width: GAME_RULES.paddleWidth,
    height: GAME_RULES.paddleHeight,
    velocityY: 0,
    maxSpeed: 8
};

let ball = {
    x: GAME_RULES.tableWidth / 2,
    y: GAME_RULES.tableHeight / 2,
    radius: GAME_RULES.ballRadius,
    velocityX: 4,
    velocityY: 0,
    spin: 0,
    lastHitByPlayer: false
};

let aiState = {
    lastReactionTime: 0,
    predictedBallY: ball.y,
    targetY: aiPaddle.y + aiPaddle.height / 2
};

// ==================== INPUT HANDLING ====================
const keyState = {};

document.addEventListener('keydown', (e) => {
    keyState[e.key.toLowerCase()] = true;
    
    if (e.key === ' ') {
        e.preventDefault();
        if (gameState.gameActive && !gameState.gameOver) {
            togglePause();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keyState[e.key.toLowerCase()] = false;
});

// Mouse movement for paddle control
document.addEventListener('mousemove', (e) => {
    if (!gameState.gameActive || gameState.gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    if (mouseY > playerPaddle.y && mouseY < playerPaddle.y + playerPaddle.height) {
        playerPaddle.velocityY = 0;
    } else if (mouseY < playerPaddle.y) {
        playerPaddle.velocityY = -playerPaddle.maxSpeed;
    } else {
        playerPaddle.velocityY = playerPaddle.maxSpeed;
    }
});

// ==================== GAME FUNCTIONS ====================
function updatePlayerPaddle() {
    // Keyboard input
    if (keyState['arrowup'] || keyState['w']) {
        playerPaddle.velocityY = -playerPaddle.maxSpeed;
    } else if (keyState['arrowdown'] || keyState['s']) {
        playerPaddle.velocityY = playerPaddle.maxSpeed;
    } else {
        playerPaddle.velocityY *= 0.9; // Friction
    }

    // Update position
    playerPaddle.y += playerPaddle.velocityY;

    // Boundary checking
    if (playerPaddle.y < 0) playerPaddle.y = 0;
    if (playerPaddle.y + playerPaddle.height > GAME_RULES.tableHeight) {
        playerPaddle.y = GAME_RULES.tableHeight - playerPaddle.height;
    }
}

function updateAIPaddle() {
    const difficulty = DIFFICULTY_SETTINGS[gameState.ai.difficulty];
    const currentTime = Date.now();

    // Predict ball position
    if (Math.random() < difficulty.predictionAccuracy) {
        let predictedY = ball.y;
        let predictedVX = ball.velocityX;
        let predictedVY = ball.velocityY;

        // Simple prediction
        while (predictedVX > 0) {
            predictedY += predictedVY;
            predictedVX -= 0.3;
        }

        aiState.predictedBallY = Math.max(0, Math.min(GAME_RULES.tableHeight, predictedY));
    }

    // AI reaction time
    if (currentTime - aiState.lastReactionTime > difficulty.aiReactionTime) {
        aiState.targetY = aiState.predictedBallY;
        aiState.lastReactionTime = currentTime;
    }

    // Move towards target
    const paddleCenter = aiPaddle.y + aiPaddle.height / 2;
    const distance = aiState.targetY - paddleCenter;

    if (Math.abs(distance) > 5) {
        aiPaddle.velocityY = Math.sign(distance) * aiPaddle.maxSpeed * 0.8;
    } else {
        aiPaddle.velocityY *= 0.7;
    }

    // Update position
    aiPaddle.y += aiPaddle.velocityY;

    // Boundary checking
    if (aiPaddle.y < 0) aiPaddle.y = 0;
    if (aiPaddle.y + aiPaddle.height > GAME_RULES.tableHeight) {
        aiPaddle.y = GAME_RULES.tableHeight - aiPaddle.height;
    }
}

function updateBall() {
    const difficulty = DIFFICULTY_SETTINGS[gameState.ai.difficulty];

    // Apply spin
    ball.velocityY += ball.spin;
    ball.spin *= 0.96;

    // Apply friction
    ball.velocityX *= GAME_RULES.friction;
    ball.velocityY *= GAME_RULES.friction;

    // Cap speed
    const speed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
    const maxSpeed = GAME_RULES.maxBallSpeed;
    if (speed > maxSpeed) {
        ball.velocityX = (ball.velocityX / speed) * maxSpeed;
        ball.velocityY = (ball.velocityY / speed) * maxSpeed;
    }

    // Update position
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Top and bottom boundary
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.velocityY = Math.abs(ball.velocityY);
    }
    if (ball.y + ball.radius > GAME_RULES.tableHeight) {
        ball.y = GAME_RULES.tableHeight - ball.radius;
        ball.velocityY = -Math.abs(ball.velocityY);
    }

    // Paddle collision - Player
    if (
        ball.velocityX < 0 &&
        ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height
    ) {
        ball.x = playerPaddle.x + playerPaddle.width + ball.radius;
        
        // Apply paddle specs
        const paddleSpecs = PADDLE_SPECS[gameState.player.paddleType];
        
        // Speed boost
        ball.velocityX = -ball.velocityX * paddleSpecs.speedMultiplier;
        
        // Spin based on paddle position
        const hitPos = (ball.y - playerPaddle.y) / playerPaddle.height;
        const spinStrength = (hitPos - 0.5) * 4 * difficulty.spinMultiplier * paddleSpecs.spinMultiplier;
        ball.spin = spinStrength;
        
        // Add paddle velocity
        ball.velocityY += playerPaddle.velocityY * 0.3;
        
        ball.lastHitByPlayer = true;
    }

    // Paddle collision - AI
    if (
        ball.velocityX > 0 &&
        ball.x + ball.radius > aiPaddle.x &&
        ball.y > aiPaddle.y &&
        ball.y < aiPaddle.y + aiPaddle.height
    ) {
        ball.x = aiPaddle.x - ball.radius;
        
        // AI uses standard paddle for balance
        ball.velocityX = -ball.velocityX * 0.95;
        
        // Spin based on paddle position
        const hitPos = (ball.y - aiPaddle.y) / aiPaddle.height;
        const spinStrength = (hitPos - 0.5) * 4 * difficulty.spinMultiplier * 0.8;
        ball.spin = spinStrength;
        
        // Add paddle velocity
        ball.velocityY += aiPaddle.velocityY * 0.3;
        
        ball.lastHitByPlayer = false;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        gameState.ai.score++;
        resetBall();
        checkWinCondition();
    }
    if (ball.x + ball.radius > GAME_RULES.tableWidth) {
        gameState.player.score++;
        resetBall();
        checkWinCondition();
    }

    updateScoreDisplay();
}

function resetBall() {
    const difficulty = DIFFICULTY_SETTINGS[gameState.ai.difficulty];
    ball.x = GAME_RULES.tableWidth / 2;
    ball.y = GAME_RULES.tableHeight / 2;
    ball.velocityX = (Math.random() > 0.5 ? 1 : -1) * difficulty.ballSpeed;
    ball.velocityY = (Math.random() - 0.5) * 2;
    ball.spin = 0;
}

function checkWinCondition() {
    const playerScore = gameState.player.score;
    const aiScore = gameState.ai.score;

    if (playerScore >= GAME_RULES.winPoints && playerScore - aiScore >= GAME_RULES.minPointLead) {
        endGame(true);
    } else if (aiScore >= GAME_RULES.winPoints && aiScore - playerScore >= GAME_RULES.minPointLead) {
        endGame(false);
    }
}

function endGame(playerWon) {
    gameState.gameActive = false;
    gameState.gameOver = true;

    // Update stats
    gameState.stats.totalGames++;
    gameState.stats.totalPoints += gameState.player.score + gameState.ai.score;

    const difficulty = gameState.ai.difficulty;
    if (playerWon) {
        gameState.stats.wins++;
        gameState.stats.byDifficulty[difficulty].wins++;
        
        // Award coins based on difficulty
        const coinsEarned = {
            beginner: 50,
            intermediate: 100,
            advanced: 200,
            expert: 500
        };
        gameState.coins += coinsEarned[difficulty];
    } else {
        gameState.stats.losses++;
        gameState.stats.byDifficulty[difficulty].losses++;
    }

    saveGameState();
    showGameOverScreen(playerWon);
}

function saveGameState() {
    localStorage.setItem('tableTennisState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('tableTennisState');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
        updateUIWithStats();
    }
}

// ==================== RENDERING ====================
function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, GAME_RULES.tableWidth, GAME_RULES.tableHeight);

    // Draw net
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GAME_RULES.tableWidth / 2, 0);
    ctx.lineTo(GAME_RULES.tableWidth / 2, GAME_RULES.tableHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw table lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, GAME_RULES.tableWidth, GAME_RULES.tableHeight);

    // Draw paddles
    drawPaddle(playerPaddle, gameState.player.paddleColor);
    drawPaddle(aiPaddle, '#4D96FF');

    // Draw ball
    drawBall();

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GAME_RULES.tableWidth / 2, 0);
    ctx.lineTo(GAME_RULES.tableWidth / 2, GAME_RULES.tableHeight);
    ctx.stroke();
}

function drawPaddle(paddle, color) {
    // Main paddle
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Paddle shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width / 3, paddle.height);

    // Paddle outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    // Ball glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // Main ball
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball curve lines
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius - 2, 0, Math.PI);
    ctx.stroke();
}

function updateScoreDisplay() {
    document.getElementById('player-score').textContent = gameState.player.score;
    document.getElementById('ai-score').textContent = gameState.ai.score;
}

// ==================== GAME LOOP ====================
let difficulty;

function gameLoop() {
    if (gameState.gameActive && !gameState.gamePaused) {
        updatePlayerPaddle();
        updateAIPaddle();
        updateBall();
    }

    drawGame();

    requestAnimationFrame(gameLoop);
}

// ==================== UI FUNCTIONS ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function startGame() {
    showScreen('difficulty-screen');
}

function startGameWithDifficulty(difficultyLevel) {
    difficulty = DIFFICULTY_SETTINGS[difficultyLevel];
    gameState.ai.difficulty = difficultyLevel;

    // Reset scores
    gameState.player.score = 0;
    gameState.ai.score = 0;
    gameState.gameActive = true;
    gameState.gamePaused = false;
    gameState.gameOver = false;

    // Initialize ball
    resetBall();

    // Update UI
    document.getElementById('game-player-name').textContent = gameState.player.name;
    document.getElementById('player-avatar').textContent = ['👨', '👩', '🧑', '🥷'][gameState.player.avatar];
    document.getElementById('ai-difficulty').textContent = `AI (${difficulty.label})`;
    document.getElementById('difficulty-display').textContent = `Difficulty: ${difficulty.label}`;
    document.getElementById('paddle-display').textContent = `Paddle: ${PADDLE_SPECS[gameState.player.paddleType].name}`;
    updateScoreDisplay();

    showScreen('game-screen');
    gameLoop();
}

function togglePause() {
    gameState.gamePaused = !gameState.gamePaused;
    document.getElementById('pause-menu').classList.toggle('hidden');
    document.getElementById('pause-text').textContent = gameState.gamePaused ? 'Paused' : 'Press SPACE to Pause';
}

function showGameOverScreen(playerWon) {
    const title = playerWon ? '🎉 You Won!' : '😢 Game Over!';
    const coinsEarned = playerWon ? {
        beginner: 50,
        intermediate: 100,
        advanced: 200,
        expert: 500
    }[gameState.ai.difficulty] : 0;

    document.getElementById('game-over-title').textContent = title;
    document.getElementById('final-player-score').textContent = gameState.player.score;
    document.getElementById('final-ai-score').textContent = gameState.ai.score;
    document.getElementById('coins-earned').textContent = coinsEarned;

    document.getElementById('game-over-screen').classList.remove('hidden');
}

function playAgain() {
    document.getElementById('game-over-screen').classList.add('hidden');
    startGame();
}

function goToMenu() {
    gameState.gameActive = false;
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    showScreen('menu-screen');
}

function openCustomization() {
    document.getElementById('player-name').value = gameState.player.name;
    document.getElementById('paddle-color').value = gameState.player.paddleColor;
    
    document.querySelectorAll('.avatar-option').forEach((el, i) => {
        el.classList.toggle('selected', i === gameState.player.avatar);
    });
    
    showScreen('customization-screen');
}

function saveCustomization() {
    gameState.player.name = document.getElementById('player-name').value || 'Player';
    gameState.player.paddleColor = document.getElementById('paddle-color').value;
    saveGameState();
    showScreen('menu-screen');
}

function selectAvatar(index) {
    gameState.player.avatar = index;
    document.querySelectorAll('.avatar-option').forEach((el, i) => {
        el.classList.toggle('selected', i === index);
    });
}

function updatePaddleColor() {
    const color = document.getElementById('paddle-color').value;
    gameState.player.paddleColor = color;
}

function selectPaddle(paddleType) {
    gameState.player.paddleType = paddleType;
    saveGameState();
    updatePaddleShopUI();
}

function buyPaddle(paddleType) {
    const price = PADDLE_SPECS[paddleType].price;

    if (gameState.coins >= price) {
        gameState.coins -= price;
        if (!gameState.ownedPaddles.includes(paddleType)) {
            gameState.ownedPaddles.push(paddleType);
        }
        gameState.player.paddleType = paddleType;
        saveGameState();
        updatePaddleShopUI();
        alert(`🎉 Purchased ${PADDLE_SPECS[paddleType].name}!`);
    } else {
        alert(`❌ Not enough coins! You need ${price - gameState.coins} more coins.`);
    }
}

function updatePaddleShopUI() {
    document.getElementById('coins-display').textContent = gameState.coins;

    const paddleTypes = ['standard', 'power', 'spin', 'elite', 'quantum'];
    
    paddleTypes.forEach(paddleType => {
        const btn = document.querySelector(`button[data-paddle="${paddleType}"]`);
        if (!btn) return;

        if (gameState.player.paddleType === paddleType) {
            btn.textContent = '✓ Equipped';
            btn.disabled = true;
            btn.className = 'paddle-btn equipped';
        } else if (gameState.ownedPaddles.includes(paddleType)) {
            btn.textContent = 'Equip';
            btn.disabled = false;
            btn.onclick = () => selectPaddle(paddleType);
            btn.className = 'paddle-btn owned';
        } else {
            const price = PADDLE_SPECS[paddleType].price;
            btn.textContent = `Buy (${price} 💰)`;
            btn.disabled = false;
            btn.onclick = () => buyPaddle(paddleType);
            btn.className = 'paddle-btn available';
        }
    });
}

function openShop() {
    updatePaddleShopUI();
    showScreen('shop-screen');
}

function openStats() {
    updateUIWithStats();
    showScreen('stats-screen');
}

function updateUIWithStats() {
    const winRate = gameState.stats.totalGames > 0 
        ? Math.round((gameState.stats.wins / gameState.stats.totalGames) * 100) 
        : 0;

    document.getElementById('stat-total-games').textContent = gameState.stats.totalGames;
    document.getElementById('stat-wins').textContent = gameState.stats.wins;
    document.getElementById('stat-losses').textContent = gameState.stats.losses;
    document.getElementById('stat-winrate').textContent = winRate + '%';
    document.getElementById('stat-total-points').textContent = gameState.stats.totalPoints;

    // Best difficulty
    let bestDifficulty = 'None';
    let bestWins = 0;
    for (const [diff, stats] of Object.entries(gameState.stats.byDifficulty)) {
        if (stats.wins > bestWins) {
            bestWins = stats.wins;
            bestDifficulty = DIFFICULTY_SETTINGS[diff].label;
        }
    }
    document.getElementById('stat-best-difficulty').textContent = bestDifficulty;

    // Difficulty breakdown
    const breakdownHTML = Object.entries(gameState.stats.byDifficulty)
        .map(([diff, stats]) => `
            <div class="difficulty-breakdown-card">
                <h4>${DIFFICULTY_SETTINGS[diff].label}</h4>
                <p>Wins: ${stats.wins} | Losses: ${stats.losses}</p>
            </div>
        `).join('');
    document.getElementById('difficulty-breakdown').innerHTML = breakdownHTML;

    updatePaddleShopUI();
}

function resetStats() {
    if (confirm('Are you sure you want to reset all statistics? This cannot be undone!')) {
        gameState.stats = {
            totalGames: 0,
            wins: 0,
            losses: 0,
            totalPoints: 0,
            byDifficulty: {
                beginner: { wins: 0, losses: 0 },
                intermediate: { wins: 0, losses: 0 },
                advanced: { wins: 0, losses: 0 },
                expert: { wins: 0, losses: 0 }
            }
        };
        gameState.coins = 0;
        gameState.ownedPaddles = ['standard'];
        gameState.player.paddleType = 'standard';
        saveGameState();
        updateUIWithStats();
        alert('✓ Stats and progress have been reset!');
    }
}

// ==================== INITIALIZATION ====================
window.addEventListener('load', () => {
    loadGameState();
    updateUIWithStats();
    showScreen('menu-screen');
    gameLoop();
});
