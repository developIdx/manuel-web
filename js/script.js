(() => {
  "use strict";

  // La configuración de tarjetas vive en index.html para poder editarla desde ahí.
  const cardsConfig = document.querySelector("#card-data");
  const images = cardsConfig ? JSON.parse(cardsConfig.textContent) : [];
  const pageSlugs = [
    "origen",
    "materia",
    "vacio",
    "horizonte",
    "movimiento",
    "naturaleza",
    "ascenso",
    "destino",
    "ecos",
    "umbral",
    "fragmento",
    "perspectiva",
    "silencio",
    "ritmo",
    "limite",
    "reflejo",
    "umbral-ii",
    "elevacion",
    "memoria",
    "reinicio",
  ];

  const orbit = document.querySelector("#orbit");
  const intro = document.querySelector("#intro");
  const progressBar = document.querySelector("#progress-bar");
  const currentNumber = document.querySelector("#current-number");
  const backToTopButton = document.querySelector(".back-to-top");
  const canvas = document.querySelector("#ambient-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const cards = [];
  const secondaryCards = [];
  const hoverLayer = document.createElement("div");
  const hoverImage = document.createElement("img");
  let expandedCard = null;

  hoverLayer.className = "card-hover-layer";
  hoverImage.alt = "Vista ampliada";
  hoverLayer.append(hoverImage);
  document.body.append(hoverLayer);

  function buildMediaUrl(value, width = 1000, quality = 85) {
    if (!value) return "";
    if (
      /^https?:\/\//.test(value) ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
    ) {
      return value.includes("?")
        ? `${value}&auto=format&fit=crop&w=${width}&q=${quality}`
        : `${value}?auto=format&fit=crop&w=${width}&q=${quality}`;
    }
    return value;
  }

  function createCard(
    title,
    description,
    photoId,
    index,
    hoverImageSrc,
    isSecondary = false,
  ) {
    const card = document.createElement("article");
    card.className = `card${isSecondary ? " secondary" : ""}`;
    card.setAttribute("aria-label", `${index + 1}. ${title}`);
    card.dataset.hoverImage = hoverImageSrc || photoId;

    const shell = document.createElement("div");
    shell.className = "card-shell";
    const img = document.createElement("img");
    img.src = buildMediaUrl(photoId, 1000, 85);
    img.alt = title;
    img.loading = index < 4 ? "eager" : "lazy";
    img.decoding = "async";

    const info = document.createElement("div");
    info.className = "card-info";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = description;
    info.append(heading, copy);
    shell.append(img, info);
    card.append(shell);
    return card;
  }

  // Crear tarjetas usando texto como nodos para evitar insertar HTML de datos.
  images.forEach((item, index) => {
    const title = item.title;
    const description = item.description;
    const photoId = item.image || item.photoId;
    const hoverPhoto = item.hoverImage || item.image || item.photoId;
    const card = createCard(
      title,
      description,
      photoId,
      index,
      hoverPhoto,
      false,
    );
    const openExpanded = () => {
      expandedCard = card;
      hoverImage.src = buildMediaUrl(hoverPhoto, 1600, 90);
      hoverImage.alt = title;
      hoverLayer.classList.add("visible");
      card.classList.add("is-expanded");
    };
    const closeExpanded = () => {
      expandedCard = null;
      hoverLayer.classList.remove("visible");
      card.classList.remove("is-expanded");
    };
    const pageNumber = String(index + 1).padStart(2, "0");
    const pageName =
      pageSlugs[index] ||
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    card.id = `card-${pageNumber}`;
    card.dataset.href = `tarjetas/${pageNumber}-${pageName}.html`;
    card.addEventListener("click", () => {
      window.location.assign(card.dataset.href);
    });
    hoverLayer.addEventListener("click", closeExpanded);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && expandedCard) {
        closeExpanded();
      }
    });
    orbit.append(card);
    cards.push(card);

    const secondary = createCard(
      title,
      description,
      photoId,
      index,
      hoverPhoto,
      true,
    );
    secondary.style.pointerEvents = "none";
    orbit.append(secondary);
    secondaryCards.push(secondary);
  });

  const total = cards.length;
  let scrollProgress = 0;
  let lastScrollY = window.scrollY;
  let rotationFromScroll = 0;
  let lastFrame = performance.now();
  let autoRotation = 0;
  let freeFlowTime = 0;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
  }
  function smoothstep(t) {
    t = clamp(t);
    return t * t * (3 - 2 * t);
  }

  function updateScroll() {
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - innerHeight,
    );
    scrollProgress = clamp(scrollY / maxScroll);
    const delta = scrollY - lastScrollY;
    rotationFromScroll += delta * 0.0012;
    lastScrollY = scrollY;
    progressBar.style.height = `${scrollProgress * 100}%`;
    intro.classList.toggle("hidden", scrollProgress > 0.012);
  }
  addEventListener("scroll", updateScroll, { passive: true });
  addEventListener("resize", resizeCanvas);
  backToTopButton?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  updateScroll();

  function restoreCardFromHash() {
    const match = window.location.hash.match(/^#card-(\d+)$/);
    if (!match) return;

    const cardIndex = Math.min(total - 1, Number(match[1]) - 1);
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - innerHeight,
    );
    window.scrollTo(0, maxScroll * ((cardIndex + 0.82) / total));
    updateScroll();
  }
  requestAnimationFrame(restoreCardFromHash);

  function renderCards(timeDelta) {
    if (!reduceMotion) {
      autoRotation += timeDelta * 0.00012;
      freeFlowTime += timeDelta * 0.0007;
    }
    const rotation = autoRotation + rotationFromScroll;
    const minDimension = Math.min(innerWidth, innerHeight);
    const radius = minDimension * (innerWidth < 700 ? 0.31 : 0.34);
    const activeIndex = Math.min(total - 1, Math.floor(scrollProgress * total));
    currentNumber.textContent = String(activeIndex + 1).padStart(2, "0");

    cards.forEach((card, index) => {
      if (expandedCard === card) {
        card.style.left = "50%";
        card.style.top = "50%";
        card.style.width = "100vw";
        card.style.height = "100vh";
        card.style.transform = "translate(-50%, -50%)";
        card.style.opacity = "1";
        card.style.filter = "none";
        card.style.pointerEvents = "auto";
        card.classList.add("is-expanded");
        return;
      }

      card.classList.remove("is-expanded");
      card.style.width = "";
      card.style.height = "";
      const angle = (index / total) * Math.PI * 2 + rotation;
      const depth = Math.sin(angle);
      const ringX = Math.cos(angle) * radius;
      const ringY = Math.sin(angle) * radius * 0.62;

      // Cada tarjeta dispone de su propio tramo de scroll, estrictamente secuencial.
      const local = clamp(scrollProgress * total - index);
      const approach = smoothstep(local / 0.72);
      const x = ringX * (1 - approach);
      const y = ringY * (1 - approach) + (1 - approach) * 90;
      const scale = 0.68 + approach * 0.82;
      const tilt = Math.cos(angle) * 13 * (1 - approach);
      const distanceFromCenter = Math.abs(index - activeIndex);
      const focus = clamp(1 - distanceFromCenter / 6);
      const opacity = local >= 1 ? 0 : 0.2 + focus * 0.8;
      const z = depth * 260 * (1 - approach) + approach * 220;
      const flowAmount = 1 - approach;
      const freeX =
        Math.sin(freeFlowTime + index * 1.7) * minDimension * 0.12 * flowAmount;
      const freeY =
        Math.cos(freeFlowTime * 0.82 + index * 1.3) *
        minDimension *
        0.1 *
        flowAmount;
      const freeTilt = Math.sin(freeFlowTime * 0.7 + index) * 3.5 * flowAmount;
      card.style.transform = `translate3d(calc(-50% + ${x + freeX}px),calc(-50% + ${y + freeY}px),${z}px) rotate(${tilt + freeTilt}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.filter = "none";
      const isActive = local >= 0.72 && local < 1;
      card.classList.toggle("active", isActive);
      if (isActive) {
        card.setAttribute("aria-current", "true");
      } else {
        card.removeAttribute("aria-current");
      }
      card.style.pointerEvents = opacity > 0.1 ? "auto" : "none";
    });

    secondaryCards.forEach((card, index) => {
      const angle =
        (index / total) * Math.PI * 2 +
        rotation * 1.28 +
        Math.PI / total +
        0.45;
      const ringX = Math.cos(angle) * radius * 1.62;
      const ringY = Math.sin(angle) * radius * 0.86 * 1.62;
      const local = clamp(scrollProgress * total - index + 0.38);
      const approach = smoothstep(local / 0.9);
      const x = ringX * (1 - approach) * 0.98;
      const y = ringY * (1 - approach) * 0.92 + (1 - approach) * 150;
      const scale = 0.36 + approach * 0.34;
      const opacity = local >= 1 ? 0 : 0.08 + (1 - approach) * 0.2;
      const z = -110 + (1 - approach) * 120;
      const flowAmount = 1 - approach;
      const freeX =
        Math.sin(freeFlowTime * 0.76 + index * 1.9) *
        minDimension *
        0.16 *
        flowAmount;
      const freeY =
        Math.cos(freeFlowTime * 0.64 + index * 1.1) *
        minDimension *
        0.13 *
        flowAmount;
      const drift = Math.sin(rotation * 2 + index) * 12 + freeX * 0.025;
      card.style.transform = `translate3d(calc(-50% + ${x + freeX}px),calc(-50% + ${y + freeY}px),${z}px) rotate(${drift}deg) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.filter = "none";
      card.style.pointerEvents = "none";
      card.classList.remove("active");
    });
  }

  // Fondo generativo: curvas suaves monocromas, con contraste bajo.
  let width = 0,
    height = 0,
    dpr = 1;
  const forms = Array.from({ length: 7 }, (_, i) => ({
    seed: i * 1.73 + 0.4,
    x: 0.5 + Math.cos(i * 2.4) * 0.36,
    y: 0.5 + Math.sin(i * 1.8) * 0.36,
    size: 0.12 + (i % 3) * 0.055,
    speed: 0.00012 + (i % 4) * 0.00004,
  }));

  function resizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 1.6);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
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
      ctx.fillStyle = `rgba(210,210,210,0.018)`;
      ctx.beginPath();
      for (let step = 0; step <= 100; step++) {
        const a = (step / 100) * Math.PI * 2;
        const wobble =
          1 +
          0.13 * Math.sin(a * 3 + t + form.seed) +
          0.07 * Math.cos(a * 5 - t * 0.7);
        const x = cx + Math.cos(a) * rx * wobble;
        const y = cy + Math.sin(a) * ry * wobble;
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  function frame(now) {
    const delta = Math.min(50, now - lastFrame);
    lastFrame = now;
    renderCards(delta);
    drawBackground(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
