document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

window.addEventListener('keydown', (e) => {
  if(e.code === 'Space') {
    e.preventDefault();
  }
});

// MULTIPLAYER

const socket = io('https://game-euks.onrender.com');

const otherPlayers = {};

// SCENE

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

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

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled = true;

document.body.appendChild(
  renderer.domElement
);

// LIGHTS

const sun =
  new THREE.DirectionalLight(
    0xffffff,
    1
  );

sun.position.set(10,20,10);

sun.castShadow = true;

scene.add(sun);

scene.add(
  new THREE.AmbientLight(
    0xffffff,
    0.4
  )
);

// GROUND

const ground = new THREE.Mesh(

  new THREE.PlaneGeometry(200,200),

  new THREE.MeshStandardMaterial({
    color: 0x55aa55
  })

);

ground.rotation.x = -Math.PI / 2;

ground.receiveShadow = true;

scene.add(ground);

// PLAYER

const player = new THREE.Mesh(

  new THREE.BoxGeometry(1,2,1),

  new THREE.MeshStandardMaterial({
    color: 0x0066ff
  })

);

player.position.set(0,1,0);

player.castShadow = true;

scene.add(player);

// COLLISIONS

const collidableObjects = [];

// SETTINGS

let yaw = 0;
let pitch = 0;

let firstPerson = false;

let currentGame = "sandbox";

const cameraDistance = 8;

// PHYSICS

let velocityY = 0;

let isGrounded = true;

const gravity = 0.015;

const jumpPower = 0.28;

// INPUT

const keys = {};

document.addEventListener('keydown', (e) => {

  keys[e.key.toLowerCase()] = true;

  if(e.key.toLowerCase() === 'k') {

    firstPerson = !firstPerson;

  }

  if(e.code === 'Space') {

    jump();

  }

});

document.addEventListener('keyup', (e) => {

  keys[e.key.toLowerCase()] = false;

});

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

  if(
    document.pointerLockElement !==
    renderer.domElement
  ) return;

  yaw -= e.movementX * 0.003;

  pitch -= e.movementY * 0.003;

  pitch = Math.max(
    -1.4,
    Math.min(1.4,pitch)
  );

});

// CAMERA

