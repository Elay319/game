document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

window.addEventListener('keydown', (e) => {

  if(e.code === 'Space') {
    e.preventDefault();
  }

});
// ========================================
// MULTIPLAYER
// ========================================
const socket = io('https://game-euks.onrender.com');

const otherPlayers = {};
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

// COLLISIONS

const collidableObjects = [];
// ========================================
// BLOCK BUILDING
// ========================================

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

// PLACE BLOCK

window.addEventListener('mousedown', (event) => {

  // ONLY SANDBOX

  if(currentGame !== "sandbox") return;

  // MUST BE IN GAME

  if(document.pointerLockElement !== renderer.domElement)
    return;

  // LEFT CLICK = PLACE

  if(event.button === 0) {

    const direction = new THREE.Vector3();

    camera.getWorldDirection(direction);

    const placeX =
      Math.round(
        player.position.x + direction.x * 3
      );

    const placeY =
      Math.round(
        player.position.y
      );

    const placeZ =
      Math.round(
        player.position.z + direction.z * 3
      );

    const block = createBlock(

      placeX,
      placeY,
      placeZ,

      Math.random() * 0xffffff

    );

    collidableObjects.push(block);

  }

  // RIGHT CLICK = DELETE

  if(event.button === 2) {

    raycaster.setFromCamera(
      new THREE.Vector2(0,0),
      camera
    );

    const intersects =
      raycaster.intersectObjects(
        collidableObjects
      );

    if(intersects.length > 0) {

      const hit =
        intersects[0].object;

      scene.remove(hit);

      const index =
        collidableObjects.indexOf(hit);

      if(index > -1) {

        collidableObjects.splice(index,1);

      }

    }

  }

});
// CAMERA

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// RENDERER

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// LIGHTS

const sun = new THREE.DirectionalLight(0xffffff, 1);

sun.position.set(10, 20, 10);

sun.castShadow = true;

scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// GROUND

const groundGeometry = new THREE.PlaneGeometry(200, 200);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x55aa55
});

const ground = new THREE.Mesh(
  groundGeometry,
  groundMaterial
);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

// PLAYER

const playerGeometry = new THREE.BoxGeometry(1, 2, 1);

const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0x0066ff
});

const player = new THREE.Mesh(
  playerGeometry,
  playerMaterial
);

player.position.set(0,1,0);

player.castShadow = true;

scene.add(player);

// SETTINGS

let yaw = 0;
let pitch = 0;

const cameraDistance = 8;

let firstPerson = false;

let currentGame = "sandbox";

let publishedGames = [];

// PHYSICS

let velocityY = 0;

let isGrounded = true;

const gravity = 0.015;

const jumpPower = 0.28;

// INPUT

const keys = {};

document.addEventListener('keydown', (e) => {

  keys[e.key.toLowerCase()] = true;

  // VIEW

  if(e.key.toLowerCase() === 'k') {

    firstPerson = !firstPerson;

  }

  // JUMP

  if(e.code === 'Space') {

    jump();

  }

});

document.addEventListener('keyup', (e) => {

  keys[e.key.toLowerCase()] = false;

});

// JUMP

function jump() {

  if(isGrounded) {

    velocityY = jumpPower;

    isGrounded = false;

  }

}

// POINTER LOCK

renderer.domElement.addEventListener('click', () => {

  renderer.domElement.requestPointerLock();

});

// CAMERA ROTATION

document.addEventListener('mousemove', (e) => {

  if(document.pointerLockElement !== renderer.domElement) return;

  yaw -= e.movementX * 0.003;

  pitch -= e.movementY * 0.003;

  pitch = Math.max(-1.4, Math.min(1.4, pitch));

});

// PHONE ROTATION

let lastTouchX = 0;
let lastTouchY = 0;

document.addEventListener('touchstart', (e) => {

  lastTouchX = e.touches[0].clientX;
  lastTouchY = e.touches[0].clientY;

});

document.addEventListener('touchmove', (e) => {

  const touch = e.touches[0];

  const dx = touch.clientX - lastTouchX;
  const dy = touch.clientY - lastTouchY;

  // RIGHT SIDE ROTATES CAMERA

  if (touch.clientX > window.innerWidth / 2) {

    yaw -= dx * 0.01;

    pitch -= dy * 0.01;

    pitch = Math.max(-1.4, Math.min(1.4, pitch));

  }

  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;

});

// MOBILE CONTROLS

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// BUTTON STYLE

function styleButton(button) {

  button.style.position = 'absolute';
  button.style.width = '90px';
  button.style.height = '90px';
  button.style.fontSize = '30px';
  button.style.borderRadius = '20px';
  button.style.opacity = '0.7';
  button.style.border = 'none';

}

