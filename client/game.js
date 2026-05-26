// ========================================
// CONFIG
// ========================================
const API = "https://game-euks.onrender.com";
const socket = io(API);

// ========================================
// ACCOUNT / AVATAR
// ========================================
let username = localStorage.getItem("username") || "";
let avatarColor = Number(localStorage.getItem("avatarColor")) || 0x0066ff;

// ========================================
// PAGE SAFETY
// ========================================
document.addEventListener("contextmenu", e => e.preventDefault());
window.addEventListener("keydown", e => {
  if (e.code === "Space") e.preventDefault();
});

// ========================================
// THREE.JS SETUP
// ========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ========================================
// LIGHTS
// ========================================
scene.add(new THREE.AmbientLight(0xffffff, 0.45));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
sun.castShadow = true;
scene.add(sun);

// ========================================
// GROUND
// ========================================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ========================================
// PLAYER
// ========================================
const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: avatarColor })
);
player.position.set(0, 1, 0);
player.castShadow = true;
scene.add(player);

// ========================================
// STATE
// ========================================
const collidableObjects = [];
const otherPlayers = {};
const keys = {};
const raycaster = new THREE.Raycaster();

let currentGame = "sandbox";
let firstPerson = false;
let yaw = 0;
let pitch = 0;
let velocityY = 0;
let isGrounded = true;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const gravity = 0.015;
const jumpPower = 0.28;
const cameraDistance = 8;

// ========================================
// UI HELPERS
// ========================================
function stylePanel(panel) {
  panel.style.position = "absolute";
  panel.style.top = "50%";
  panel.style.left = "50%";
  panel.style.transform = "translate(-50%, -50%)";
  panel.style.background = "rgba(0,0,0,0.85)";
  panel.style.color = "white";
  panel.style.padding = "30px";
  panel.style.borderRadius = "20px";
  panel.style.fontFamily = "Arial";
  panel.style.textAlign = "center";
  panel.style.zIndex = "100";
}

function makeButton(text, left, top, width, height) {
  const btn = document.createElement("button");
  btn.innerText = text;
  btn.style.position = "absolute";
  btn.style.left = left + "px";
  btn.style.top = top + "px";
  btn.style.width = width + "px";
  btn.style.height = height + "px";
  btn.style.borderRadius = "15px";
  btn.style.border = "none";
  btn.style.fontSize = "18px";
  btn.style.zIndex = "60";
  btn.style.cursor = "pointer";
  document.body.appendChild(btn);
  return btn;
}

function mobileButton(text, left, bottom) {
  const btn = document.createElement("button");
  btn.innerText = text;
  btn.style.position = "absolute";
  btn.style.left = left + "px";
  btn.style.bottom = bottom + "px";
  btn.style.width = "85px";
  btn.style.height = "85px";
  btn.style.borderRadius = "20px";
  btn.style.border = "none";
  btn.style.fontSize = "30px";
  btn.style.opacity = "0.75";
  btn.style.zIndex = "80";
  document.body.appendChild(btn);
  return btn;
}

// ========================================
// MOBILE CONTROLS
// ========================================
const upBtn = mobileButton("▲", 120, 140);
upBtn.ontouchstart = e => { e.preventDefault(); moveForward = true; };
upBtn.ontouchend = () => moveForward = false;
upBtn.onmousedown = () => moveForward = true;
upBtn.onmouseup = () => moveForward = false;

const downBtn = mobileButton("▼", 120, 30);
downBtn.ontouchstart = e => { e.preventDefault(); moveBackward = true; };
downBtn.ontouchend = () => moveBackward = false;
downBtn.onmousedown = () => moveBackward = true;
downBtn.onmouseup = () => moveBackward = false;

const leftBtn = mobileButton("◀", 20, 85);
leftBtn.ontouchstart = e => { e.preventDefault(); moveLeft = true; };
leftBtn.ontouchend = () => moveLeft = false;
leftBtn.onmousedown = () => moveLeft = true;
leftBtn.onmouseup = () => moveLeft = false;

const rightBtn = mobileButton("▶", 220, 85);
rightBtn.ontouchstart = e => { e.preventDefault(); moveRight = true; };
rightBtn.ontouchend = () => moveRight = false;
rightBtn.onmousedown = () => moveRight = true;
rightBtn.onmouseup = () => moveRight = false;

const jumpBtn = mobileButton("⬆️", window.innerWidth - 120, 60);
jumpBtn.style.borderRadius = "50%";
jumpBtn.ontouchstart = e => { e.preventDefault(); jump(); };
jumpBtn.onclick = () => jump();

