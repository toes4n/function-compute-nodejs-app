const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let players = {};
const speed = 5;

// My local player state (to predict movement smoothly)
let myId = null;

// Handle Input
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

document.addEventListener('keydown', (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    if(keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

// --- Socket Events ---

// 1. Receive the list of current players when we join
socket.on('currentPlayers', (serverPlayers) => {
    players = serverPlayers;
    myId = socket.id;
    requestAnimationFrame(gameLoop); // Start the game loop
});

// 2. A new player joined
socket.on('newPlayer', (data) => {
    players[data.id] = data.player;
});

// 3. A player moved
socket.on('playerMoved', (data) => {
    if(players[data.id]) {
        players[data.id].x = data.x;
        players[data.id].y = data.y;
    }
});

// 4. A player left
socket.on('playerDisconnected', (id) => {
    delete players[id];
});

// --- Game Loop ---

function update() {
    if (myId && players[myId]) {
        let moved = false;
        
        if (keys.ArrowUp && players[myId].y > 0) {
            players[myId].y -= speed;
            moved = true;
        }
        if (keys.ArrowDown && players[myId].y < canvas.height - 20) {
            players[myId].y += speed;
            moved = true;
        }
        if (keys.ArrowLeft && players[myId].x > 0) {
            players[myId].x -= speed;
            moved = true;
        }
        if (keys.ArrowRight && players[myId].x < canvas.width - 20) {
            players[myId].x += speed;
            moved = true;
        }

        // If we moved, tell the server
        if (moved) {
            socket.emit('playerMovement', { 
                x: players[myId].x, 
                y: players[myId].y 
            });
        }
    }
}

function draw() {
    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all players
    for (let id in players) {
        let p = players[id];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 20, 20); // Draw a 20x20 square
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}