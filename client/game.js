// ========================================
// CONFIG
// ========================================

const API = "https://game-euks.onrender.com";

const socket = io(API);

// ========================================
// ACCOUNT
// ========================================

let username =
  localStorage.getItem("username") ||
  "";

let avatarColor =
  Number(
    localStorage.getItem(
      "avatarColor"
    )
  ) || 0x0066ff;

// ========================================
// SCENE
// ========================================

const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color(0x87ceeb);

const camera =
  new THREE.PerspectiveCamera(

    75,

    window.innerWidth /
    window.innerHeight,

    0.1,

    1000

  );

const renderer =
  new THREE.WebGLRenderer({

    antialias: true

  });

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

document.body.appendChild(
  renderer.domElement
);

// ========================================
// LIGHTS
// ========================================

scene.add(

  new THREE.AmbientLight(
    0xffffff,
    0.5
  )

);

const sun =
  new THREE.DirectionalLight(
    0xffffff,
    1
  );

sun.position.set(10,20,10);

scene.add(sun);

// ========================================
// GROUND
// ========================================

const ground =
  new THREE.Mesh(

    new THREE.PlaneGeometry(
      200,
      200
    ),

    new THREE.MeshStandardMaterial({

      color: 0x55aa55

    })

  );

ground.rotation.x =
  -Math.PI / 2;

scene.add(ground);

// ========================================
// PLAYER
// ========================================

const player =
  new THREE.Mesh(

    new THREE.BoxGeometry(
      1,
      2,
      1
    ),

    new THREE.MeshStandardMaterial({

      color: avatarColor

    })

  );

player.position.set(0,1,0);

scene.add(player);

// ========================================
// OTHER PLAYERS
// ========================================

const otherPlayers = {};

// ========================================
// VARIABLES
// ========================================

const collidableObjects = [];

let currentGame =
  "sandbox";

let firstPerson =
  false;

let yaw = 0;
let pitch = 0;

let velocityY = 0;

let isGrounded = true;

const gravity = 0.015;

const jumpPower = 0.28;

const cameraDistance = 8;

const keys = {};

// ========================================
// MOBILE
// ========================================

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// ========================================
// INPUT
// ========================================

document.addEventListener(
  "contextmenu",
  e => e.preventDefault()
);

document.addEventListener(
  "keydown",
  e => {

    keys[
      e.key.toLowerCase()
    ] = true;

    if(
      e.code === "Space"
    ) {

      e.preventDefault();

      jump();

    }

    if(
      e.key.toLowerCase() === "k"
    ) {

      firstPerson =
        !firstPerson;

    }

  }
);

document.addEventListener(
  "keyup",
  e => {

    keys[
      e.key.toLowerCase()
    ] = false;

  }
);

// ========================================
// JUMP
// ========================================

function jump() {

  if(isGrounded) {

    velocityY =
      jumpPower;

    isGrounded =
      false;

  }

}

// ========================================
// POINTER LOCK
// ========================================

renderer.domElement
.addEventListener(
  "click",
  () => {

    renderer.domElement
    .requestPointerLock();

  }
);

// ========================================
// CAMERA ROTATION
// ========================================

document.addEventListener(
  "mousemove",
  e => {

    if(
      document.pointerLockElement !==
      renderer.domElement
    ) return;

    yaw -=
      e.movementX * 0.003;

    pitch -=
      e.movementY * 0.003;

    pitch = Math.max(

      -1.4,

      Math.min(
        1.4,
        pitch
      )

    );

  }
);

// ========================================
// MOBILE LOOK
// ========================================

let lastTouchX = 0;
let lastTouchY = 0;

document.addEventListener(
  "touchstart",
  e => {

    lastTouchX =
      e.touches[0].clientX;

    lastTouchY =
      e.touches[0].clientY;

  }
);

document.addEventListener(
  "touchmove",
  e => {

    const touch =
      e.touches[0];

    const dx =
      touch.clientX -
      lastTouchX;

    const dy =
      touch.clientY -
      lastTouchY;

    if(
      touch.clientX >
      window.innerWidth / 2
    ) {

      yaw -= dx * 0.01;

      pitch -= dy * 0.01;

    }

    lastTouchX =
      touch.clientX;

    lastTouchY =
      touch.clientY;

  }
);

// ========================================
// MOBILE BUTTONS
// ========================================

