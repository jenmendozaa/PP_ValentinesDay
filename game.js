(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const caughtEl = document.getElementById("caught");
  const missedEl = document.getElementById("missed");
  const restartBtn = document.getElementById("restartBtn");
  const winNote = document.getElementById("winNote");
  const debugBox = document.getElementById("debugBox");
  const debugText = document.getElementById("debugText");

  const WIN = 14;
  const basket = { x: 280, y: 380, w: 110 };
  let hearts = [];
  let caught = 0;
  let missed = 0;

  function reset() {
    hearts = [];
    caught = missed = 0;
    winNote.classList.add("hidden");
  }

  function spawnHeart() {
    hearts.push({ x: Math.random()*520+20, y: -20, speed: 2 + Math.random()*2 });
  }

  function draw() {
    ctx.clearRect(0,0,560,420);
    hearts.forEach(h => {
      ctx.font = "22px system-ui";
      ctx.fillText("💖", h.x, h.y);
      h.y += h.speed;

      if (h.y > 380 && Math.abs(h.x - basket.x) < basket.w/2) {
        caught++;
        hearts = hearts.filter(x => x !== h);
      } else if (h.y > 420) {
        missed++;
        hearts = hearts.filter(x => x !== h);
      }
    });

    ctx.fillRect(basket.x - basket.w/2, basket.y, basket.w, 14);

    caughtEl.textContent = caught;
    missedEl.textContent = missed;

    if (caught >= WIN) winNote.classList.remove("hidden");

    if (isTestMode()) {
      debugBox.classList.remove("hidden");
      debugText.textContent = `hearts=${hearts.length}\ncaught=${caught}\nmissed=${missed}`;
    }
  }

  canvas.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    basket.x = (e.clientX - r.left) * (560 / r.width);
  });

  restartBtn.addEventListener("click", reset);

  setInterval(() => spawnHeart(), isTestMode() ? 300 : 600);
  setInterval(draw, 16);
})();

