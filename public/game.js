import { getDatabase } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const resetBtn = document.querySelector("#resetBtn");
const gameWidth = 16 * 100;   // Width for 16:9 aspect ratio
const gameHeight = 9 * 100;   // Height for 16:9 aspect ratio
const boardBackground = "forestgreen";
const paddle1Color = "lightblue";
const paddle2Color = "red";
const paddleBorder = "black";
const ballColor = "yellow";
const ballBorderColor = "black";
const ballRadius = 10;      // Adjusted for 9:16 aspect ratio
const paddleSpeed = 5;      // Adjusted for smoother movement

const database = getDatabase();


// Assuming you have already initialized Firebase as "firebase" in your game.js
const roomRef = database.ref('rooms').child(roomName);

roomRef.on('value', (snapshot) => {
    const roomData = snapshot.val();

    // Update the game state and UI based on the room data
    // You might need to adjust this part to fit your game's data structure
    // and how you want to update the game state and UI

    // Example: Update the positions of paddles and ball
    if (roomData) {
        const player1 = roomData.players.player1;
        const player2 = roomData.players.player2;

        // Update the positions of paddles and ball based on player1 and player2 data
        // For example:
        if (playerType === 'player1' && player1) {
            paddle1.y = player1.paddleY;
        } else if (playerType === 'player2' && player2) {
            paddle2.y = player2.paddleY;
        }

        ballX = roomData.ballX;
        ballY = roomData.ballY;
        ballXDirection = roomData.ballXDirection;
        ballYDirection = roomData.ballYDirection;

        // Update the game UI
        drawPaddles();
        drawBall(ballX, ballY);
    }
});


let roomName = '';  // Store the room name
let playerType = ''; // Store the player type ('player1' or 'player2')

let intervalID;
let ballSpeed;
let ballX = gameWidth / 2;
let ballY = gameHeight / 2;
let ballXDirection = 0;
let ballYDirection = 0;
let player1Score = 0;
let player2Score = 0;
let paddle1 = {
    width: 25,                  // Adjusted for 9:16 aspect ratio
    height: 120,                // Adjusted for 9:16 aspect ratio
    x: 0,
    y: 0
};
let paddle2 = {
    width: 25,                  // Adjusted for 9:16 aspect ratio
    height: 120,                // Adjusted for 9:16 aspect ratio
    x: gameWidth - 25,
    y: gameHeight - 120
};

// Create two objects to keep track of keys being pressed
const keys = {};
const keys2 = {};

// Add event listeners to track keydown and keyup events
window.addEventListener("keydown", (event) => {
    keys[event.keyCode] = true;
});

window.addEventListener("keyup", (event) => {
    delete keys[event.keyCode];
});

window.addEventListener("keydown", (event) => {
    keys2[event.keyCode] = true;
});

window.addEventListener("keyup", (event) => {
    delete keys2[event.keyCode];
});

resetBtn.addEventListener("click", resetGame);

gameStart();

function gameStart() {
    gameBoard.width = gameWidth;
    gameBoard.height = gameHeight;
    createBall();
    nextTick();
}

function movePaddles() {
    // Move Paddle 1 (user 1)
    if (playerType === 'player1') {
        if (keys[87] && paddle1.y > 0) {
            paddle1.y -= paddleSpeed;
        }
        if (keys[83] && paddle1.y < gameHeight - paddle1.height) {
            paddle1.y += paddleSpeed;
        }
        
        // Update Firebase room data for player 1
        roomRef.child('players').child('player1').update({
            paddleY: paddle1.y,
        });
    }

    // Move Paddle 2 (user 2)
    if (playerType === 'player2') {
        if (keys[38] && paddle2.y > 0) {
            paddle2.y -= paddleSpeed;
        }
        if (keys[40] && paddle2.y < gameHeight - paddle2.height) {
            paddle2.y += paddleSpeed;
        }

        // Update Firebase room data for player 2
        roomRef.child('players').child('player2').update({
            paddleY: paddle2.y,
        });
    }
}