// ========================================
// WORLD FUNCTIONS
// ========================================
function createBlock(x, y, z, color, w = 1, h = 1, d = 1) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  );

  block.position.set(x, y, z);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
  return block;
}

function clearWorld() {
  const remove = [];

  scene.traverse(obj => {
    if (
      obj !== player &&
      obj !== ground &&
      !(obj instanceof THREE.Camera) &&
      !(obj instanceof THREE.Light)
    ) {
      remove.push(obj);
    }
  });

  remove.forEach(obj => scene.remove(obj));
  collidableObjects.length = 0;
}

function loadGame(game) {
  clearWorld();
  currentGame = game;

  if (game === "sandbox") {
    player.position.set(0, 1, 0);
  }

  if (game === "obby") {
    collidableObjects.push(createBlock(0, 0, 8, 0x00ff00, 6, 1, 6));
    player.position.set(0, 3, 8);

    for (let i = 0; i < 15; i++) {
      collidableObjects.push(
        createBlock(i * 5, Math.random() * 3, -i * 4, 0xff0000, 3, 1, 3)
      );
    }
  }

  if (game === "race") {
    player.position.set(0, 2, 5);

    for (let i = 0; i < 40; i++) {
      collidableObjects.push(createBlock(0, 0, -i * 5, 0x333333, 5, 1, 5));
    }
  }
}

function jump() {
  if (isGrounded) {
    velocityY = jumpPower;
    isGrounded = false;
  }
}

// ========================================
// KEYBOARD + CAMERA LOOK
// ========================================
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }

  if (e.key.toLowerCase() === "k") {
    firstPerson = !firstPerson;
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== renderer.domElement) return;

  yaw -= e.movementX * 0.003;
  pitch -= e.movementY * 0.003;
  pitch = Math.max(-1.4, Math.min(1.4, pitch));
});

let lastTouchX = 0;
let lastTouchY = 0;

document.addEventListener("touchstart", e => {
  if (!e.touches[0]) return;
  lastTouchX = e.touches[0].clientX;
  lastTouchY = e.touches[0].clientY;
});

document.addEventListener("touchmove", e => {
  if (!e.touches[0]) return;

  const touch = e.touches[0];
  const dx = touch.clientX - lastTouchX;
  const dy = touch.clientY - lastTouchY;

  if (touch.clientX > window.innerWidth / 2) {
    yaw -= dx * 0.01;
    pitch -= dy * 0.01;
    pitch = Math.max(-1.4, Math.min(1.4, pitch));
  }

  lastTouchX = touch.clientX;
  lastTouchY = touch.clientY;
});

// ========================================
// LOGIN / REGISTER
// ========================================
const loginBox = document.createElement("div");
stylePanel(loginBox);
loginBox.innerHTML = `
  <h1>My Platform</h1>
  <input id="userInput" placeholder="Username" style="font-size:18px"><br><br>
  <input id="passInput" placeholder="Password" type="password" style="font-size:18px"><br><br>
  <button id="loginBtn">Login</button>
  <button id="registerBtn">Register</button>
  <br><br>
  <button id="guestBtn">Play Guest</button>
`;
document.body.appendChild(loginBox);

function closeLoginAndOpenMenu() {
  loginBox.style.display = "none";
  openMenu();
}

document.getElementById("guestBtn").onclick = () => {
  username = "Guest" + Math.floor(Math.random() * 9999);
  closeLoginAndOpenMenu();
};

document.getElementById("registerBtn").onclick = async () => {
  const user = document.getElementById("userInput").value.trim();
  const pass = document.getElementById("passInput").value;

  if (!user || !pass) {
    alert("Type username and password");
    return;
  }

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });

  alert(await res.text());
};

document.getElementById("loginBtn").onclick = async () => {
  const user = document.getElementById("userInput").value.trim();
  const pass = document.getElementById("passInput").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });

  if (res.ok) {
    username = user;
    localStorage.setItem("username", username);
    closeLoginAndOpenMenu();
  } else {
    alert(await res.text());
  }
};

// ========================================
// MAIN MENU
// ========================================
function setAvatar(color) {
  avatarColor = color;
  player.material.color.set(color);
  localStorage.setItem("avatarColor", String(color));
  socket.emit("avatar", { username, color });
}

