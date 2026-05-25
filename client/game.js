const API = "https://game-euks.onrender.com";

const socket = io(API);

let username = localStorage.getItem("username") || "";
let avatarColor = Number(localStorage.getItem("avatarColor")) || 0x0066ff;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x55aa55 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const player = new THREE.Mesh(
  new THREE.BoxGeometry(1, 2, 1),
  new THREE.MeshStandardMaterial({ color: avatarColor })
);
player.position.set(0, 1, 0);
scene.add(player);

const collidableObjects = [];
const otherPlayers = {};

let currentGame = "sandbox";
let firstPerson = false;
let yaw = 0;
let pitch = 0;
let velocityY = 0;
let isGrounded = true;

const keys = {};
const gravity = 0.015;
const jumpPower = 0.28;
const cameraDistance = 8;

document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
  if (e.key.toLowerCase() === "k") firstPerson = !firstPerson;
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function jump() {
  if (isGrounded) {
    velocityY = jumpPower;
    isGrounded = false;
  }
}

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * 0.003;
  pitch -= e.movementY * 0.003;
  pitch = Math.max(-1.4, Math.min(1.4, pitch));
});

function createBlock(x, y, z, color, w = 1, h = 1, d = 1) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  );

  block.position.set(x, y, z);
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

  if (game === "sandbox") {
    player.position.set(0, 1, 0);
  }

  if (game === "obby") {
    const start = createBlock(0, 0, 8, 0x00ff00, 6, 1, 6);
    collidableObjects.push(start);
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

function makeButton(text, x, y, w, h) {
  const btn = document.createElement("button");
  btn.innerText = text;
  btn.style.position = "absolute";
  btn.style.left = x + "px";
  btn.style.top = y + "px";
  btn.style.width = w + "px";
  btn.style.height = h + "px";
  btn.style.borderRadius = "14px";
  btn.style.border = "none";
  btn.style.fontSize = "18px";
  btn.style.zIndex = 50;
  document.body.appendChild(btn);
  return btn;
}

const loginBox = document.createElement("div");
loginBox.style.position = "absolute";
loginBox.style.top = "50%";
loginBox.style.left = "50%";
loginBox.style.transform = "translate(-50%, -50%)";
loginBox.style.background = "rgba(0,0,0,0.85)";
loginBox.style.color = "white";
loginBox.style.padding = "25px";
loginBox.style.borderRadius = "20px";
loginBox.style.fontFamily = "Arial";
loginBox.style.textAlign = "center";
loginBox.style.zIndex = 100;

loginBox.innerHTML = `
<h1>My Platform</h1>
<input id="userInput" placeholder="username"><br><br>
<input id="passInput" placeholder="password" type="password"><br><br>
<button id="loginBtn">Login</button>
<button id="registerBtn">Register</button>
<br><br>
<button id="skipBtn">Play Guest</button>
`;

document.body.appendChild(loginBox);

function closeLogin() {
  loginBox.style.display = "none";
  showMainMenu();
}

document.getElementById("skipBtn").onclick = () => {
  username = "Guest" + Math.floor(Math.random() * 9999);
  closeLogin();
};

document.getElementById("registerBtn").onclick = async () => {
  const user = document.getElementById("userInput").value;
  const pass = document.getElementById("passInput").value;

  const res = await fetch(API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });

  alert(await res.text());
};

document.getElementById("loginBtn").onclick = async () => {
  const user = document.getElementById("userInput").value;
  const pass = document.getElementById("passInput").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass })
  });

  if (res.ok) {
    username = user;
    localStorage.setItem("username", username);
    closeLogin();
  } else {
    alert(await res.text());
  }
};

