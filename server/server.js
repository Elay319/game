const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const gamesFolder = path.join(__dirname, 'games');

if(!fs.existsSync(gamesFolder)) {
  fs.mkdirSync(gamesFolder);
}

// SAVE GAME

app.post('/publish', (req, res) => {
  const game = req.body;

  if(game.hidden === undefined) {
    game.hidden = false;
  }

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

// GET GAMES

app.get('/games', (req, res) => {
  const files = fs.readdirSync(gamesFolder);
  const games = [];

  for(const file of files) {
    const data = JSON.parse(
      fs.readFileSync(
        path.join(gamesFolder, file)
      )
    );

    if(data.hidden !== true) {
      games.push(data);
    }
  }

  res.json(games);
});

// HIDE GAME

app.post('/hide-game', (req, res) => {
  const gameName = req.body.name;

  if(!gameName) {
    return res.status(400).send('No game name');
  }

  const filePath = path.join(
    gamesFolder,
    gameName + '.json'
  );

  if(!fs.existsSync(filePath)) {
    return res.status(404).send('Game not found');
  }

  const game = JSON.parse(
    fs.readFileSync(filePath)
  );

  game.hidden = true;

  fs.writeFileSync(
    filePath,
    JSON.stringify(game, null, 2)
  );

  res.send('Game hidden');
});

// MULTIPLAYER

const players = {};

io.on('connection', (socket) => {
  console.log('Player joined');

  players[socket.id] = {
    x: 0,
    y: 1,
    z: 0
  };

  io.emit('players', players);

  socket.on('move', (data) => {
    if(players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
    }

    io.emit('players', players);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('players', players);
    console.log('Player left');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
