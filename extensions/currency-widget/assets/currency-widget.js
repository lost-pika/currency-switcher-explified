(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const API_HOST = "https://currency-switcher-explified.vercel.app";
  const PICK = "__mlv_currency_picker_v2";
  const MENU = "__mlv_currency_menu_v2";
  const KEY = "mlv_currency_choice_v2";

  const FALLBACK_SETTINGS = {
    selectedCurrencies: ["USD", "EUR", "INR"],
    defaultCurrency: "INR",
    baseCurrency: "USD",
    placement: "Fixed Position",
    fixedCorner: "top-right",
    distanceTop: 16,
    distanceRight: 16,
    distanceBottom: 16,
    distanceLeft: 16,
  };

  const SHOP =
    window.__MLV_SHOP__ ||
    (window.Shopify && window.Shopify.shop) ||
    window.location.hostname;

  /* ================= API ================= */

  async function loadSettings() {
    try {
      const res = await fetch(
        `${API_HOST}/api/storefront-settings?shop=${encodeURIComponent(SHOP)}`
      );
      const json = await res.json();
      return json?.settings || FALLBACK_SETTINGS;
    } catch {
      return FALLBACK_SETTINGS;
    }
  }

  /* ================= DOM ================= */

  function createPicker(settings) {
    // cleanup
    document.getElementById(PICK)?.remove();
    document.getElementById(MENU)?.remove();

    const saved =
      localStorage.getItem(KEY) || settings.defaultCurrency;

    /* ---------- Picker Button ---------- */
    const w = document.createElement("div");
    w.id = PICK;
    w.textContent = saved;
    Object.assign(w.style, {
      padding: "10px 32px 10px 14px",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "8px",
      cursor: "pointer",
      zIndex: 2147483647,
      position: "fixed",
      fontFamily: "system-ui, sans-serif",
      fontWeight: "500",
      fontSize: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,.12)",
    });

    /* ---------- Placement (DB ONLY) ---------- */
    if (
      settings.fixedCorner === "top-left" ||
      settings.fixedCorner === "top-right"
    ) {
      w.style.top = settings.distanceTop + "px";
    } else {
      w.style.bottom = settings.distanceBottom + "px";
    }

    if (
      settings.fixedCorner === "top-right" ||
      settings.fixedCorner === "bottom-right"
    ) {
      w.style.right = settings.distanceRight + "px";
    } else {
      w.style.left = settings.distanceLeft + "px";
    }

    /* ---------- Dropdown Menu ---------- */
    const m = document.createElement("div");
    m.id = MENU;
    Object.assign(m.style, {
      position: "fixed",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "6px",
      boxShadow: "0 8px 24px rgba(0,0,0,.15)",
      display: "none",
      zIndex: 2147483646,
      minWidth: "140px",
      fontFamily: "system-ui, sans-serif",
    });

    settings.selectedCurrencies.forEach((cur) => {
      const item = document.createElement("div");
      item.textContent = cur;
      Object.assign(item.style, {
        padding: "10px 14px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
      });

      item.onmouseenter = () =>
        (item.style.background = "#f2f2f2");
      item.onmouseleave = () =>
        (item.style.background = "#fff");

      item.onclick = (e) => {
        e.stopPropagation();
        localStorage.setItem(KEY, cur);
        w.textContent = cur;
        m.style.display = "none";
      };

      m.appendChild(item);
    });

    /* ---------- Toggle Logic ---------- */
    w.onclick = (e) => {
      e.stopPropagation();
      const r = w.getBoundingClientRect();
      m.style.left = r.left + "px";
      m.style.top = r.bottom + 6 + "px";
      m.style.display =
        m.style.display === "block" ? "none" : "block";
    };

    document.addEventListener("click", () => {
      m.style.display = "none";
    });

    document.body.appendChild(w);
    document.body.appendChild(m);
  }

  /* ================= INIT ================= */

  async function init() {
    const settings = await loadSettings();
    console.log("✅ DB settings used:", settings);
    createPicker(settings);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
