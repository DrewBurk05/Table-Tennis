const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;

// Paddle
let paddle = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 40,
    width: 120,
    height: 15,
    speed: 10,
    skin: "wood"
};

// AI Paddle
let ai = {
    x: canvas.width / 2 - 50,
    y: 25,
    width: 120,
    height: 15,
    speed: 4
};

// Ball
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speedX: 4,
    speedY: 4,
    spin: 0
};

// Score
let playerScore = 0;
let aiScore = 0;
let serveCounter = 0;

// Difficulty settings
const difficultySettings = {
    beginner: { ballSpeed: 4, aiSpeed: 3, spin: 0.5 },
    intermediate: { ballSpeed: 5, aiSpeed: 4, spin: 1 },
    advanced: { ballSpeed: 6, aiSpeed: 6, spin: 1.5 },
    pro: { ballSpeed: 7, aiSpeed: 8, spin: 2 }
};

let currentDifficulty;

// Mouse control
document.addEventListener("mousemove", (e) => {
    if (!gameRunning) return;
    let rect = canvas.getBoundingClientRect();
    paddle.x = e.clientX - rect.left - paddle.width / 2;
});

// Keyboard control
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") paddle.x -= paddle.speed;
    if (e.key === "ArrowRight") paddle.x += paddle.speed;
    if (e.key === " ") ball.speedY += 2; // smash
});

// Start game
document.getElementById("startBtn").onclick = () => {
    document.getElementById("menu").style.display = "none";
    canvas.style.display = "block";

    let diff = document.getElementById("difficulty").value;
    currentDifficulty = difficultySettings[diff];

    paddle.skin = document.getElementById("paddleSkin").value;

    resetBall();
    gameRunning = true;
    gameLoop();
};

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = currentDifficulty.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.speedY = currentDifficulty.ballSpeed;
    ball.spin = 0;
}

function drawPaddle(p, color) {
    ctx.fillStyle = color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
}

function updateAI() {
    if (ball.x < ai.x + ai.width / 2) ai.x -= currentDifficulty.aiSpeed;
    if (ball.x > ai.x + ai.width / 2) ai.x += currentDifficulty.aiSpeed;
}

function applySpin() {
    ball.x += ball.spin;
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move ball
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    applySpin();

    // Wall bounce
    if (ball.x < 0 || ball.x > canvas.width) ball.speedX *= -1;

    // Paddle collision
    if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
    ) {
        ball.speedY *= -1;

        // Spin based on paddle movement
        ball.spin = (ball.x - (paddle.x + paddle.width / 2)) * 0.05 * currentDifficulty.spin;
    }

    // AI collision
    if (
        ball.y - ball.radius < ai.y + ai.height &&
        ball.x > ai.x &&
        ball.x < ai.x + ai.width
    ) {
        ball.speedY *= -1;
        ball.spin = (ball.x - (ai.x + ai.width / 2)) * 0.05 * currentDifficulty.spin;
    }

    // Score
    if (ball.y > canvas.height) {
        aiScore++;
        resetBall();
    }
    if (ball.y < 0) {
        playerScore++;
        resetBall();
    }

    updateAI();

    // Draw everything
    drawPaddle(paddle, "#00eaff");
    drawPaddle(ai, "#ff0066");
    drawBall();

    // Scoreboard
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Player: ${playerScore}`, 20, canvas.height - 20);
    ctx.fillText(`AI: ${aiScore}`, 20, 40);

    requestAnimationFrame(gameLoop);
}
