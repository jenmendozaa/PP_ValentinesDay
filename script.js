function isTestMode() {
  return new URLSearchParams(window.location.search).get("test") === "1";
}

function withTestParam(url) {
  if (!isTestMode()) return url;
  const u = new URL(url, window.location.href);
  u.searchParams.set("test", "1");
  return u.pathname + "?" + u.searchParams.toString();
}

function setupRunawayNoButton() {
  const noBtn = document.getElementById("noBtn");
  const card = document.getElementById("card");
  if (!noBtn || !card) return;

  const dodge = () => {
    noBtn.style.position = "absolute";
    const c = card.getBoundingClientRect();
    const b = noBtn.getBoundingClientRect();
    const x = Math.random() * (c.width - b.width);
    const y = Math.random() * (c.height - b.height);
    noBtn.style.left = `${c.left + x}px`;
    noBtn.style.top = `${c.top + y}px`;
  };

  noBtn.addEventListener("mouseenter", dodge);
  noBtn.addEventListener("touchstart", (e) => { e.preventDefault(); dodge(); });
  noBtn.addEventListener("click", dodge);
}

function getValentinesTarget() {
  const now = new Date();
  let target = new Date(now.getFullYear(), 1, 14);
  if (now > target) target = new Date(now.getFullYear() + 1, 1, 14);
  return target;
}

function isValentinesDayToday() {
  const d = new Date();
  return d.getMonth() === 1 && d.getDate() === 14;
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

