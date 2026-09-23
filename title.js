"use strict";

const TIMING = Object.freeze({
  initialBlack: 2000,
  iconFadeIn: 1000,
  iconHold: 2000,
  iconFadeOut: 1500,
  blackPause: 500,
  screenFadeIn: 1500,
  titleRevealDelay: 1000,
  titleHold: 3000,
  titleFadeOut: 1000,
});

const icon = document.getElementById("intro-icon");
const intro = document.getElementById("intro");
const screen = document.getElementById("title-screen");
const titleLogo = document.getElementById("title-logo");
const titleHeading = screen.querySelector("h1");
const menuButtonImage = document.getElementById("menu-button-image");
const ink = document.getElementById("title-ink");
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
  // Finish revealing the background before showing the title and its sound.
  await fade(screen, 0, 1, TIMING.screenFadeIn);
  await wait(TIMING.titleRevealDelay);
  titleHeading.hidden = false;
  // Play the one-shot title sound over the continuing BGM.
  ink.currentTime = 0;
  ink.play().catch((error) => console.warn("Title sound could not play:", error));
  titleHeading.focus({ preventScroll: true });
  await wait(TIMING.titleHold);
  await fade(titleHeading, 1, 0, TIMING.titleFadeOut);
  titleHeading.hidden = true;
  menuButtonImage.hidden = false;
  menuButtonImage.focus({ preventScroll: true });
  // The same audio element keeps playing through the entire transition.
}

async function start() {
  if (starting || started) return;
  starting = true;
  startButton.hidden = true;
  errorMessage.hidden = true;
  // Unlock this audio element during the same user gesture as the BGM.
  // The muted priming playback is stopped before the intro begins.
  ink.muted = true;
  const inkReady = ink.play().then(() => {
    ink.pause();
    ink.currentTime = 0;
  }).catch(() => {
    // A later attempt is still made when the title appears.
  }).finally(() => {
    ink.muted = false;
  });
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
  await inkReady;
  started = true;
  starting = false;
  await playIntro();
}

startButton.addEventListener("click", start);

async function prepare() {
  try {
    await Promise.all([icon.decode(), titleLogo.decode()]);
  } catch {
    showError("画像を読み込めませんでした。ページを再読み込みしてください。");
    return;
  }
  // Paint the initial black frame before attempting music and the icon fade.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await wait(TIMING.initialBlack);
  await start();
}

prepare();
