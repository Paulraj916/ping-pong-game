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
const introContainer = document.querySelector("#introContainer");
const createRoomBtn = document.querySelector("#createRoomBtn");
const joinRoomBtn = document.querySelector("#joinRoomBtn");
const nameInputContainer = document.querySelector("#nameInputContainer");
const nameInput = document.querySelector("#nameInput");
const nameSubmitBtn = document.querySelector("#nameSubmitBtn");
const gameContainer = document.querySelector("#gameContainer");

// Initialize the Realtime Database
//const database = database();

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

createRoomBtn.addEventListener('click', () => {
    showNameInput('create');
});

joinRoomBtn.addEventListener('click', () => {
    showNameInput('join');
});

// createRoomBtn.addEventListener('click', () => {
//     const playerName = nameInput.value.trim();
//     if (playerName !== '') {
//         roomName = playerName;
//         playerType = 'player1';
//         createRoom(roomName, playerName);
//         navigateToGameRoom(roomName); // Navigate to game room after creating
//     }
// });

// joinRoomBtn.addEventListener('click', () => {
//     const playerName = nameInput.value.trim();
//     if (playerName !== '') {
//         roomName = playerName;
//         playerType = 'player2';
//         joinRoom(roomName, playerName);
//         navigateToGameRoom(roomName); // Navigate to game room after joining
//     }
// });

nameSubmitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (name !== '') {
        if (nameSubmitBtn.dataset.action === 'create') {
            roomName = name;
            playerType = 'player1';
            createRoom(roomName, name);
            navigateToGameRoom(roomName);
        } else if (nameSubmitBtn.dataset.action === 'join') {
            roomName = name;
            playerType = 'player2';
            joinRoom(roomName, name);
            navigateToGameRoom(roomName);
        }
    }
});

function createRoom(roomName, playerName) {
    const roomRef = database.ref('rooms').child(roomName);
    roomRef.once('value', snapshot => {
        if (!snapshot.exists()) {
            const players = {
                [playerType]: playerName  // Set player name based on type
            };
            roomRef.set({ players });
            hideNameInput();
            showGameContainer();
            // Start the game or navigate to the game room
        } else {
            alert('Room already exists.');
        }
    });
}

function joinRoom(roomName, playerName) {
    const roomRef = database.ref('rooms').child(roomName);
    roomRef.once('value', snapshot => {
        if (snapshot.exists()) {
            const players = snapshot.val().players;
            if (!players['player2']) {
                players['player2'] = playerName; // Set player name based on type
                roomRef.update({ players });
                hideNameInput();
                showGameContainer();
                // Start the game or navigate to the game room
            } else {
                alert('Room is full.');
            }
        } else {
            alert('Room does not exist.');
        }
    });
}

function navigateToGameRoom(roomName) {
    //window.location.href = `game-room.html?room=${roomName}`;
    // Navigate to the game room page with the room name as a query parameter
    const gameRoomURL = `game-room.html?room=${encodeURIComponent(roomName)}`;
    window.location.href = gameRoomURL;
}

function showNameInput(action) {
    introContainer.style.display = 'none';
    gameContainer.style.display = 'none';
    nameInputContainer.style.display = 'block';
    nameSubmitBtn.dataset.action = action;
    nameInput.focus(); // Set focus to the input field
}

function hideNameInput() {
    nameInputContainer.style.display = 'none';
    nameInput.value = ''; // Clear the input value
}

function showGameContainer() {
    introContainer.style.display = 'none';
    nameInputContainer.style.display = 'none';
    gameContainer.style.display = 'block';
    gameStart();
}


function storeName(name) {
    const action = nameSubmitBtn.dataset.action;
    if (action === "create") {
        localStorage.setItem("player1Name", name);
    } else if (action === "join") {
        localStorage.setItem("player2Name", name);
    }
}


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
    }

    // Move Paddle 2 (user 2)
    if (playerType === 'player2') {
        if (keys[38] && paddle2.y > 0) {
            paddle2.y -= paddleSpeed;
        }
        if (keys[40] && paddle2.y < gameHeight - paddle2.height) {
            paddle2.y += paddleSpeed;
        }
    }
}

function nextTick() {
    intervalID = setTimeout(() => {
        clearBoard();
        movePaddles(); // Call the function to move the paddles
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
    if (ballY <= 0 + ballRadius) {
        ballYDirection *= -1;
    }
    if (ballY >= gameHeight - ballRadius) {
        ballYDirection *= -1;
    }
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
    if (ballX <= paddle1.x + paddle1.width + ballRadius) {
        if (ballY > paddle1.y && ballY < paddle1.y + paddle1.height) {
            ballX = paddle1.x + paddle1.width + ballRadius;
            ballXDirection *= -1;
            ballSpeed += 1;
        }
    }
    if (ballX >= paddle2.x - ballRadius) {
        if (ballY > paddle2.y && ballY < paddle2.y + paddle2.height) {
            ballX = paddle2.x - ballRadius;
            ballXDirection *= -1;
            ballSpeed += 1;
        }
    }
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