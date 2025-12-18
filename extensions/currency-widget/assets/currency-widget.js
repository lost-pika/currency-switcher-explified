function createPicker(st, cur, onSel) {
  document.getElementById(PICK)?.remove();
  document.querySelector("[data-mlv-menu]")?.remove();

  // Merge: DB settings + theme editor settings
  const themeSettings = window.__MLV_THEME_SETTINGS__ || {};
  const mergedSettings = {
    ...st,
    placement: themeSettings.placement || st?.placement,
    fixedCorner: themeSettings.fixedCorner || st?.fixedCorner,
    distanceTop: themeSettings.distanceTop !== undefined ? themeSettings.distanceTop : st?.distanceTop,
    distanceRight: themeSettings.distanceRight !== undefined ? themeSettings.distanceRight : st?.distanceRight,
    distanceBottom: themeSettings.distanceBottom !== undefined ? themeSettings.distanceBottom : st?.distanceBottom,
    distanceLeft: themeSettings.distanceLeft !== undefined ? themeSettings.distanceLeft : st?.distanceLeft,
  };

  console.log("🔗 Merged settings (DB + Theme):", mergedSettings);

  const w = document.createElement("div");
  w.id = PICK;

  const b = document.createElement("button");
  b.textContent = cur;
  b.title = "Switch currency";

  const m = document.createElement("div");
  m.setAttribute("data-mlv-menu", "");

  (mergedSettings?.selectedCurrencies || FALLBACK_SETTINGS.selectedCurrencies).forEach(
    (c) => {
      const d = document.createElement("div");
      d.textContent = c;
      d.style.cursor = "pointer";
      d.onclick = (e) => {
        e.stopPropagation();
        m.style.display = "none";
        b.textContent = c;
        onSel(c);
      };
      m.appendChild(d);
    },
  );

  b.onclick = (e) => {
    e.stopPropagation();
    const r = b.getBoundingClientRect();
    m.style.display = m.style.display === "none" ? "block" : "none";
    m.style.left = `${r.left}px`;
    m.style.top = `${r.bottom + 4}px`;
  };

  document.addEventListener("click", () => (m.style.display = "none"));

  w.appendChild(b);

  if (mergedSettings?.placement === "Inline with the header") {
    const header =
      document.querySelector("header") ||
      document.querySelector(".site-header") ||
      document.querySelector("#shopify-section-header");

    if (header) {
      if (!header.style.position || header.style.position === "static") {
        header.style.position = "relative";
      }
      w.style.position = "absolute";
      w.style.top = `${mergedSettings.distanceTop ?? 16}px`;
      w.style.right = `${mergedSettings.distanceRight ?? 16}px`;
      header.appendChild(w);
    } else {
      w.style.position = "fixed";
      w.style.top = `${mergedSettings.distanceTop ?? 16}px`;
      w.style.right = `${mergedSettings.distanceRight ?? 16}px`;
      document.body.appendChild(w);
    }
  } else if (mergedSettings?.placement === "Fixed Position") {
    w.style.position = "fixed";
    w.style.top = "auto";
    w.style.left = "auto";
    w.style.bottom = `${mergedSettings.distanceBottom ?? 16}px`;
    w.style.right = `${mergedSettings.distanceRight ?? 16}px`;
    document.body.appendChild(w);
  } else if (mergedSettings?.placement === "Don't show at all") {
    w.style.display = "none";
    document.body.appendChild(w);
  } else {
    w.style.position = "fixed";
    w.style.top = `${mergedSettings.distanceTop ?? 16}px`;
    w.style.right = `${mergedSettings.distanceRight ?? 16}px`;
    document.body.appendChild(w);
  }

  document.body.appendChild(m);
}
