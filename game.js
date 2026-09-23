"use strict";
(() => {
  const config = window.GAME_CONFIG;
  const get = (id) => document.getElementById(id);
  const world = get("game-world"), gameScreen = get("game-screen");
  const playerElement = get("player"), platformElement = get("platform");
  const image = get("player-image"), placeholder = get("player-placeholder");
  const storageKey = "hengee-platform-v1";
  const inputs = [...document.querySelectorAll("[data-platform]")];
  const keys = new Set();
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  function normalize(value) {
    const p = { ...config.platform };
    for (const key of ["x", "y", "width", "height"]) {
      if (Number.isFinite(value?.[key])) p[key] = value[key];
    }
    p.x = clamp(p.x, 0, config.world.width - 1);
    p.y = clamp(p.y, 0, config.world.height - 1);
    p.width = clamp(p.width, 1, config.world.width - p.x);
    p.height = clamp(p.height, 1, config.world.height - p.y);
    return p;
  }
  let platform = normalize(config.platform);
  try { platform = normalize(JSON.parse(localStorage.getItem(storageKey))); } catch {}
  const player = { x: 0, y: 0, vy: 0, grounded: true };
  let running = false, previousTime;
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
  function renderPlatform() {
    for (const [key, css] of [["x","left"],["y","top"],["width","width"],["height","height"]]) {
      platformElement.style[css] = platform[key] + "px";
    }
    for (const input of inputs) input.value = platform[input.dataset.platform];
    get("platform-values").textContent = "platform: " + JSON.stringify(platform);
    respawn();
  }
  function resize() {
    const scale = Math.min(window.innerWidth / config.world.width, window.innerHeight / config.world.height);
    world.style.width = config.world.width + "px";
    world.style.height = config.world.height + "px";
    world.style.transform = "scale(" + scale + ")";
    world.style.left = (window.innerWidth - config.world.width * scale) / 2 + "px";
    world.style.top = (window.innerHeight - config.world.height * scale) / 2 + "px";
  }
  for (const input of inputs) {
    input.addEventListener("change", () => {
      if (input.value.trim() === "" || !Number.isFinite(Number(input.value))) {
        renderPlatform();
        return;
      }
      platform = normalize({ ...platform, [input.dataset.platform]: Number(input.value) });
      try { localStorage.setItem(storageKey, JSON.stringify(platform)); } catch {}
      renderPlatform();
    });
  }
  get("reset-platform").addEventListener("click", () => {
    try { localStorage.removeItem(storageKey); } catch {}
    platform = normalize(config.platform);
    renderPlatform();
  });
  get("show-collision").addEventListener("change", (event) => {
    platformElement.style.visibility = event.target.checked ? "visible" : "hidden";
  });
  image.addEventListener("load", () => { image.hidden = false; placeholder.hidden = true; });
  image.addEventListener("error", () => { image.hidden = true; placeholder.hidden = false; });
  if (config.character.src) image.src = config.character.src;
  playerElement.style.width = config.character.width + "px";
  playerElement.style.height = config.character.height + "px";

  function update(dt) {
    const direction = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
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
    if (!["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) return;
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
  renderPlatform();
})();
