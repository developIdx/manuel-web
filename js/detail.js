(() => {
  "use strict";

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