// UP

const upButton = document.createElement('button');

upButton.innerText = '▲';

styleButton(upButton);

upButton.style.bottom = '140px';
upButton.style.left = '120px';

document.body.appendChild(upButton);

upButton.addEventListener('touchstart', (e) => {

  e.preventDefault();

  moveForward = true;

});

upButton.addEventListener('touchend', () => {

  moveForward = false;

});

// DOWN

const downButton = document.createElement('button');

downButton.innerText = '▼';

styleButton(downButton);

downButton.style.bottom = '30px';
downButton.style.left = '120px';

document.body.appendChild(downButton);

downButton.addEventListener('touchstart', (e) => {

  e.preventDefault();

  moveBackward = true;

});

downButton.addEventListener('touchend', () => {

  moveBackward = false;

});

// LEFT

const leftButton = document.createElement('button');

leftButton.innerText = '◀';

styleButton(leftButton);

leftButton.style.bottom = '85px';
leftButton.style.left = '20px';

document.body.appendChild(leftButton);

leftButton.addEventListener('touchstart', (e) => {

  e.preventDefault();

  moveLeft = true;

});

leftButton.addEventListener('touchend', () => {

  moveLeft = false;

});

// RIGHT

const rightButton = document.createElement('button');

rightButton.innerText = '▶';

styleButton(rightButton);

rightButton.style.bottom = '85px';
rightButton.style.left = '220px';

document.body.appendChild(rightButton);

rightButton.addEventListener('touchstart', (e) => {

  e.preventDefault();

  moveRight = true;

});

rightButton.addEventListener('touchend', () => {

  moveRight = false;

});

// JUMP BUTTON

const jumpButton = document.createElement('button');

jumpButton.innerHTML = '⬆️';

jumpButton.style.position = 'absolute';
jumpButton.style.bottom = '40px';
jumpButton.style.right = '40px';
jumpButton.style.width = '100px';
jumpButton.style.height = '100px';
jumpButton.style.borderRadius = '50%';
jumpButton.style.fontSize = '40px';
jumpButton.style.border = 'none';
jumpButton.style.opacity = '0.8';

document.body.appendChild(jumpButton);

jumpButton.addEventListener('touchstart', (e) => {

  e.preventDefault();

  jump();

});

// VIEW BUTTON

const perspectiveButton = document.createElement('button');

perspectiveButton.innerText = 'VIEW';

perspectiveButton.style.position = 'absolute';
perspectiveButton.style.top = '20px';
perspectiveButton.style.right = '20px';
perspectiveButton.style.width = '100px';
perspectiveButton.style.height = '60px';
perspectiveButton.style.fontSize = '20px';
perspectiveButton.style.borderRadius = '15px';
perspectiveButton.style.opacity = '0.8';
perspectiveButton.style.border = 'none';

document.body.appendChild(perspectiveButton);

perspectiveButton.addEventListener('touchstart', () => {

  firstPerson = !firstPerson;

});
// ========================================
// PUBLISH BUTTON
// ========================================

const publishButton =
  document.createElement('button');

publishButton.innerText =
  'PUBLISH';

publishButton.style.position =
  'absolute';

publishButton.style.top = '90px';

publishButton.style.right = '20px';

publishButton.style.width = '120px';

publishButton.style.height = '60px';

publishButton.style.fontSize = '20px';

publishButton.style.borderRadius =
  '15px';

publishButton.style.border = 'none';

publishButton.style.opacity = '0.8';

document.body.appendChild(
  publishButton
);

// CLICK

publishButton.onclick = () => {

  publishCurrentGame();

};

// MENU

const menu = document.createElement('div');

menu.style.position = 'absolute';
menu.style.top = '50%';
menu.style.left = '50%';
menu.style.transform = 'translate(-50%, -50%)';
menu.style.padding = '30px';
menu.style.background = 'rgba(0,0,0,0.8)';
menu.style.color = 'white';
menu.style.fontFamily = 'Arial';
menu.style.borderRadius = '20px';
menu.style.textAlign = 'center';

menu.innerHTML = `

<h1>My Platform</h1>

<h2>Avatar</h2>

<button id="blueAvatar">Blue</button>
<button id="redAvatar">Red</button>
<button id="greenAvatar">Green</button>

<br><br>

<h2>Games</h2>

<button id="sandboxBtn">Sandbox</button>
<button id="obbyBtn">Obby</button>
<button id="raceBtn">Race</button>

<br><br>

<button id="playBtn">PLAY</button>

`;

document.body.appendChild(menu);

// AVATARS