function openMenu() {
  const menu = document.createElement("div");
  stylePanel(menu);
  menu.style.zIndex = "90";

  menu.innerHTML = `
    <h1>My Platform</h1>

    <h2>Avatar</h2>
    <button id="blueAvatar">Blue</button>
    <button id="greenAvatar">Green</button>
    <button id="redAvatar">Red</button>

    <br><br>

    <h2>Games</h2>
    <button id="sandboxBtn">Sandbox</button>
    <button id="obbyBtn">Obby</button>
    <button id="raceBtn">Race</button>

    <br><br>

    <button id="playBtn">PLAY</button>
  `;

  document.body.appendChild(menu);

  document.getElementById("blueAvatar").onclick = () => setAvatar(0x0066ff);
  document.getElementById("greenAvatar").onclick = () => setAvatar(0x00ff00);
  document.getElementById("redAvatar").onclick = () => setAvatar(0xff0000);

  document.getElementById("sandboxBtn").onclick = () => currentGame = "sandbox";
  document.getElementById("obbyBtn").onclick = () => currentGame = "obby";
  document.getElementById("raceBtn").onclick = () => currentGame = "race";

  document.getElementById("playBtn").onclick = () => {
    menu.remove();
    loadGame(currentGame);
  };
}

if (username) {
  loginBox.style.display = "none";
  openMenu();
}

// ========================================
// TOP BUTTONS
// ========================================
makeButton("PUBLISH", window.innerWidth - 140, 20, 120, 55).onclick = publishCurrentGame;
makeButton("VIEW", window.innerWidth - 140, 85, 120, 55).onclick = () => {
  firstPerson = !firstPerson;
};

// ========================================
// PUBLISH
// ========================================
async function publishCurrentGame() {
  const name = prompt("Game name?");
  if (!name) return;

  const blocks = collidableObjects.map(obj => ({
    x: obj.position.x,
    y: obj.position.y,
    z: obj.position.z,
    width: obj.geometry.parameters.width,
    height: obj.geometry.parameters.height,
    depth: obj.geometry.parameters.depth,
    color: obj.material.color.getHex()
  }));

  await fetch(API + "/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      owner: username,
      hidden: false,
      blocks
    })
  });

  alert("Game published!");
  loadServerGames();
}

// ========================================
// SERVER GAME LIST WITH HOLD ACTIONS
// ========================================
async function loadServerGames() {
  const res = await fetch(API + "/games");
  const games = await res.json();

  document.querySelectorAll(".serverGame,.gameActions").forEach(e => e.remove());

  let y = 170;

  for (const game of games) {
    const btn = makeButton(game.name, 20, y, 180, 50);
    btn.className = "serverGame";

    const joinGame = () => {
      clearWorld();
      currentGame = "published";
      player.position.set(0, 3, 0);

      for (const block of game.blocks) {
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

    const actions = document.createElement("div");
    actions.className = "gameActions";
    actions.style.position = "absolute";
    actions.style.left = "210px";
    actions.style.top = y + "px";
    actions.style.display = "none";
    actions.style.zIndex = "120";
    actions.style.gap = "5px";

    const hide = document.createElement("button");
    hide.innerText = "🙈";
    hide.title = "Hide";
    hide.style.width = "45px";
    hide.style.height = "50px";
    actions.appendChild(hide);

    hide.onclick = async e => {
      e.stopPropagation();

      await fetch(API + "/hide-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: game.name })
      });

      loadServerGames();
    };

    if (game.owner === username) {
      const remove = document.createElement("button");
      remove.innerText = "🗑️";
      remove.title = "Remove";
      remove.style.width = "45px";
      remove.style.height = "50px";
      actions.appendChild(remove);

      remove.onclick = async e => {
        e.stopPropagation();

        await fetch(API + "/remove-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: game.name,
            owner: username
          })
        });

        loadServerGames();
      };
    }

    document.body.appendChild(actions);

    // Keep panel open while clicking action buttons
    actions.onmouseenter = () => actions.style.display = "block";
    actions.onmouseleave = () => actions.style.display = "none";

    // HOLD TO EDIT / CLICK TO JOIN SYSTEM (PC & Mobile unified)
    let holdTimer = null;
    let didHold = false;

    const startHold = () => {
      didHold = false;
      holdTimer = setTimeout(() => {
        didHold = true;
        actions.style.display = "block";
      }, 600); // 600 milliseconds hold threshold
    };

    const endHold = (e) => {
      clearTimeout(holdTimer);
      if (!didHold) {
        joinGame();
      }
    };

    const cancelHold = () => {
      clearTimeout(holdTimer);
    };

    // Mouse Controls
    btn.addEventListener("mousedown", (e) => {
      if (e.button === 0) startHold();
    });
    btn.addEventListener("mouseup", (e) => {
      if (e.button === 0) endHold(e);
    });
    btn.addEventListener("mouseleave", cancelHold);

    // Touch Controls
    btn.addEventListener("touchstart", (e) => {
      startHold();
    });
    btn.addEventListener("touchend", (e) => {
      e.preventDefault(); // Prevents ghost click bubbles on mobile
      endHold(e);
    });
    btn.addEventListener("touchcancel", cancelHold);

    y += 60;
  }
}

