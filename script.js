// ---------- Test Mode ----------
function isTestMode() {
  return new URLSearchParams(window.location.search).get("test") === "1";
}

// Carry test param across pages
function withTestParam(url) {
  if (!isTestMode()) return url;
  const u = new URL(url, window.location.href);
  u.searchParams.set("test", "1");
  return u.pathname + "?" + u.searchParams.toString();
}

// ---------- Audio Settings ----------
const AUDIO_SETTINGS_KEY = "valentine_audio_settings_v1";

function getAudioSettings() {
  try {
    return JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY)) ?? {
      muted: false,
      musicOn: true,
      musicVolume: 0.25,
      sfxVolume: 0.7,
    };
  } catch {
    return { muted:false, musicOn:true, musicVolume:0.25, sfxVolume:0.7 };
  }
}

function setAudioSettings(patch) {
  const current = getAudioSettings();
  const next = { ...current, ...patch };
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(next));
  return next;
}

function makeAudio(src, { loop=false, volume=1 } = {}) {
  const a = new Audio(src);
  a.loop = loop;
  a.volume = volume;
  a.preload = "auto";
  return a;
}

function playSfx(audioObj) {
  const s = getAudioSettings();
  if (s.muted) return;
  try {
    audioObj.currentTime = 0;
    audioObj.volume = s.sfxVolume;
    audioObj.play();
  } catch {}
}

function startBgm(bgmAudio) {
  const s = getAudioSettings();
  if (s.muted || !s.musicOn) return;
  bgmAudio.volume = s.musicVolume;
  try { bgmAudio.play(); } catch {}
}

function stopBgm(bgmAudio) {
  try { bgmAudio.pause(); } catch {}
}

// ---------- Runaway No ----------
function setupRunawayNoButton() {
  const noBtn = document.getElementById("noBtn");
  const card = document.getElementById("card");
  if (!noBtn || !card) return;

  const dodge = () => moveButtonWithinCard(noBtn, card);

  noBtn.addEventListener("mouseenter", dodge);
  noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    dodge();
  }, { passive:false });

  noBtn.addEventListener("click", () => {
    alert("Nice try 😭 but the answer is Yes.");
    dodge();
  });

  setTimeout(dodge, 500);
}

function moveButtonWithinCard(button, container) {
  button.style.position = "absolute";

  const cRect = container.getBoundingClientRect();
  const bRect = button.getBoundingClientRect();
  const pad = 14;

  const minX = cRect.left + pad;
  const minY = cRect.top + pad;
  const maxX = cRect.right - bRect.width - pad;
  const maxY = cRect.bottom - bRect.height - pad;

  const x = rand(minX, Math.max(minX, maxX));
  const y = rand(minY, Math.max(minY, maxY));

  button.style.left = `${x}px`;
  button.style.top  = `${y}px`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------- Date helpers ----------
function getValentinesTarget() {
  const now = new Date();
  let target = new Date(now.getFullYear(), 1, 14, 0, 0, 0);
  if (now > target) target = new Date(now.getFullYear() + 1, 1, 14, 0, 0, 0);
  return target;
}

function isValentinesDayToday() {
  const now = new Date();
  return now.getMonth() === 1 && now.getDate() === 14;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2,"0")}h ${String(minutes).padStart(2,"0")}m ${String(seconds).padStart(2,"0")}s`;
}

