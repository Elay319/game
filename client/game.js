// ========================================
// MULTIPLAYER
// ========================================

const socket = io('http://10.100.102.122:3000');
const socket = io('https://game-euks.onrender.com');

const otherPlayers = {};
const scene = new THREE.Scene();
@@ -1117,7 +1116,7 @@ async function publishCurrentGame() {
// SEND TO SERVER

await fetch(
  'http://10.100.102.122:3000/publish',
  'https://game-euks.onrender.com/publish',
{

method: 'POST',
@@ -1144,7 +1143,7 @@ await fetch(
async function loadServerGames() {

const response = await fetch(
    'http://10.100.102.122:3000/games'
    'https://game-euks.onrender.com/games'
);

const games =
@@ -1244,4 +1243,4 @@ setInterval(() => {

loadServerGames();

}, 3000);
}, 3000);
