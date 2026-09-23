"use strict";
(() => {
  const config = window.GAME_CONFIG;
  const get = (id) => document.getElementById(id);
  const world = get("game-world"), gameScreen = get("game-screen");
  const playerElement = get("player");
  const image = get("player-image"), placeholder = get("player-placeholder");
  const keys = new Set();
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  // Always use the confirmed full-width platform; old editor saves are ignored.
  const platform = { ...config.platform, x: 0, width: config.world.width };
  const player = { x: 0, y: 0, vy: 0, grounded: true, facing: -1 };
  let running = false, previousTime;
  let animationSource = "";
  function updateAnimation(direction = 0) {
    if (direction !== 0) player.facing = direction;
    // The source artwork faces right. Mirror only the artwork when facing left.
    image.style.transform = player.facing === -1 ? "scaleX(-1)" : "scaleX(1)";
    const source = direction !== 0 ? (config.character.runSrc || config.character.src) : config.character.src;
    // Reassign only on state changes so GIF playback is not restarted each frame.
    if (source && source !== animationSource) {
      animationSource = source;
      image.src = source;
    }
  }
  function renderPlayer() {
    playerElement.style.left = player.x + "px";
    playerElement.style.top = player.y + "px";
  }
  function respawn() {
    player.x = platform.x + (platform.width - config.character.width) / 2;
    player.y = platform.y - config.character.height;
    player.vy = 0;
    player.grounded = true;
    renderPlayer();
  }
  function resize() {
    const scale = Math.min(window.innerWidth / config.world.width, window.innerHeight / config.world.height);
    world.style.width = config.world.width + "px";
    world.style.height = config.world.height + "px";
    world.style.transform = "scale(" + scale + ")";
    world.style.left = (window.innerWidth - config.world.width * scale) / 2 + "px";
    world.style.top = (window.innerHeight - config.world.height * scale) / 2 + "px";
  }
  image.addEventListener("load", () => { image.hidden = false; placeholder.hidden = true; });
  image.addEventListener("error", () => { image.hidden = true; placeholder.hidden = false; });
  updateAnimation();
  playerElement.style.width = config.character.width + "px";
  playerElement.style.height = config.character.height + "px";

  function update(dt) {
    const movingRight = keys.has("KeyD") || keys.has("ArrowRight");
    const movingLeft = keys.has("KeyA") || keys.has("ArrowLeft");
    const direction = Number(movingRight) - Number(movingLeft);
    updateAnimation(direction);
    player.x = clamp(player.x + direction * config.moveSpeed * dt, 0, config.world.width - config.character.width);
    const oldBottom = player.y + config.character.height;
    player.vy += config.gravity * dt;
    player.y += player.vy * dt;
    player.grounded = false;
    // One-way platform: land only when crossing its top while falling.
    const overlaps = player.x + config.character.width > platform.x && player.x < platform.x + platform.width;
    if (player.vy >= 0 && overlaps && oldBottom <= platform.y && player.y + config.character.height >= platform.y) {
      player.y = platform.y - config.character.height;
      player.vy = 0;
      player.grounded = true;
    }
    if (player.y > config.world.height) respawn();
    renderPlayer();
  }
  function frame(time) {
    if (previousTime !== undefined) update(Math.min((time - previousTime) / 1000, 1 / 30));
    previousTime = time;
    requestAnimationFrame(frame);
  }
  document.addEventListener("keydown", (event) => {
    if (!running || event.target.closest("input, button, summary, textarea, select")) return;
    if (!["KeyA", "KeyD", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) return;
    event.preventDefault();
    keys.add(event.code);
    if (event.code === "Space" && !event.repeat && player.grounded) {
      player.vy = -config.jumpSpeed;
      player.grounded = false;
    }
  });
  document.addEventListener("keyup", (event) => keys.delete(event.code));
  document.addEventListener("focusin", () => keys.clear());
  window.addEventListener("blur", () => keys.clear());
  document.addEventListener("visibilitychange", () => { keys.clear(); previousTime = undefined; });
  window.addEventListener("resize", resize);
  get("menu-button-image").addEventListener("click", () => {
    if (running) return;
    running = true;
    get("title-screen").hidden = true;
    gameScreen.hidden = false;
    resize();
    respawn();
    world.focus({ preventScroll: true });
    requestAnimationFrame(frame);
  });
  respawn();
})();