document.getElementById('blueAvatar').onclick = () => {
  player.material.color.set(0x0066ff);
};

document.getElementById('redAvatar').onclick = () => {
  player.material.color.set(0xff0000);
};

document.getElementById('greenAvatar').onclick = () => {
  player.material.color.set(0x00ff00);
};

// GAMES

document.getElementById('sandboxBtn').onclick = () => {
  currentGame = "sandbox";
};

document.getElementById('obbyBtn').onclick = () => {
  currentGame = "obby";
};

document.getElementById('raceBtn').onclick = () => {
  currentGame = "race";
};

// PLAY

document.getElementById('playBtn').onclick = () => {

  menu.style.display = 'none';

  loadGame(currentGame);

};

// CLEAR WORLD

function clearWorld() {

  const remove = [];

  scene.traverse((obj) => {

    if(
      obj !== player &&
      obj !== ground &&
      !(obj instanceof THREE.Camera) &&
      !(obj instanceof THREE.Light)
    ) {

      remove.push(obj);

    }

  });

  remove.forEach(obj => {

    scene.remove(obj);

  });

  collidableObjects.length = 0;

}

// CREATE BLOCK

function createBlock(x,y,z,color,w=1,h=1,d=1) {

  const block = new THREE.Mesh(

    new THREE.BoxGeometry(w,h,d),

    new THREE.MeshStandardMaterial({
      color: color
    })

  );

  block.position.set(x,y,z);

  block.castShadow = true;

  block.receiveShadow = true;

  scene.add(block);

  return block;

}

// LOAD GAME

function loadGame(game) {

  clearWorld();

  // SANDBOX

  if(game === "sandbox") {

    player.position.set(0,1,0);

  }

  // OBBY

  if(game === "obby") {

    const startPlatform = createBlock(
      0,
      0,
      8,
      0x00ff00,
      6,
      1,
      6
    );

    collidableObjects.push(startPlatform);

    player.position.set(0,3,8);

    for(let i = 0; i < 15; i++) {

      const platform = createBlock(
        i * 5,
        Math.random() * 3,
        -i * 4,
        0xff0000,
        3,
        1,
        3
      );

      collidableObjects.push(platform);

    }

  }

  // RACE

  if(game === "race") {

    player.position.set(0,2,5);

    for(let i = 0; i < 40; i++) {

      const road = createBlock(
        0,
        0,
        -i * 5,
        0x333333,
        5,
        1,
        5
      );

      collidableObjects.push(road);

    }

  }

}

// CAMERA

function updateCamera() {

  // FIRST PERSON

  if(firstPerson) {

    camera.position.set(
      player.position.x,
      player.position.y + 0.9,
      player.position.z
    );

    camera.rotation.set(0,0,0);

    camera.rotation.order = 'YXZ';

    camera.rotation.y = yaw;

    camera.rotation.x = pitch;

  }

  // THIRD PERSON

  else {

    const distance = cameraDistance;

    const camX =
      player.position.x +
      Math.sin(yaw) * Math.cos(pitch) * distance;

    const camZ =
      player.position.z +
      Math.cos(yaw) * Math.cos(pitch) * distance;

    const camY =
      player.position.y +
      Math.sin(pitch) * distance + 3;

    camera.position.set(
      camX,
      camY,
      camZ
    );

    camera.lookAt(
      player.position.x,
      player.position.y + 1,
      player.position.z
    );

  }

}

// ANIMATE
// ========================================
// OTHER PLAYERS
// ========================================

