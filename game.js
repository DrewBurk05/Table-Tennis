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
let canvas = null;
let ctx = null;
let animationId = null;

// ==================== GAME OBJECTS ====================
let playerPaddle = {
    x: 20,
    y: 250,
    width: 12,
    height: 100,
    velocityY: 0,
    maxSpeed: 8
};

let aiPaddle = {
    x: 968,
    y: 250,
    width: 12,
    height: 100,
    velocityY: 0,
    maxSpeed: 8
};

let ball = {
    x: 500,
    y: 300,
    radius: 8,
    velocityX: 4,
    velocityY: 0,
    spin: 0,
    lastHitByPlayer: false
};

let aiState = {
    lastReactionTime: 0,
    predictedBallY: 300,
    targetY: 300
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
    if (!canvas) return;
    
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
        try {
            Object.assign(gameState, JSON.parse(saved));
        } catch (e) {
            console.log('Could not load saved state');
        }
    }
}

// ==================== RENDERING ====================
function drawGame() {
    if (!ctx) return;

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
    const playerScoreEl = document.getElementById('player-score');
    const aiScoreEl = document.getElementById('ai-score');
    if (playerScoreEl) playerScoreEl.textContent = gameState.player.score;
    if (aiScoreEl) aiScoreEl.textContent = gameState.ai.score;
}

// ==================== GAME LOOP ====================
function gameLoop() {
    if (gameState.gameActive && !gameState.gamePaused) {
        updatePlayerPaddle();
        updateAIPaddle();
        updateBall();
    }

    drawGame();

    if (gameState.gameActive) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// ==================== UI FUNCTIONS ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

function startGame() {
    showScreen('difficulty-screen');
}

function startGameWithDifficulty(difficultyLevel) {
    // Setup canvas
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    if (!canvas || !ctx) {
        console.error('Canvas not found!');
        alert('Error: Canvas not found. Please reload the page.');
        return;
    }

    const difficulty = DIFFICULTY_SETTINGS[difficultyLevel];
    gameState.ai.difficulty = difficultyLevel;

    // Reset game state
    gameState.player.score = 0;
    gameState.ai.score = 0;
    gameState.gameActive = true;
    gameState.gamePaused = false;
    gameState.gameOver = false;

    // Reset paddles and ball
    playerPaddle = {
        x: 20,
        y: GAME_RULES.tableHeight / 2 - GAME_RULES.paddleHeight / 2,
        width: GAME_RULES.paddleWidth,
        height: GAME_RULES.paddleHeight,
        velocityY: 0,
        maxSpeed: 8
    };

    aiPaddle = {
        x: GAME_RULES.tableWidth - GAME_RULES.paddleWidth - 20,
        y: GAME_RULES.tableHeight / 2 - GAME_RULES.paddleHeight / 2,
        width: GAME_RULES.paddleWidth,
        height: GAME_RULES.paddleHeight,
        velocityY: 0,
        maxSpeed: 8
    };

    resetBall();

    // Update UI
    const playerNameEl = document.getElementById('game-player-name');
    const avatarEl = document.getElementById('player-avatar');
    const aiDiffEl = document.getElementById('ai-difficulty');
    const diffDisplayEl = document.getElementById('difficulty-display');
    const paddleDisplayEl = document.getElementById('paddle-display');

    if (playerNameEl) playerNameEl.textContent = gameState.player.name;
    if (avatarEl) avatarEl.textContent = ['👨', '👩', '🧑', '🥷'][gameState.player.avatar];
    if (aiDiffEl) aiDiffEl.textContent = `AI (${difficulty.label})`;
    if (diffDisplayEl) diffDisplayEl.textContent = `Difficulty: ${difficulty.label}`;
    if (paddleDisplayEl) paddleDisplayEl.textContent = `Paddle: ${PADDLE_SPECS[gameState.player.paddleType].name}`;
    
    updateScoreDisplay();

    // Hide pause menu and game over screen
    const pauseMenu = document.getElementById('pause-menu');
    const gameOverScreen = document.getElementById('game-over-screen');
    if (pauseMenu) pauseMenu.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');

    // Show game screen
    showScreen('game-screen');

    // Start game loop
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    gameLoop();
}

function togglePause() {
    gameState.gamePaused = !gameState.gamePaused;
    const pauseMenu = document.getElementById('pause-menu');
    if (pauseMenu) {
        pauseMenu.classList.toggle('hidden');
    }
    const pauseText = document.getElementById('pause-text');
    if (pauseText) {
        pauseText.textContent = gameState.gamePaused ? 'Paused' : 'Press SPACE to Pause';
    }
}

function showGameOverScreen(playerWon) {
    const title = playerWon ? '🎉 You Won!' : '😢 Game Over!';
    const coinsEarned = playerWon ? {
        beginner: 50,
        intermediate: 100,
        advanced: 200,
        expert: 500
    }[gameState.ai.difficulty] : 0;

    const titleEl = document.getElementById('game-over-title');
    const playerScoreEl = document.getElementById('final-player-score');
    const aiScoreEl = document.getElementById('final-ai-score');
    const coinsEl = document.getElementById('coins-earned');

    if (titleEl) titleEl.textContent = title;
    if (playerScoreEl) playerScoreEl.textContent = gameState.player.score;
    if (aiScoreEl) aiScoreEl.textContent = gameState.ai.score;
    if (coinsEl) coinsEl.textContent = coinsEarned;

    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
    }
}

