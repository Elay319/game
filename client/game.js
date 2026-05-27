// ========================================
// SERVER GAME LIST WITH HOLD ACTIONS (FIXED & UNIFIED)
// ========================================
async function loadServerGames() {
  const res = await fetch(API + "/games");
  const games = await res.json();

  // Clean up all components of the old menu rows
  document.querySelectorAll(".serverGameRow, .serverGame, .gameActions").forEach(e => e.remove());

  let y = 170;

  for (const game of games) {
    // 1. Create a unified container for this menu row item
    const rowWrapper = document.createElement("div");
    rowWrapper.className = "serverGameRow";
    rowWrapper.style.position = "absolute";
    rowWrapper.style.left = "20px";
    rowWrapper.style.top = y + "px";
    rowWrapper.style.height = "50px";
    rowWrapper.style.display = "flex";
    rowWrapper.style.alignItems = "center";
    rowWrapper.style.gap = "5px"; // Glues the buttons and actions into one giant menu feel
    rowWrapper.style.zIndex = "100";
    document.body.appendChild(rowWrapper);

    // 2. Use your custom engine button function, but append it into our menu wrapper
    const btn = makeButton(game.name, 0, 0, 180, 50); 
    btn.className = "serverGame";
    btn.style.position = "relative"; // Break out of absolute drift inside the row wrapper
    btn.style.left = "0px";
    btn.style.top = "0px";
    rowWrapper.appendChild(btn);

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

    // 3. Setup actions controls inside the same row menu layout
    const actions = document.createElement("div");
    actions.className = "gameActions";
    actions.style.display = "none"; // Kept hidden until summoned by hold or hover
    actions.style.alignItems = "center";
    actions.style.gap = "5px";

    const hide = document.createElement("button");
    hide.innerText = "🙈";
    hide.title = "Hide";
    hide.style.width = "45px";
    hide.style.height = "50px";
    hide.style.cursor = "pointer";
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
      remove.style.cursor = "pointer";
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

    rowWrapper.appendChild(actions);

    // Keep actions panel open if interacting with it
    actions.onmouseenter = () => actions.style.display = "flex";
    actions.onmouseleave = () => actions.style.display = "none";

    // HOLD TO EDIT / CLICK TO JOIN SYSTEM (PC & Mobile unified)
    let holdTimer = null;
    let didHold = false;

    const startHold = () => {
      didHold = false;
      holdTimer = setTimeout(() => {
        didHold = true;
        actions.style.display = "flex"; // Changed from 'block' to matches flex alignment
      }, 600); // 600ms hold time
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

    // Mouse Listeners
    btn.addEventListener("mousedown", (e) => {
      if (e.button === 0) startHold(); 
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
      e.preventDefault(); 
      endHold(e);
    });
    btn.addEventListener("touchcancel", cancelHold);

    // Increments the giant vertical list layout
    y += 60;
  }
}
