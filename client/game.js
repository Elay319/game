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

    // Keep actions panel open if interacting with it
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
      }, 600); // 600ms hold time
    };

    const endHold = (e) => {
      clearTimeout(holdTimer);
      if (!didHold) {
        // If they didn't hold, it counts as a standard press/click
        joinGame();
      }
    };

    const cancelHold = () => {
      clearTimeout(holdTimer);
    };

    // Mouse Listeners
    btn.addEventListener("mousedown", (e) => {
      if (e.button === 0) startHold(); // Left click only
    });
    btn.addEventListener("mouseup", (e) => {
      if (e.button === 0) endHold(e);
    });
    btn.addEventListener("mouseleave", cancelHold);

    // Touch Listeners
    btn.addEventListener("touchstart", (e) => {
      startHold();
    });
    btn.addEventListener("touchend", (e) => {
      e.preventDefault(); // Prevents simulated mouse clicks on mobile
      endHold(e);
    });
    btn.addEventListener("touchcancel", cancelHold);

    y += 60;
  }
}
