"use strict";
// 位置・サイズはここを編集。画面左上が原点、単位は基準画面のpx。
window.GAME_CONFIG = {
  world: { width: 1280, height: 720 },
  platform: { x: 0, y: 445, width: 1280, height: 32 },
  character: { src: "assets/character/idle.gif", runSrc: "assets/character/run.gif", width: 80, height: 100 },
  gravity: 1800,
  moveSpeed: 300,
  jumpSpeed: 680,
};