function playAgain() {
    const gameOverScreen = document.getElementById('game-over-screen');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    startGame();
}

function goToMenu() {
    gameState.gameActive = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    const pauseMenu = document.getElementById('pause-menu');
    const gameOverScreen = document.getElementById('game-over-screen');
    if (pauseMenu) pauseMenu.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');
    showScreen('menu-screen');
}

function openCustomization() {
    const nameInput = document.getElementById('player-name');
    const colorInput = document.getElementById('paddle-color');
    
    if (nameInput) nameInput.value = gameState.player.name;
    if (colorInput) colorInput.value = gameState.player.paddleColor;
    
    document.querySelectorAll('.avatar-option').forEach((el, i) => {
        el.classList.toggle('selected', i === gameState.player.avatar);
    });
    
    showScreen('customization-screen');
}

function saveCustomization() {
    const nameInput = document.getElementById('player-name');
    if (nameInput) {
        gameState.player.name = nameInput.value || 'Player';
    }
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
    const colorInput = document.getElementById('paddle-color');
    if (colorInput) {
        gameState.player.paddleColor = colorInput.value;
    }
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
    const coinsDisplay = document.getElementById('coins-display');
    if (coinsDisplay) {
        coinsDisplay.textContent = gameState.coins;
    }

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

    const elements = {
        'stat-total-games': gameState.stats.totalGames,
        'stat-wins': gameState.stats.wins,
        'stat-losses': gameState.stats.losses,
        'stat-winrate': winRate + '%',
        'stat-total-points': gameState.stats.totalPoints
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    // Best difficulty
    let bestDifficulty = 'None';
    let bestWins = 0;
    for (const [diff, stats] of Object.entries(gameState.stats.byDifficulty)) {
        if (stats.wins > bestWins) {
            bestWins = stats.wins;
            bestDifficulty = DIFFICULTY_SETTINGS[diff].label;
        }
    }
    const bestEl = document.getElementById('stat-best-difficulty');
    if (bestEl) bestEl.textContent = bestDifficulty;

    // Difficulty breakdown
    const breakdownHTML = Object.entries(gameState.stats.byDifficulty)
        .map(([diff, stats]) => `
            <div class="difficulty-breakdown-card">
                <h4>${DIFFICULTY_SETTINGS[diff].label}</h4>
                <p>Wins: ${stats.wins} | Losses: ${stats.losses}</p>
            </div>
        `).join('');
    const breakdownEl = document.getElementById('difficulty-breakdown');
    if (breakdownEl) breakdownEl.innerHTML = breakdownHTML;

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
});