function mobileButton(
  text,
  left,
  bottom
) {

  const btn =
    document.createElement(
      "button"
    );

  btn.innerText =
    text;

  btn.style.position =
    "absolute";

  btn.style.left =
    left + "px";

  btn.style.bottom =
    bottom + "px";

  btn.style.width =
    "85px";

  btn.style.height =
    "85px";

  btn.style.borderRadius =
    "20px";

  btn.style.border =
    "none";

  btn.style.fontSize =
    "30px";

  btn.style.opacity =
    "0.7";

  btn.style.zIndex =
    "100";

  document.body.appendChild(
    btn
  );

  return btn;

}

const upBtn =
  mobileButton(
    "▲",
    120,
    140
  );

upBtn.addEventListener(
  "touchstart",
  e => {

    e.preventDefault();

    moveForward = true;

  }
);

upBtn.addEventListener(
  "touchend",
  () => {

    moveForward = false;

  }
);

const downBtn =
  mobileButton(
    "▼",
    120,
    30
  );

downBtn.addEventListener(
  "touchstart",
  e => {

    e.preventDefault();

    moveBackward = true;

  }
);

downBtn.addEventListener(
  "touchend",
  () => {

    moveBackward = false;

  }
);

const leftBtn =
  mobileButton(
    "◀",
    20,
    85
  );

leftBtn.addEventListener(
  "touchstart",
  e => {

    e.preventDefault();

    moveLeft = true;

  }
);

leftBtn.addEventListener(
  "touchend",
  () => {

    moveLeft = false;

  }
);

const rightBtn =
  mobileButton(
    "▶",
    220,
    85
  );

rightBtn.addEventListener(
  "touchstart",
  e => {

    e.preventDefault();

    moveRight = true;

  }
);

rightBtn.addEventListener(
  "touchend",
  () => {

    moveRight = false;

  }
);

const jumpBtn =
  mobileButton(
    "⬆️",
    window.innerWidth - 120,
    60
  );

jumpBtn.style.borderRadius =
  "50%";

jumpBtn.addEventListener(
  "touchstart",
  e => {

    e.preventDefault();

    jump();

  }
);

// ========================================
// LOGIN
// ========================================

const login =
  document.createElement(
    "div"
  );

login.style.position =
  "absolute";

login.style.top =
  "50%";

login.style.left =
  "50%";

login.style.transform =
  "translate(-50%, -50%)";

login.style.background =
  "rgba(0,0,0,0.85)";

login.style.color =
  "white";

login.style.padding =
  "25px";

login.style.borderRadius =
  "20px";

login.style.textAlign =
  "center";

login.innerHTML = `

<h1>My Platform</h1>

<input
id="user"
placeholder="Username">

<br><br>

<input
id="pass"
type="password"
placeholder="Password">

<br><br>

<button id="loginBtn">
Login
</button>

<button id="registerBtn">
Register
</button>

<br><br>

<button id="guestBtn">
Guest
</button>

`;

document.body.appendChild(
  login
);

// ========================================
// LOGIN BUTTONS
// ========================================

document.getElementById(
  "guestBtn"
).onclick = () => {

  username =
    "Guest" +
    Math.floor(
      Math.random() * 9999
    );

  openMenu();

};

document.getElementById(
  "registerBtn"
).onclick = async () => {

  const user =
    document.getElementById(
      "user"
    ).value;

  const pass =
    document.getElementById(
      "pass"
    ).value;

  const res =
    await fetch(

      API + "/register",

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body: JSON.stringify({

          username: user,
          password: pass

        })

      }

    );

  alert(
    await res.text()
  );

};

document.getElementById(
  "loginBtn"
).onclick = async () => {

  const user =
    document.getElementById(
      "user"
    ).value;

  const pass =
    document.getElementById(
      "pass"
    ).value;

  const res =
    await fetch(

      API + "/login",

      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body: JSON.stringify({

          username: user,
          password: pass

        })

      }

    );

  if(res.ok) {

    username = user;

    localStorage.setItem(
      "username",
      username
    );

    openMenu();

  }

  else {

    alert(
      await res.text()
    );

  }

};

// ========================================
// MENU
// ========================================