function nextTick() {
    intervalID = setTimeout(() => {
        clearBoard();
        movePaddles();
        drawPaddles();
        moveBall();
        drawBall(ballX, ballY);
        checkCollision();
        nextTick();
    }, 10);
}

function clearBoard() {
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, gameWidth, gameHeight);
}

function drawPaddles() {
    ctx.strokeStyle = paddleBorder;

    ctx.fillStyle = paddle1Color;
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.strokeRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);

    ctx.fillStyle = paddle2Color;
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
    ctx.strokeRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);
}

function createBall() {
    ballSpeed = 1.5;
    if (Math.round(Math.random()) == 1) {
        ballXDirection = 1;
    } else {
        ballXDirection = -1;
    }
    if (Math.round(Math.random()) == 1) {
        ballYDirection = Math.random() * 1;
    } else {
        ballYDirection = Math.random() * -1;
    }
    ballX = gameWidth / 2;
    ballY = gameHeight / 2;
    drawBall(ballX, ballY);
}

function moveBall() {
    ballX += ballSpeed * ballXDirection;
    ballY += ballSpeed * ballYDirection;

    roomRef.update({
        ballX: ballX,
        ballY: ballY,
        ballXDirection: ballXDirection,
        ballYDirection: ballYDirection,
    });
}

function drawBall(ballX, ballY) {
    ctx.fillStyle = ballColor;
    ctx.strokeStyle = ballBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
}

function checkCollision() {
    // Check collision with top and bottom walls
    if (ballY <= 0 + ballRadius || ballY >= gameHeight - ballRadius) {
        ballYDirection *= -1;
    }

    // Check collision with paddles
    if (ballX <= paddle1.x + paddle1.width + ballRadius &&
        ballY > paddle1.y && ballY < paddle1.y + paddle1.height) {
        ballX = paddle1.x + paddle1.width + ballRadius;
        ballXDirection *= -1;
        ballSpeed += 1;
    }

    if (ballX >= paddle2.x - ballRadius &&
        ballY > paddle2.y && ballY < paddle2.y + paddle2.height) {
        ballX = paddle2.x - ballRadius;
        ballXDirection *= -1;
        ballSpeed += 1;
    }

    // Check for game over conditions (e.g., reaching a certain score)
    if (player1Score >= 10 || player2Score >= 10) {
        clearInterval(intervalID); // Stop the game loop

        // Update scores in the database
        roomRef.child('players').child('player1').update({
            score: player1Score,
        });

        roomRef.child('players').child('player2').update({
            score: player2Score,
        });

        // Perform any additional game over logic here (e.g., show a game over message)

        // Clean up the room
        cleanUpRoom();
    }

    // Check for scoring
    if (ballX <= 0) {
        player2Score += 1;
        updateScore();
        createBall();
        return;
    }
    if (ballX >= gameWidth) {
        player1Score += 1;
        updateScore();
        createBall();
        return;
    }
}

function cleanUpRoom() {
    // Remove the room data from the database
    roomRef.remove()
        .then(() => {
            console.log('Room cleaned up.');
        })
        .catch(error => {
            console.error('Error cleaning up room:', error);
        });

    // Add any additional cleanup tasks here

    // Show a message indicating that the room is being cleaned up
    // (you can customize this part based on your UI)
    alert('Room is being cleaned up.');

    // Redirect players back to the main page or perform any other necessary actions
    window.location.href = 'index.html'; // Adjust the URL as needed
}

function updateScore() {
    scoreText.textContent = `${player1Score} : ${player2Score}`;
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    paddle1 = {
        width: 25,
        height: 120,
        x: 0,
        y: 0
    };
    paddle2 = {
        width: 25,
        height: 120,
        x: gameWidth - 25,
        y: gameHeight - 120
    };
    ballSpeed = 1;
    ballX = 0;
    ballY = 0;
    ballXDirection = 0;
    ballYDirection = 0;
    updateScore();
    clearInterval(intervalID);
    gameStart();
}
