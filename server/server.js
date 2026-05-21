const express = require('express');

const cors = require('cors');

const fs = require('fs');

const path = require('path');

const app = express();
const http = require('http');

const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {

  cors: {

    origin: "*"

  }

});

app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// GAMES FOLDER

const gamesFolder =
  path.join(__dirname, 'games');

// CREATE IF NOT EXISTS

if(!fs.existsSync(gamesFolder)) {

  fs.mkdirSync(gamesFolder);

}

// ========================================
// SAVE GAME
// ========================================

app.post('/publish', (req, res) => {

  const game = req.body;

  if(!game.name) {

    return res.status(400).send('No game name');

  }

  const filePath = path.join(
    gamesFolder,
    game.name + '.json'
  );

  fs.writeFileSync(
    filePath,
    JSON.stringify(game, null, 2)
  );

  res.send('Game published');

});

// ========================================
// GET GAMES
// ========================================

app.get('/games', (req, res) => {

  const files =
    fs.readdirSync(gamesFolder);

  const games = [];

  for(const file of files) {

    const data = JSON.parse(

      fs.readFileSync(
        path.join(gamesFolder, file)
      )

    );

    games.push(data);

  }

  res.json(games);

});

// ========================================
// ========================================
// MULTIPLAYER
// ========================================

const players = {};

io.on('connection', (socket) => {

  console.log('Player joined');

  // CREATE PLAYER

  players[socket.id] = {

    x: 0,
    y: 1,
    z: 0

  };

  // SEND PLAYERS

  io.emit('players', players);

  // PLAYER MOVEMENT

  socket.on('move', (data) => {

    if(players[socket.id]) {

      players[socket.id].x = data.x;

      players[socket.id].y = data.y;

      players[socket.id].z = data.z;

    }

    io.emit('players', players);

  });

  // DISCONNECT

  socket.on('disconnect', () => {

    delete players[socket.id];

    io.emit('players', players);

    console.log('Player left');

  });

});
server.listen(3000, '0.0.0.0', () => {

  console.log(
    'Server running on port 3000'
  );

});