loadServerGames();
setInterval(loadServerGames, 5000);

// ========================================
// BUILDING
// ========================================
window.addEventListener("mousedown", event => {
  if (currentGame !== "sandbox") return;
  if (document.pointerLockElement !== renderer.domElement) return;

  if (event.button === 0) {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    const block = createBlock(
      Math.round(player.position.x + dir.x * 3),
      Math.round(player.position.y),
      Math.round(player.position.z + dir.z * 3),
      Math.random() * 0xffffff
    );

    collidableObjects.push(block);
  }

  if (event.button === 2) {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = raycaster.intersectObjects(collidableObjects);

    if (hits.length > 0) {
      const hit = hits[0].object;
      scene.remove(hit);

      const index = collidableObjects.indexOf(hit);
      if (index !== -1) collidableObjects.splice(index, 1);
    }
  }
});

// ========================================
// MULTIPLAYER
// ========================================
socket.on("players", players => {
  for (const id in players) {
    if (id === socket.id) continue;

    if (!otherPlayers[id]) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshStandardMaterial({ color: players[id].color || 0xff0000 })
      );

      scene.add(mesh);
      otherPlayers[id] = mesh;
    }

    otherPlayers[id].position.set(players[id].x, players[id].y, players[id].z);

    if (players[id].color !== undefined) {
      otherPlayers[id].material.color.set(players[id].color);
    }
  }

  for (const id in otherPlayers) {
    if (!players[id]) {
      scene.remove(otherPlayers[id]);
      delete otherPlayers[id];
    }
  }
});

// ========================================
// CAMERA
// ========================================
function updateCamera() {
  if (firstPerson) {
    player.visible = false;

    camera.position.set(
      player.position.x,
      player.position.y + 0.9,
      player.position.z
    );

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  } else {
    player.visible = true;

    camera.position.set(
      player.position.x + Math.sin(yaw) * Math.cos(pitch) * cameraDistance,
      player.position.y + Math.sin(pitch) * cameraDistance + 3,
      player.position.z + Math.cos(yaw) * Math.cos(pitch) * cameraDistance
    );

    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
  }
}

// ========================================
// GAME LOOP
// ========================================
function animate() {
  requestAnimationFrame(animate);

  let moveX = 0;
  let moveZ = 0;
  const speed = 0.12;

  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  if (keys.w || moveForward) {
    moveX -= forwardX * speed;
    moveZ -= forwardZ * speed;
  }

  if (keys.s || moveBackward) {
    moveX += forwardX * speed;
    moveZ += forwardZ * speed;
  }

  if (keys.a || moveLeft) {
    moveX -= rightX * speed;
    moveZ -= rightZ * speed;
  }

  if (keys.d || moveRight) {
    moveX += rightX * speed;
    moveZ += rightZ * speed;
  }

  const oldX = player.position.x;
  const oldZ = player.position.z;

  player.position.x += moveX;
  player.position.z += moveZ;

  velocityY -= gravity;
  player.position.y += velocityY;

  if (player.position.y <= 1) {
    player.position.y = 1;
    velocityY = 0;
    isGrounded = true;
  }

  let groundedThisFrame = false;

  for (const obj of collidableObjects) {
    const objBox = new THREE.Box3().setFromObject(obj);

    const playerBox = new THREE.Box3(
      new THREE.Vector3(player.position.x - 0.4, player.position.y - 1, player.position.z - 0.4),
      new THREE.Vector3(player.position.x + 0.4, player.position.y + 1, player.position.z + 0.4)
    );

    if (playerBox.intersectsBox(objBox)) {
      const h = obj.geometry.parameters.height || 1;
      const top = obj.position.y + h / 2;
      const bottom = player.position.y - 1;

      if (velocityY <= 0 && bottom >= top - 1) {
        player.position.y = top + 1;
        velocityY = 0;
        groundedThisFrame = true;
      } else {
        player.position.x = oldX;
        player.position.z = oldZ;
      }
    }
  }

  if (groundedThisFrame) {
    isGrounded = true;
  } else if (player.position.y > 1.01) {
    isGrounded = false;
  }

  updateCamera();

  socket.emit("move", {
    x: player.position.x,
    y: player.position.y,
    z: player.position.z,
    color: avatarColor,
    username
  });

  renderer.render(scene, camera);
}

animate();

// ========================================
// RESIZE
// ========================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
