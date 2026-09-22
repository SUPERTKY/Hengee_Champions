"use strict";

const TIMING = Object.freeze({
  iconFadeIn: 1000,
  iconHold: 2000,
  iconFadeOut: 1500,
  blackPause: 500,
  screenFadeIn: 1500,
});

const icon = document.getElementById("intro-icon");
const intro = document.getElementById("intro");
const screen = document.getElementById("title-screen");
const music = document.getElementById("title-music");
const startButton = document.getElementById("start");
const errorMessage = document.getElementById("error");
let starting = false;
let started = false;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fade(element, from, to, duration) {
  const animation = element.animate(
    [{ opacity: from }, { opacity: to }],
    { duration, easing: "ease-in-out", fill: "forwards" },
  );
  await animation.finished;
  element.style.opacity = String(to);
  animation.cancel();
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

async function playIntro() {
  await fade(icon, 0, 1, TIMING.iconFadeIn);
  await wait(TIMING.iconHold);
  await fade(icon, 1, 0, TIMING.iconFadeOut);
  await wait(TIMING.blackPause);
  screen.hidden = false;
  intro.hidden = true;
  await fade(screen, 0, 1, TIMING.screenFadeIn);
  screen.querySelector("h1").focus({ preventScroll: true });
  // The same audio element keeps playing through the entire transition.
}

async function start() {
  if (starting || started) return;
  starting = true;
  startButton.hidden = true;
  errorMessage.hidden = true;
  try {
    // Call play directly from the button event when autoplay needs a gesture.
    await music.play();
  } catch (error) {
    starting = false;
    startButton.hidden = false;
    if (error.name !== "NotAllowedError") {
      showError("音楽を読み込めませんでした。接続を確認して、もう一度開始してください。");
    }
    return;
  }
  started = true;
  starting = false;
  await playIntro();
}

startButton.addEventListener("click", start);

async function prepare() {
  try {
    await icon.decode();
  } catch {
    showError("アイコンを読み込めませんでした。ページを再読み込みしてください。");
    return;
  }
  // Paint the initial black frame before attempting music and the icon fade.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await start();
}

prepare();
