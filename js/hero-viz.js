/* Hero visualization: a quiet drafting system that assembles on its own,
   accelerates under the cursor, and constructs an isometric platform artifact —
   foundation, services, and product modules. Charcoal + graphite + one orange.
   No dependencies. */

(() => {
  const canvas = document.getElementById("heroViz");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const scrollDriven = coarsePointer || window.innerWidth < 861;
  const FORCE = new URLSearchParams(location.search).get("viz"); // ?viz=full for review

  const INK = (a) => `rgba(22, 19, 14, ${a})`;
  const GRAPHITE = (a) => `rgba(96, 88, 72, ${a})`;
  const ORANGE = (a) => `rgba(217, 90, 50, ${a})`;

  let W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  /* ---- the artifact: an exploded isometric platform stack ---------------- */
  // Isometric projection into unit (0..1) space. u,v span the plane; z lifts.
  const ISO = { cx: 0.5, cy: 0.55, s: 0.255, lift: 0.155 };
  const iso = (u, v, z) => [
    ISO.cx + (u - v) * ISO.s * 0.866,
    ISO.cy + (u + v) * ISO.s * 0.5 - z * ISO.lift,
  ];

  function rhombus(u0, v0, u1, v1, z) {
    return [iso(u0, v0, z), iso(u1, v0, z), iso(u1, v1, z), iso(u0, v1, z), iso(u0, v0, z)];
  }

  // Build ordered strokes: foundation → risers → services → risers → modules.
  // Each stroke: { pts, len, style: 'ink'|'graphite'|'orange', w }
  function seg(a, b) { return [a, b]; }
  const artifact = [];
  const add = (pts, style = "ink", w = 1.2) => artifact.push({ pts, style, w });

  // foundation plane (largest, drawn first)
  add(rhombus(-1, -1, 1, 1, 0), "ink", 1.3);
  // subtle inner grid on the foundation
  add(seg(iso(0, -1, 0), iso(0, 1, 0)), "graphite", 0.8);
  add(seg(iso(-1, 0, 0), iso(1, 0, 0)), "graphite", 0.8);

  // corner risers up to the services plane
  [[-0.72, -0.72], [0.72, -0.72], [0.72, 0.72], [-0.72, 0.72]].forEach(([u, v]) => {
    add(seg(iso(u, v, 0), iso(u, v, 1)), "graphite", 0.9);
  });

  // services plane (middle)
  add(rhombus(-0.72, -0.72, 0.72, 0.72, 1), "ink", 1.2);

  // risers to the product level
  [[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.42, 0.42]].forEach(([u, v]) => {
    add(seg(iso(u, v, 1), iso(u, v, 2)), "graphite", 0.9);
  });

  // three product modules on the top level
  add(rhombus(-0.62, -0.62, -0.06, -0.06, 2), "ink", 1.2);
  add(rhombus(0.10, -0.62, 0.66, -0.06, 2), "ink", 1.2);
  add(rhombus(-0.26, 0.14, 0.30, 0.70, 2), "orange", 1.3);

  // connectors between modules (ideas linking)
  add(seg(iso(-0.06, -0.34, 2), iso(0.10, -0.34, 2)), "orange", 1);
  add(seg(iso(-0.34, -0.06, 2), iso(-0.02, 0.14, 2)), "orange", 1);
  add(seg(iso(0.38, -0.06, 2), iso(0.06, 0.14, 2)), "graphite", 1);

  // dimension line measuring the stack height, off to the left
  const dA = iso(-1.06, 0.96, 0);
  const dB = iso(-1.06, 0.96, 2);
  add(seg(dA, dB), "graphite", 0.9);
  add(seg([dA[0] - 0.012, dA[1]], [dA[0] + 0.012, dA[1]]), "graphite", 0.9);
  add(seg([dB[0] - 0.012, dB[1]], [dB[0] + 0.012, dB[1]]), "graphite", 0.9);

  // compute lengths (in unit space) for the draw budget
  artifact.forEach((s) => {
    let len = 0;
    for (let i = 1; i < s.pts.length; i++) {
      len += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
    }
    s.len = len;
  });
  const totalLen = artifact.reduce((t, s) => t + s.len, 0);

  /* ---- ambient scene ------------------------------------------------------ */
  const circles = [
    { x: 0.5, y: 0.5, r: 0.43, a0: -1.1, rest: 0.2, speed: 0.045 },
    { x: 0.52, y: 0.46, r: 0.33, a0: 2.0, rest: 0.12, speed: -0.03 },
  ];
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const nodes = [];
  for (let i = 0; i < 10; i++) {
    nodes.push({ x: 0.06 + rand() * 0.88, y: 0.04 + rand() * 0.92, act: 0 });
  }
  const crosses = [
    { x: 0.14, y: 0.3 }, { x: 0.86, y: 0.44 }, { x: 0.26, y: 0.86 },
    { x: 0.7, y: 0.08 }, { x: 0.9, y: 0.78 },
  ];
  const notes = [
    { x: 0.1, y: 0.16, t: "pl. 03", act: 0 },
    { x: 0.78, y: 0.9, t: "1:4", act: 0 },
    { x: 0.06, y: 0.6, t: "§ found.", act: 0 },
  ];

  /* ---- state -------------------------------------------------------------- */
  const pointer = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, inside: false, lastMove: 0 };
  const BUILD_TIME = 9; // seconds to fully assemble ambiently
  let energy = 0;
  let scrollEnergy = 0;
  let latched = false; // once built, it stays built
  let last = performance.now();
  let running = false;
  let visible = false;

  canvas.parentElement.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.inside = true;
    pointer.lastMove = performance.now();
  });
  canvas.parentElement.addEventListener("pointerleave", () => { pointer.inside = false; });

  if (scrollDriven) {
    const hero = document.querySelector(".hero") || canvas;
    const onScroll = () => {
      const r = hero.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh - r.top) / (vh * 0.9), 0), 1);
      scrollEnergy = p * BUILD_TIME;
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

  function strokeStyleFor(s, alpha) {
    if (s.style === "orange") return ORANGE(alpha);
    if (s.style === "graphite") return GRAPHITE(alpha * 0.9);
    return INK(alpha);
  }

  function drawPartialPolyline(pts, frac) {
    if (frac <= 0) return;
    const nSeg = pts.length - 1;
    const drawSegs = nSeg * frac;
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * W, pts[0][1] * H);
    for (let i = 1; i < pts.length; i++) {
      const segIndex = i - 1;
      if (segIndex >= drawSegs) {
        const t = drawSegs - Math.floor(drawSegs);
        if (segIndex === Math.floor(drawSegs) && t > 0) {
          const px = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
          const py = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
          ctx.lineTo(px * W, py * H);
        }
        break;
      }
      ctx.lineTo(pts[i][0] * W, pts[i][1] * H);
    }
    ctx.stroke();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // --- energy: ambient assembly, pointer accelerates, completion latches ---
    if (FORCE === "full") {
      energy = BUILD_TIME;
    } else if (scrollDriven) {
      energy = Math.max(energy, energy + (scrollEnergy - energy) * Math.min(dt * 2, 1));
      energy += dt * 0.35; // still assembles on its own
    } else {
      const moving = now - pointer.lastMove < 900;
      const rate = pointer.inside && moving ? 2.2 : 1; // cursor speeds it up
      energy += dt * rate;
    }
    if (energy >= BUILD_TIME) { energy = BUILD_TIME; latched = true; }
    if (latched) energy = BUILD_TIME;
    const build = smooth(clamp01(energy / BUILD_TIME));

    // eased pointer
    pointer.sx += (pointer.x - pointer.sx) * Math.min(dt * 4, 1);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(dt * 4, 1);

    const R = Math.max(W, H) * 0.34;
    const influence = (x, y) => {
      if (FORCE === "full") return 1;
      if (!pointer.inside) return 0;
      const d = Math.hypot(x * W - pointer.sx, y * H - pointer.sy);
      return smooth(clamp01(1 - d / R));
    };

    ctx.clearRect(0, 0, W, H);
    const t = now / 1000;

    // --- drafting crosses ---
    ctx.lineWidth = 1;
    crosses.forEach((c) => {
      const a = 0.12 + influence(c.x, c.y) * 0.2;
      ctx.strokeStyle = INK(a);
      const s = 5;
      ctx.beginPath();
      ctx.moveTo(c.x * W - s, c.y * H); ctx.lineTo(c.x * W + s, c.y * H);
      ctx.moveTo(c.x * W, c.y * H - s); ctx.lineTo(c.x * W, c.y * H + s);
      ctx.stroke();
    });

    // --- construction circles: complete alongside the build ---
    circles.forEach((c) => {
      const inf = influence(c.x, c.y);
      const completion = Math.min(c.rest + build * (1 - c.rest) * 0.85 + inf * 0.15, 1);
      const rot = reducedMotion ? 0 : t * c.speed;
      ctx.strokeStyle = GRAPHITE(0.2 + inf * 0.2 + build * 0.06);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(c.x * W, c.y * H, c.r * Math.min(W, H), c.a0 + rot, c.a0 + rot + Math.PI * 2 * completion);
      ctx.stroke();
      if (build > 0.15 && completion < 1) {
        const ang = c.a0 + rot + Math.PI * 2 * completion;
        ctx.fillStyle = ORANGE(0.4 + inf * 0.4);
        ctx.beginPath();
        ctx.arc(c.x * W + Math.cos(ang) * c.r * Math.min(W, H), c.y * H + Math.sin(ang) * c.r * Math.min(W, H), 2.2, 0, 7);
        ctx.fill();
      }
    });

    // --- ambient nodes ---
    nodes.forEach((n) => {
      const target = influence(n.x, n.y);
      n.act += (target - n.act) * Math.min(dt * 1.6, 1);
      ctx.fillStyle = INK(0.14 + n.act * 0.45);
      ctx.beginPath();
      ctx.arc(n.x * W, n.y * H, 1.5 + n.act * 1.2, 0, 7);
      ctx.fill();
    });

    // --- annotations fade in as the build progresses ---
    ctx.font = "11px 'IBM Plex Mono', monospace";
    notes.forEach((n, i) => {
      const appearAt = 0.35 + i * 0.22;
      const target = clamp01((build - appearAt) / 0.15);
      n.act += (target - n.act) * Math.min(dt * 1.5, 1);
      if (n.act < 0.03) return;
      ctx.fillStyle = ORANGE(0.75 * n.act);
      ctx.fillText(n.t, n.x * W, n.y * H);
    });

    // --- the platform artifact draws itself ---
    if (build > 0.02) {
      ctx.lineJoin = "round";
      let budget = totalLen * build;
      for (const s of artifact) {
        if (budget <= 0) break;
        const frac = clamp01(budget / s.len);
        ctx.lineWidth = s.w;
        ctx.strokeStyle = strokeStyleFor(s, 0.35 + build * 0.4);
        drawPartialPolyline(s.pts, frac);
        budget -= s.len;
      }
      // orange registration point at the artifact's origin once foundations exist
      if (build > 0.25) {
        const [ox, oy] = iso(0, 0, 0);
        ctx.fillStyle = ORANGE(0.5 + 0.3 * build);
        ctx.beginPath();
        ctx.arc(ox * W, oy * H, 2.4, 0, 7);
        ctx.fill();
      }
    }

    if (running) requestAnimationFrame(frame);
  }

  /* ---- lifecycle ----------------------------------------------------------- */
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  if (reducedMotion) {
    // static composition: the completed artifact, no loop
    energy = BUILD_TIME;
    latched = true;
    pointer.inside = false;
    last = performance.now() - 16;
    frame(performance.now());
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else if (visible) start();
    });
  }
})();
