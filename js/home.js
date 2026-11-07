(() => {
  "use strict";
  // Fondo generativo: curvas suaves monocromas, con contraste bajo.
  const canvas = document.querySelector("#ambient-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0;
  const forms = Array.from({ length: 7 }, (_, i) => ({
    seed: i * 1.73 + 0.4,
    size: 0.12 + (i % 3) * 0.055,
    speed: 0.00012 + (i % 4) * 0.00004,
  }));
  function resizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 1.6);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resizeCanvas);
  resizeCanvas();
  function drawBackground(now) {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    forms.forEach((form, i) => {
      const t = reduceMotion ? 0 : now * form.speed;
      const cx = (0.5 + Math.sin(t + form.seed) * 0.32) * width;
      const cy = (0.5 + Math.cos(t * 0.83 + form.seed) * 0.34) * height;
      const rx = Math.min(width, height) * form.size;
      const ry = rx * (0.62 + Math.sin(t + i) * 0.18);
      const gray = 100 + (i % 3) * 25;
      ctx.strokeStyle = `rgba(${gray},${gray},${gray},0.12)`;
      ctx.fillStyle = "rgba(210,210,210,0.018)";
      ctx.beginPath();
      for (let step = 0; step <= 100; step++) {
        const a = (step / 100) * Math.PI * 2;
        const wobble = 1 + 0.13 * Math.sin(a * 3 + t + form.seed) + 0.07 * Math.cos(a * 5 - t * 0.7);
        const x = cx + Math.cos(a) * rx * wobble;
        const y = cy + Math.sin(a) * ry * wobble;
        if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  (function frame(now) {
    drawBackground(now);
    if (!reduceMotion) requestAnimationFrame(frame);
  })(0);

  // Pestaña activa: la última sección cuyo inicio ya pasó el 40% de la pantalla.
  const links = [...document.querySelectorAll(".tabs a[href^='#'], .nav-link[href^='#']")];
  const sections = [...new Set(links.map((a) => a.hash))].map((h) => document.getElementById(h.slice(1))).filter(Boolean);
  const setActive = (id) => links.forEach((a) => a.classList.toggle("is-active", a.hash === `#${id}`));
  function updateActive() {
    let current = null;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= innerHeight * 0.4) current = s; });
    if (sections.length && innerHeight + scrollY >= document.documentElement.scrollHeight - 2) current = sections[sections.length - 1];
    setActive(current ? current.id : "");
  }
  addEventListener("scroll", updateActive, { passive: true });
  addEventListener("resize", updateActive);
  links.forEach((a) => a.addEventListener("click", () => setActive(a.hash.slice(1))));
  updateActive();

  // Móvil: cuando las pestañas quedan fijas, el nombre se centra en la cabecera.
  const topBar = document.querySelector(".top-bar");
  const tabsEl = document.querySelector(".tabs");
  function updateBrand() {
    const stuck = tabsEl && tabsEl.getBoundingClientRect().top <= topBar.offsetHeight + 1;
    topBar.classList.toggle("is-scrolled", !!stuck);
  }
  addEventListener("scroll", updateBrand, { passive: true });
  addEventListener("resize", updateBrand);
  updateBrand();

  // Menú móvil.
  const burger = document.querySelector(".burger-button");
  const menu = document.querySelector("#nav-menu");
  if (!burger || !menu) return;
  const setOpen = (open) => {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };
  burger.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  menu.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
})();