function showMainMenu() {
  const menu = document.createElement("div");
  menu.style.position = "absolute";
  menu.style.top = "50%";
  menu.style.left = "50%";
  menu.style.transform = "translate(-50%, -50%)";
  menu.style.background = "rgba(0,0,0,0.85)";
  menu.style.color = "white";
  menu.style.padding = "30px";
  menu.style.borderRadius = "20px";
  menu.style.fontFamily = "Arial";
  menu.style.textAlign = "center";
  menu.style.zIndex = 70;

  menu.innerHTML = `
  <h1>Games</h1>
  <button id="blueAvatar">Blue</button>
  <button id="greenAvatar">Green</button>
  <button id="redAvatar">Red</button>
  <br><br>
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

function setAvatar(color) {
  avatarColor = color;
  player.material.color.set(color);
  localStorage.setItem("avatarColor", String(color));
  socket.emit("avatar", { color, username });
}

if (username) {
  loginBox.style.display = "none";
  showMainMenu();
}

makeButton("PUBLISH", innerWidth - 140, 20, 120, 55).onclick = publishCurrentGame;
makeButton("VIEW", innerWidth - 140, 85, 120, 55).onclick = () => firstPerson = !firstPerson;

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

  alert("Published!");
  loadServerGames();
}

async function loadServerGames() {
  const res = await fetch(API + "/games");
  const games = await res.json();

  document.querySelectorAll(".serverGame,.gameActions").forEach(e => e.remove());

  let y = 170;

  for (const game of games) {
    const btn = makeButton(game.name, 20, y, 180, 50);
    btn.className = "serverGame";

    btn.onclick = () => {
      clearWorld();
      player.position.set(0, 3, 0);

      for (const b of game.blocks) {
        collidableObjects.push(
          createBlock(b.x, b.y, b.z, b.color, b.width, b.height, b.depth)
        );
      }
    };

    const actions = document.createElement("div");
    actions.className = "gameActions";
    actions.style.position = "absolute";
    actions.style.left = "210px";
    actions.style.top = y + "px";
    actions.style.display = "none";
    actions.style.zIndex = 80;

    const hide = document.createElement("button");
    hide.innerText = "🙈";
    hide.title = "Hide";
    actions.appendChild(hide);

    hide.onclick = async () => {
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
      actions.appendChild(remove);

      remove.onclick = async () => {
        await fetch(API + "/remove-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: game.name, owner: username })
        });
        loadServerGames();
      };
    }

    document.body.appendChild(actions);

    btn.onmouseenter = () => actions.style.display = "block";
    actions.onmouseenter = () => actions.style.display = "block";
    btn.onmouseleave = () => setTimeout(() => {
      if (!actions.matches(":hover")) actions.style.display = "none";
    }, 200);
    actions.onmouseleave = () => actions.style.display = "none";

    btn.addEventListener("touchstart", () => {
      actions.style.display = actions.style.display === "none" ? "block" : "none";
    });

    y += 60;
  }
}

loadServerGames();
setInterval(loadServerGames, 5000);

socket.on("players", players => {
  for (const id in players) {
    if (id === socket.id) continue;

    if (!otherPlayers[id]) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
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
});

function updateCamera() {
  if (firstPerson) {
    player.visible = false;
    camera.position.set(player.position.x, player.position.y + 0.9, player.position.z);
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

function animate() {
  requestAnimationFrame(animate);

  let moveX = 0;
  let moveZ = 0;
  const speed = 0.12;

  const forwardX = Math.sin(yaw);
  const forwardZ = Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  if (keys.w) {
    moveX -= forwardX * speed;
    moveZ -= forwardZ * speed;
  }

  if (keys.s) {
    moveX += forwardX * speed;
    moveZ += forwardZ * speed;
  }

  if (keys.a) {
    moveX -= rightX * speed;
    moveZ -= rightZ * speed;
  }

  if (keys.d) {
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

  for (const obj of collidableObjects) {
    const objBox = new THREE.Box3().setFromObject(obj);

    const playerBox = new THREE.Box3(
      new THREE.Vector3(player.position.x - 0.4, player.position.y - 1, player.position.z - 0.4),
      new THREE.Vector3(player.position.x + 0.4, player.position.y + 1, player.position.z + 0.4)
    );

    if (playerBox.intersectsBox(objBox)) {
      player.position.x = oldX;
      player.position.z = oldZ;
    }
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

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
