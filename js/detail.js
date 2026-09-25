(() => {
  "use strict";

  // Visor a pantalla completa con carrusel para las imágenes de la página.
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Visor de imágenes");
  lightbox.innerHTML = `
    <button class="lb-btn lb-close" type="button" aria-label="Cerrar">&times;</button>
    <button class="lb-btn lb-prev" type="button" aria-label="Anterior">&#8249;</button>
    <button class="lb-btn lb-next" type="button" aria-label="Siguiente">&#8250;</button>
    <div class="lb-track"></div>
    <div class="lb-caption"><span class="lb-count"></span></div>`;
  document.body.append(lightbox);
  const track = lightbox.querySelector(".lb-track");
  const count = lightbox.querySelector(".lb-count");
  let sources = [];
  let current = 0;
  let isOpen = false;

  function show(i, animate = true) {
    const n = sources.length;
    current = (i + n) % n;
    track.style.transition = animate ? "" : "none";
    track.style.transform = `translateX(${-current * 100}%)`;
    [current - 1, current, current + 1].forEach((k) => {
      const img = track.children[(k + n) % n]?.firstChild;
      if (img && !img.getAttribute("src")) img.src = img.dataset.src;
    });
    count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
  }

  function open(index) {
    const imgs = [
      ...document.querySelectorAll(
        ".card-page-grid-item img, .card-page-origin-visual img",
      ),
    ];
    sources = imgs.map((img) => [img.currentSrc || img.src, img.alt]);
    track.replaceChildren(
      ...sources.map(([src, alt]) => {
        const slide = document.createElement("div");
        slide.className = "lb-slide";
        const img = document.createElement("img");
        img.alt = alt;
        img.dataset.src = src;
        slide.append(img);
        return slide;
      }),
    );
    isOpen = true;
    lightbox.classList.add("visible");
    document.body.style.overflow = "hidden";
    show(index, false);
    lightbox.querySelector(".lb-close").focus();
  }

  function close() {
    isOpen = false;
    lightbox.classList.remove("visible");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (event) => {
    const img = event.target.closest?.(
      ".card-page-grid-item img, .card-page-origin-visual img",
    );
    if (!img) return;
    const all = [
      ...document.querySelectorAll(
        ".card-page-grid-item img, .card-page-origin-visual img",
      ),
    ];
    open(all.indexOf(img));
  });
  lightbox.querySelector(".lb-close").addEventListener("click", close);
  lightbox
    .querySelector(".lb-prev")
    .addEventListener("click", () => show(current - 1));
  lightbox
    .querySelector(".lb-next")
    .addEventListener("click", () => show(current + 1));
  track.addEventListener("click", (event) => {
    if (event.target === track || event.target.classList.contains("lb-slide"))
      close();
  });
  document.addEventListener("keydown", (event) => {
    if (!isOpen) return;
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") show(current - 1);
    else if (event.key === "ArrowRight") show(current + 1);
  });
  let touchX = null;
  lightbox.addEventListener(
    "touchstart",
    (event) => {
      touchX = event.touches[0].clientX;
    },
    { passive: true },
  );
  lightbox.addEventListener("touchend", (event) => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });

  const grid = document.querySelector(".card-page-grid");
  if (!grid) return;

  const fallbackCards = [
    ["Origen", "../img/logo%20manu.png"],
    ["Materia", "../img/carta2.png"],
    ["Vacío", "../img/cooper3.png"],
    ["Horizonte", "../img/ferrari.png"],
    ["Movimiento", "../img/gatoposter.png"],
  ];

  function normalizeCards(source) {
    if (!Array.isArray(source) || !source.length) {
      return fallbackCards;
    }

    return source
      .slice(0, 5)
      .map((item) => [
        item.title || "Sin título",
        item.image || item.photoId || "",
      ]);
  }

  function loadCards() {
    const customImages = Array.isArray(window.BABEL_CARD_IMAGES)
      ? window.BABEL_CARD_IMAGES
      : [];

    if (customImages.length) {
      return Promise.resolve(
        customImages.map((source, index) => [`Imagen ${index + 1}`, source]),
      );
    }

    const directCards =
      window.BABEL_CARDS || (window.parent && window.parent.BABEL_CARDS);

    if (Array.isArray(directCards) && directCards.length) {
      return Promise.resolve(normalizeCards(directCards));
    }

    const indexUrl = new URL("../index.html", window.location.href).href;

    return fetch(indexUrl)
      .then((response) => response.text())
      .then((html) => {
        const match = html.match(
          /<script id="card-data"[^>]*>\s*(\[[\s\S]*?\])\s*<\/script>/i,
        );

        if (!match || !match[1]) {
          return fallbackCards;
        }

        const parsed = JSON.parse(match[1]);
        return normalizeCards(parsed);
      })
      .catch(() => fallbackCards);
  }

  loadCards().then((cards) => {
    cards.forEach(([title, source]) => {
      const item = document.createElement("figure");
      item.className = "card-page-grid-item";
      const image = document.createElement("img");
      image.src = source;
      image.alt = title;
      image.loading = "lazy";
      item.append(image);
      grid.append(item);
    });
  });
})();