function openMenu() {

  login.remove();

  const menu =
    document.createElement(
      "div"
    );

  menu.style.position =
    "absolute";

  menu.style.top =
    "50%";

  menu.style.left =
    "50%";

  menu.style.transform =
    "translate(-50%, -50%)";

  menu.style.background =
    "rgba(0,0,0,0.85)";

  menu.style.color =
    "white";

  menu.style.padding =
    "30px";

  menu.style.borderRadius =
    "20px";

  menu.style.textAlign =
    "center";

  menu.innerHTML = `

<h1>My Platform</h1>

<h2>Avatar</h2>

<button id="blue">
Blue
</button>

<button id="green">
Green
</button>

<button id="red">
Red
</button>

<br><br>

<h2>Games</h2>

<button id="sandbox">
Sandbox
</button>

<button id="obby">
Obby
</button>

<button id="race">
Race
</button>

<br><br>

<button id="play">
PLAY
</button>

`;

  document.body.appendChild(
    menu
  );

  document.getElementById(
    "blue"
  ).onclick = () => {

    setAvatar(
      0x0066ff
    );

  };

  document.getElementById(
    "green"
  ).onclick = () => {

    setAvatar(
      0x00ff00
    );

  };

  document.getElementById(
    "red"
  ).onclick = () => {

    setAvatar(
      0xff0000
    );

  };

  document.getElementById(
    "sandbox"
  ).onclick = () => {

    currentGame =
      "sandbox";

  };

  document.getElementById(
    "obby"
  ).onclick = () => {

    currentGame =
      "obby";

  };

  document.getElementById(
    "race"
  ).onclick = () => {

    currentGame =
      "race";

  };

  document.getElementById(
    "play"
  ).onclick = () => {

    menu.remove();

    loadGame(
      currentGame
    );

  };

}

// ========================================
// AVATAR
// ========================================

function setAvatar(
  color
) {

  avatarColor =
    color;

  player.material.color
  .set(color);

  localStorage.setItem(

    "avatarColor",

    String(color)

  );

}

// ========================================
// CREATE BLOCK
// ========================================

function createBlock(
  x,
  y,
  z,
  color,
  w = 1,
  h = 1,
  d = 1
) {

  const block =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        w,h,d
      ),

      new THREE.MeshStandardMaterial({

        color

      })

    );

  block.position.set(
    x,y,z
  );

  scene.add(block);

  return block;

}

// ========================================
// LOAD GAME
// ========================================

function loadGame(
  game
) {

  collidableObjects
  .length = 0;

  if(
    game === "sandbox"
  ) {

    player.position.set(
      0,1,0
    );

  }

}

// ========================================
// CAMERA
// ========================================

function updateCamera() {

  if(firstPerson) {

    player.visible =
      false;

    camera.position.set(

      player.position.x,

      player.position.y + 0.9,

      player.position.z

    );

    camera.rotation.order =
      "YXZ";

    camera.rotation.y =
      yaw;

    camera.rotation.x =
      pitch;

  }

  else {

    player.visible =
      true;

    camera.position.set(

      player.position.x +
      Math.sin(yaw) *
      cameraDistance,

      player.position.y + 4,

      player.position.z +
      Math.cos(yaw) *
      cameraDistance

    );

    camera.lookAt(
      player.position
    );

  }

}

// ========================================
// MULTIPLAYER
// ========================================

socket.on(
  "players",
  players => {

    for(
      const id in players
    ) {

      if(
        id === socket.id
      ) continue;

      if(
        !otherPlayers[id]
      ) {

        const mesh =
          new THREE.Mesh(

            new THREE.BoxGeometry(
              1,2,1
            ),

            new THREE.MeshStandardMaterial({

              color:
                players[id].color

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

      otherPlayers[id]
      .material.color
      .set(

        players[id].color

      );

    }

  }
);

// ========================================
// ANIMATE
// ========================================

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

  if(
    keys.w ||
    moveForward
  ) {

    moveX -=
      forwardX * speed;

    moveZ -=
      forwardZ * speed;

  }

  if(
    keys.s ||
    moveBackward
  ) {

    moveX +=
      forwardX * speed;

    moveZ +=
      forwardZ * speed;

  }

  if(
    keys.a ||
    moveLeft
  ) {

    moveX -=
      rightX * speed;

    moveZ -=
      rightZ * speed;

  }

  if(
    keys.d ||
    moveRight
  ) {

    moveX +=
      rightX * speed;

    moveZ +=
      rightZ * speed;

  }

  player.position.x +=
    moveX;

  player.position.z +=
    moveZ;

  velocityY -= gravity;

  player.position.y +=
    velocityY;

  if(
    player.position.y <= 1
  ) {

    player.position.y =
      1;

    velocityY = 0;

    isGrounded = true;

  }

  updateCamera();

  socket.emit(
    "move",
    {

      x:
        player.position.x,

      y:
        player.position.y,

      z:
        player.position.z,

      color:
        avatarColor,

      username

    }
  );

  renderer.render(
    scene,
    camera
  );

}

animate();
