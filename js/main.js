/* Brent Rohr — portfolio interactions. No dependencies. */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- Scroll reveal ------------------------------------------------------ */
const revealEls = document.querySelectorAll(".reveal");
if (reducedMotion) {
  revealEls.forEach((el) => el.classList.add("in"));
} else {
  // Stagger siblings that enter together
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  revealEls.forEach((el, i) => {
    el.style.setProperty("--d", `${(i % 4) * 0.08}s`);
    io.observe(el);
  });
}

/* ---- Hero seat ticker ---------------------------------------------------- */
const seats = ["Engineer", "Researcher", "Designer", "PM", "Director", "Builder"];
const seatEl = document.getElementById("seatWord");
if (seatEl && !reducedMotion) {
  let i = 0;
  setInterval(() => {
    seatEl.classList.add("swap");
    setTimeout(() => {
      i = (i + 1) % seats.length;
      seatEl.textContent = seats[i];
      seatEl.classList.remove("swap");
    }, 300);
  }, 2200);
}

/* ---- Stat count-up -------------------------------------------------------- */
const stats = document.querySelectorAll(".stat-num[data-count]");
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const dur = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = prefix + fmt(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (stats.length) {
  if (reducedMotion) {
    // leave server-rendered values in place
  } else {
    const statIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countUp(entry.target);
          statIO.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach((el) => statIO.observe(el));
  }
}

/* ---- Cycle line draw-on-scroll -------------------------------------------- */
const cycleTrack = document.querySelector(".cycle-track");
const cycleLine = document.querySelector(".cycle-line line");
if (cycleTrack && cycleLine && !reducedMotion) {
  const onScroll = () => {
    const rect = cycleTrack.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 when the top enters the viewport, 1 when the bottom is 20% up the screen
    const progress = Math.min(
      Math.max((vh * 0.8 - rect.top) / (rect.height + vh * 0.3), 0),
      1
    );
    cycleLine.style.setProperty("--draw", 100 - progress * 100);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
} else if (cycleLine) {
  cycleLine.style.setProperty("--draw", 0);
}

