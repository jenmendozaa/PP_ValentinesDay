(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const caughtEl = document.getElementById("caught");
  const missedEl = document.getElementById("missed");
  const restartBtn = document.getElementById("restartBtn");

  const debugBox = document.getElementById("debugBox");
  const debugText = document.getElementById("debugText");

  // Overlay
  const winOverlay = document.getElementById("winOverlay");
  const closeWinBtn = document.getElementById("closeWinBtn");

  // Controls
  const musicBtn = document.getElementById("musicBtn");
  const muteBtn = document.getElementById("muteBtn");
  const volSlider = document.getElementById("vol");

  // Audio
  const bgm = makeAudio("assets/bgm.mp3", { loop: true });
  const sfxCatch = makeAudio("assets/catch.mp3");
  const sfxMiss  = makeAudio("assets/miss.mp3");
  const sfxWin   = makeAudio("assets/win.mp3");
  const sfxClick = makeAudio("assets/click.mp3");

  let audioUnlocked = false;

  function syncAudioUI() {
    const s = getAudioSettings();
    musicBtn.textContent = `Music: ${s.musicOn ? "On" : "Off"}`;
    muteBtn.textContent = `Mute: ${s.muted ? "On" : "Off"}`;
    volSlider.value = String(s.musicVolume);
    bgm.volume = s.musicVolume;
    if (s.muted || !s.musicOn) stopBgm(bgm);
  }

  musicBtn.addEventListener("click", () => {
    playSfx(sfxClick);
    const s = setAudioSettings({ musicOn: !getAudioSettings().musicOn });
    if (!s.muted && s.musicOn && audioUnlocked) startBgm(bgm);
    else stopBgm(bgm);
    syncAudioUI();
  });

  muteBtn.addEventListener("click", () => {
    playSfx(sfxClick);
    const s = setAudioSettings({ muted: !getAudioSettings().muted });
    if (!s.muted && s.musicOn && audioUnlocked) startBgm(bgm);
    else stopBgm(bgm);
    syncAudioUI();
  });

  volSlider.addEventListener("input", () => {
    const v = Number(volSlider.value);
    setAudioSettings({ musicVolume: v });
    bgm.volume = v;
  });

  syncAudioUI();

  // Start BGM on first user interaction on this page (mobile requirement)
  window.addEventListener("pointerdown", () => {
    if (!audioUnlocked) {
      audioUnlocked = true;
      startBgm(bgm);
      syncAudioUI();
    }
  }, { once: true });

  // Game settings
  const WIN_COUNT = 14;
  const HEART_SPAWN_MS = 550;
  const HEART_FALL_SPEED = 2.6;
  const MAX_MISSES = 12;

  // Basket
  const basket = { x: canvas.width / 2, y: canvas.height - 38, w: 110, h: 18, speed: 7 };

  // Hearts
  let hearts = [];
  let lastSpawn = 0;

  // Confetti on canvas
  let confetti = [];

  // State
  let caught = 0;
  let missed = 0;
  let running = true;
  let won = false;

  // Input
  let leftDown = false;
  let rightDown = false;
  let pointerActive = false;

  function updateHUD() {
    caughtEl.textContent = String(caught);
    missedEl.textContent = String(missed);
  }

  function reset() {
    hearts = [];
    confetti = [];
    lastSpawn = 0;
    caught = 0;
    missed = 0;
    won = false;
    running = true;
    updateHUD();
    hideWinOverlay();
  }

  function spawnHeart(now) {
    const x = rand(18, canvas.width - 18);
    const size = rand(18, 26);
    const speed = HEART_FALL_SPEED + Math.random() * 1.8;
    hearts.push({ x, y: -20, size, speed });
    lastSpawn = now;
  }

  function drawHeart(h) {
    ctx.font = `${h.size}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💖", h.x, h.y);
  }

  function drawBasket() {
    ctx.beginPath();
    ctx.roundRect(basket.x - basket.w / 2, basket.y, basket.w, basket.h, 8);
    ctx.fillStyle = "#ffd1dc";
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(basket.x - basket.w / 2 + 10, basket.y - 10, basket.w - 20, 12, 8);
    ctx.fillStyle = "#ff4d6d";
    ctx.fill();
  }

  function intersects(heart) {
    const withinX = heart.x >= (basket.x - basket.w/2) && heart.x <= (basket.x + basket.w/2);
    const withinY = heart.y >= (basket.y - 20) && heart.y <= (basket.y + basket.h + 10);
    return withinX && withinY;
  }

  function spawnConfetti() {
    for (let i = 0; i < 90; i++) {
      confetti.push({
        x: rand(0, canvas.width),
        y: rand(-60, 0),
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2 + Math.random() * 3.8,
        size: rand(14, 22),
        spin: (Math.random() - 0.5) * 0.22,
        emoji: Math.random() < 0.6 ? "💗" : "✨",
      });
    }
  }

  function updateConfetti() {
    confetti.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx += Math.sin(p.y * 0.01) * 0.02;
    });
    confetti = confetti.filter(p => p.y < canvas.height + 70);
  }

  function drawConfetti() {
    confetti.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin * p.y);
      ctx.font = `${p.size}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    });
  }

  // ----- WIN OVERLAY DOM ANIMATION -----
  function launchOverlayHearts() {
    const bursts = 22;
    for (let i = 0; i < bursts; i++) {
      setTimeout(() => spawnFloatingHeart(), i * 90);
      if (i % 4 === 0) setTimeout(() => spawnSparkleBurst(), i * 120 + 80);
    }
  }

  function spawnFloatingHeart() {
    const el = document.createElement("div");
    el.className = "float-heart";
    el.textContent = Math.random() < 0.7 ? "💗" : "💖";

    const x = rand(-220, 220);
    const r = rand(-60, 60);
    const dur = rand(1700, 2600);
    const left = rand(10, 90);
    const size = rand(18, 34);

    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--r", `${r}deg`);
    el.style.setProperty("--dur", `${dur}ms`);
    el.style.left = `${left}%`;
    el.style.fontSize = `${size}px`;

    winOverlay.appendChild(el);
    setTimeout(() => el.remove(), dur + 300);
  }

  function spawnSparkleBurst() {
    const centerX = rand(25, 75);
    const centerY = rand(25, 70);
    const particles = 14;

    for (let i = 0; i < particles; i++) {
      const s = document.createElement("div");
      s.className = "sparkle";

      const angle = Math.random() * Math.PI * 2;
      const dist = rand(40, 140);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const dur = rand(650, 1000);

      s.style.left = `${centerX}%`;
      s.style.top = `${centerY}%`;
      s.style.setProperty("--dx", `${dx}px`);
      s.style.setProperty("--dy", `${dy}px`);
      s.style.setProperty("--dur", `${dur}ms`);

      winOverlay.appendChild(s);
      setTimeout(() => s.remove(), dur + 80);
    }
  }

  function showWinOverlay() {
    winOverlay.classList.add("show");
    winOverlay.setAttribute("aria-hidden", "false");
    launchOverlayHearts();
  }

  function hideWinOverlay() {
    winOverlay.classList.remove("show");
    winOverlay.setAttribute("aria-hidden", "true");
    [...winOverlay.querySelectorAll(".float-heart, .sparkle")].forEach(el => el.remove());
  }

  closeWinBtn.addEventListener("click", () => {
    playSfx(sfxClick);
    hideWinOverlay();
  });

  function win() {
    if (won) return;
    won = true;
    playSfx(sfxWin);
    spawnConfetti();
    showWinOverlay();
  }

  function gameOver() {
    running = false;
    alert("Nooo 😭 Try again!");
  }

  function update(now) {
    if (!running) return;

    // movement
    if (!pointerActive) {
      if (leftDown) basket.x -= basket.speed;
      if (rightDown) basket.x += basket.speed;
    }
    basket.x = clamp(basket.x, basket.w / 2, canvas.width - basket.w / 2);

    // spawn
    const spawnEvery = isTestMode() ? 350 : HEART_SPAWN_MS;
    if (now - lastSpawn > spawnEvery) spawnHeart(now);

    // move hearts
    for (const h of hearts) h.y += h.speed;

    // catch/miss
    const remaining = [];
    for (const h of hearts) {
      if (intersects(h) && !won) {
        caught += 1;
        playSfx(sfxCatch);
        updateHUD();
        if (caught >= WIN_COUNT) win();
      } else if (h.y > canvas.height + 30) {
        missed += 1;
        playSfx(sfxMiss);
        updateHUD();
        if (missed >= MAX_MISSES && !won) gameOver();
      } else {
        remaining.push(h);
      }
    }
    hearts = remaining;

    updateConfetti();

    if (isTestMode()) {
      debugBox.classList.remove("hidden");
      debugText.textContent =
        `TEST MODE ON\nhearts=${hearts.length}\nconfetti=${confetti.length}\nwon=${won}\nbasketX=${basket.x.toFixed(1)}\nspawnEvery=${spawnEvery}ms`;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, "#fff5f7");
    g.addColorStop(1, "#ffe8f1");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    hearts.forEach(drawHeart);
    drawBasket();
    drawConfetti();

    ctx.fillStyle = "#2b2b2b";
    ctx.font = "14px system-ui";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Move: arrow keys (laptop) or drag (phone)", 12, 12);
  }

  function loop(now) {
    update(now);
    render();
    requestAnimationFrame(loop);
  }

  // keyboard
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") leftDown = true;
    if (e.key === "ArrowRight") rightDown = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") leftDown = false;
    if (e.key === "ArrowRight") rightDown = false;
  });

  // pointer controls
  const pointerToCanvasX = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    return (clientX - rect.left) * scaleX;
  };

  canvas.addEventListener("pointerdown", (e) => {
    pointerActive = true;
    basket.x = pointerToCanvasX(e.clientX);
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!pointerActive) return;
    basket.x = pointerToCanvasX(e.clientX);
  });

  canvas.addEventListener("pointerup", () => { pointerActive = false; });

  restartBtn.addEventListener("click", () => {
    playSfx(sfxClick);
    reset();
  });

  // start
  reset();
  requestAnimationFrame(loop);

  // utils
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
})();