function updateCamera() {

  if(firstPerson) {

    player.visible = false;

    camera.position.set(
      player.position.x,
      player.position.y + 0.9,
      player.position.z
    );

    camera.rotation.order = 'YXZ';

    camera.rotation.y = yaw;

    camera.rotation.x = pitch;

  }

  else {

    player.visible = true;

    const camX =
      player.position.x +
      Math.sin(yaw) *
      Math.cos(pitch) *
      cameraDistance;

    const camZ =
      player.position.z +
      Math.cos(yaw) *
      Math.cos(pitch) *
      cameraDistance;

    const camY =
      player.position.y +
      Math.sin(pitch) *
      cameraDistance + 3;

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

// BLOCK

function createBlock(
  x,y,z,color,
  w=1,h=1,d=1
) {

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

// CLEAR

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

// LOAD GAME

function loadGame(game) {

  clearWorld();

  if(game === "sandbox") {

    player.position.set(0,1,0);

  }

  if(game === "obby") {

    const startPlatform =
      createBlock(
        0,0,8,
        0x00ff00,
        6,1,6
      );

    collidableObjects.push(
      startPlatform
    );

    player.position.set(0,3,8);

    for(let i=0;i<15;i++) {

      const platform =
        createBlock(

          i*5,
          Math.random()*3,
          -i*4,

          0xff0000,

          3,1,3

        );

      collidableObjects.push(
        platform
      );

    }

  }

  if(game === "race") {

    player.position.set(0,2,5);

    for(let i=0;i<40;i++) {

      const road =
        createBlock(

          0,
          0,
          -i*5,

          0x333333,

          5,1,5

        );

      collidableObjects.push(
        road
      );

    }

  }

}

// MENU

const menu =
  document.createElement('div');

menu.style.position = 'absolute';

menu.style.top = '50%';

menu.style.left = '50%';

menu.style.transform =
  'translate(-50%, -50%)';

menu.style.padding = '30px';

menu.style.background =
  'rgba(0,0,0,0.8)';

menu.style.color = 'white';

menu.style.borderRadius = '20px';

menu.style.textAlign = 'center';

menu.innerHTML = `

<h1>My Platform</h1>

<button id="sandboxBtn">
Sandbox
</button>

<button id="obbyBtn">
Obby
</button>

<button id="raceBtn">
Race
</button>

<br><br>

<button id="playBtn">
PLAY
</button>

`;

document.body.appendChild(menu);

document.getElementById(
  'sandboxBtn'
).onclick = () => {

  currentGame = "sandbox";

};

document.getElementById(
  'obbyBtn'
).onclick = () => {

  currentGame = "obby";

};

document.getElementById(
  'raceBtn'
).onclick = () => {

  currentGame = "race";

};

document.getElementById(
  'playBtn'
).onclick = () => {

  menu.style.display = 'none';

  loadGame(currentGame);

};

// PUBLISH BUTTON

const publishButton =
  document.createElement('button');

publishButton.innerText =
  'PUBLISH';

publishButton.style.position =
  'absolute';

publishButton.style.top = '20px';

publishButton.style.right = '20px';

publishButton.style.width = '120px';

publishButton.style.height = '60px';

publishButton.style.borderRadius =
  '15px';

publishButton.style.border = 'none';

document.body.appendChild(
  publishButton
);

publishButton.onclick = () => {

  publishCurrentGame();

};

// PUBLISH

async function publishCurrentGame() {

  const gameName =
    prompt("Game name?");

  if(!gameName) return;

  const gameData = {

    name: gameName,

    blocks: []

  };

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

// LOAD SERVER GAMES

async function loadServerGames() {

  const response = await fetch(
    'https://game-euks.onrender.com/games'
  );

  const games =
    await response.json();

  const oldButtons =
    document.querySelectorAll(
      '.serverGame'
    );

  oldButtons.forEach(btn => {

    btn.remove();

  });

  const oldHideButtons =
    document.querySelectorAll(
      '.hideGame'
    );

  oldHideButtons.forEach(btn => {

    btn.remove();

  });

  let y = 170;

  for(const game of games) {

    // GAME BUTTON

    const button =
      document.createElement(
        'button'
      );

    button.className =
      'serverGame';

    button.innerText =
      game.name;

    button.style.position =
      'absolute';

    button.style.left = '20px';

    button.style.top =
      y + 'px';

    button.style.width =
      '180px';

    button.style.height =
      '50px';

    button.style.borderRadius =
      '15px';

    button.style.border =
      'none';

    document.body.appendChild(
      button
    );

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

        collidableObjects.push(
          obj
        );

      }

    };

    // HIDE BUTTON

    const hideButton =
      document.createElement(
        'button'
      );

    hideButton.className =
      'hideGame';

    hideButton.innerText =
      'HIDE';

    hideButton.style.position =
      'absolute';

    hideButton.style.left =
      '210px';

    hideButton.style.top =
      y + 'px';

    hideButton.style.width =
      '90px';

    hideButton.style.height =
      '50px';

    hideButton.style.borderRadius =
      '15px';

    hideButton.style.border =
      'none';

    document.body.appendChild(
      hideButton
    );

    hideButton.onclick =
      async () => {

      await fetch(

        'https://game-euks.onrender.com/hide-game',

        {

          method: 'POST',

          headers: {

            'Content-Type':
              'application/json'

          },

          body: JSON.stringify({

            name: game.name

          })

        }

      );

      loadServerGames();

    };

    y += 60;

  }

}

loadServerGames();

setInterval(() => {

  loadServerGames();

},3000);

// MULTIPLAYER

socket.on('players', (players) => {

  for(const id in players) {

    if(id === socket.id)
      continue;

    if(!otherPlayers[id]) {

      const mesh =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            1,2,1
          ),

          new THREE.MeshStandardMaterial({
            color: 0xff0000
          })

        );

      scene.add(mesh);

      otherPlayers[id] =
        mesh;

    }

    otherPlayers[id]
      .position.set(

      players[id].x,
      players[id].y,
      players[id].z

    );

  }

});

// ANIMATE

function animate() {

  requestAnimationFrame(
    animate
  );

  let moveX = 0;
  let moveZ = 0;

  const speed = 0.12;

  const forwardX =
    Math.sin(yaw);

  const forwardZ =
    Math.cos(yaw);

  const rightX =
    Math.cos(yaw);

  const rightZ =
    -Math.sin(yaw);

  if(keys['w']) {

    moveX -= forwardX*speed;

    moveZ -= forwardZ*speed;

  }

  if(keys['s']) {

    moveX += forwardX*speed;

    moveZ += forwardZ*speed;

  }

  if(keys['a']) {

    moveX -= rightX*speed;

    moveZ -= rightZ*speed;

  }

  if(keys['d']) {

    moveX += rightX*speed;

    moveZ += rightZ*speed;

  }

  const oldX =
    player.position.x;

  const oldZ =
    player.position.z;

  player.position.x += moveX;

  player.position.z += moveZ;

  velocityY -= gravity;

  player.position.y += velocityY;

  if(player.position.y <= 1) {

    player.position.y = 1;

    velocityY = 0;

    isGrounded = true;

  }

  for(const obj of collidableObjects) {

    const objBox =
      new THREE.Box3()
      .setFromObject(obj);

    const playerBox =
      new THREE.Box3(

      new THREE.Vector3(
        player.position.x-0.4,
        player.position.y-1,
        player.position.z-0.4
      ),

      new THREE.Vector3(
        player.position.x+0.4,
        player.position.y+1,
        player.position.z+0.4
      )

    );

    if(playerBox.intersectsBox(
      objBox
    )) {

      player.position.x =
        oldX;

      player.position.z =
        oldZ;

    }

  }

  updateCamera();

  socket.emit('move', {

    x: player.position.x,
    y: player.position.y,
    z: player.position.z

  });

  renderer.render(
    scene,
    camera
  );

}

animate();

// RESIZE

window.addEventListener(
  'resize',
  () => {

  camera.aspect =
    window.innerWidth /
    window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

});
