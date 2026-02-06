// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Game State: Store all connected players
let players = {};

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  // Create a new player object when someone connects
  players[socket.id] = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    color: getRandomColor()
  };

  // Send the current players to the new connection
  socket.emit('currentPlayers', players);

  // Notify other players about the new player
  socket.broadcast.emit('newPlayer', { 
    id: socket.id, 
    player: players[socket.id] 
  });

  // Handle player movement
  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      
      // Broadcast the movement to everyone else
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: players[socket.id].x,
        y: players[socket.id].y
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

server.listen(3000, () => {
  console.log('Game server running on port 3000');
});