socket.on('players', (players) => {

  for(const id in players) {

    // SKIP OURSELF

    if(id === socket.id) continue;

    // CREATE PLAYER

    if(!otherPlayers[id]) {

      const mesh = new THREE.Mesh(

        new THREE.BoxGeometry(1,2,1),

        new THREE.MeshStandardMaterial({

          color: 0xff0000

        })

      );

      mesh.castShadow = true;

      scene.add(mesh);

      otherPlayers[id] = mesh;

    }

    // UPDATE POSITION

    otherPlayers[id].position.set(

      players[id].x,
      players[id].y,
      players[id].z

    );

  }

  // REMOVE LEFT PLAYERS

  for(const id in otherPlayers) {

    if(!players[id]) {

      scene.remove(otherPlayers[id]);

      delete otherPlayers[id];

    }

  }

});
function animate() {

  requestAnimationFrame(animate);

  let moveX = 0;
  let moveZ = 0;

  const speed = 0.12;

  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);

  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  // MOVEMENT

  if (keys['w'] || moveForward) {

    moveX -= forwardX * speed;
    moveZ -= forwardZ * speed;

  }

  if (keys['s'] || moveBackward) {

    moveX += forwardX * speed;
    moveZ += forwardZ * speed;

  }

  if (keys['a'] || moveLeft) {

    moveX -= rightX * speed;
    moveZ -= rightZ * speed;

  }

  if (keys['d'] || moveRight) {

    moveX += rightX * speed;
    moveZ += rightZ * speed;

  }

  const oldX = player.position.x;
  const oldZ = player.position.z;

  // MOVE

  player.position.x += moveX;
  player.position.z += moveZ;

  // GRAVITY

  velocityY -= gravity;

  player.position.y += velocityY;

  // FLOOR

  if(player.position.y <= 1) {

    player.position.y = 1;

    velocityY = 0;

    isGrounded = true;

  }

  // COLLISIONS

  let groundedThisFrame = false;

  for (const obj of collidableObjects) {

    const objBox = new THREE.Box3().setFromObject(obj);

    const playerBox = new THREE.Box3(

      new THREE.Vector3(
        player.position.x - 0.4,
        player.position.y - 1,
        player.position.z - 0.4
      ),

      new THREE.Vector3(
        player.position.x + 0.4,
        player.position.y + 1,
        player.position.z + 0.4
      )

    );

    if(playerBox.intersectsBox(objBox)) {

      const objHeight =
        obj.geometry.parameters.height || 1;

      const objTop =
        obj.position.y + objHeight / 2;

      const playerBottom =
        player.position.y - 1;

      // TOP COLLISION

      if(
        velocityY <= 0 &&
        playerBottom >= objTop - 1
      ) {

        player.position.y = objTop + 1;

        velocityY = 0;

        groundedThisFrame = true;

      }

      else {

        // SIDE COLLISION

        player.position.x = oldX;
        player.position.z = oldZ;

      }

    }

  }

  if(groundedThisFrame) {

    isGrounded = true;

  }

  else {

    if(player.position.y > 1.01) {

      isGrounded = false;

    }

  }

  // TRUE FIRST PERSON

  if(firstPerson) {

    player.visible = false;

  }

  else {

    player.visible = true;

  }

  // CAMERA

  updateCamera();
// ========================================
// SEND PLAYER POSITION
// ========================================

socket.emit('move', {

  x: player.position.x,

  y: player.position.y,

  z: player.position.z

});
  renderer.render(scene, camera);

}

animate();

// RESIZE

window.addEventListener('resize', () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

});
// ========================================
// PUBLISH GAME
// ========================================

async function publishCurrentGame() {

  const gameName =
    prompt("Game name?");

  if(!gameName) return;

  const gameData = {

    name: gameName,

    blocks: []

  };

  // SAVE BLOCKS

  for(const obj of collidableObjects) {

    gameData.blocks.push({

      x: obj.position.x,
      y: obj.position.y,
      z: obj.position.z,

      width:
        obj.geometry.parameters.width,

      height:
        obj.geometry.parameters.height,

      depth:
        obj.geometry.parameters.depth,

      color:
        obj.material.color.getHex()

    });

  }

  // SEND TO SERVER

await fetch(
  'https://game-euks.onrender.com/publish',
  {

    method: 'POST',

    headers: {

      'Content-Type':
        'application/json'

    },

    body: JSON.stringify(gameData)

  }
);

  alert('Game published!');

}
// ========================================
// LOAD SERVER GAMES
// ========================================

async function loadServerGames() {

  const response = await fetch(
    'https://game-euks.onrender.com/games'
  );

  const games =
    await response.json();

  // REMOVE OLD BUTTONS

  const oldButtons =
    document.querySelectorAll('.serverGame');

  oldButtons.forEach(btn => {

    btn.remove();

  });

  // CREATE BUTTONS

  let y = 170;

  for(const game of games) {

    const button =
      document.createElement('button');

    button.className =
      'serverGame';

    button.innerText =
      game.name;

    button.style.position =
      'absolute';

    button.style.left = '20px';

    button.style.top =
      y + 'px';

    button.style.width = '180px';

    button.style.height = '50px';

    button.style.fontSize = '20px';

    button.style.borderRadius =
      '15px';

    button.style.border = 'none';

    document.body.appendChild(
      button
    );

    // JOIN GAME

    button.onclick = () => {

      clearWorld();

      player.position.set(0,3,0);

      for(const block of game.blocks) {

        const obj = createBlock(

          block.x,
          block.y,
          block.z,

          block.color,

          block.width,
          block.height,
          block.depth

        );

        collidableObjects.push(obj);

      }

    };

    y += 60;

  }

}
// ========================================
// AUTO LOAD SERVERS
// ========================================

loadServerGames();

setInterval(() => {

  loadServerGames();

}, 3000);
