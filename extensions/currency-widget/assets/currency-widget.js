(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const API_HOST = "https://currency-switcher-explified.vercel.app";
  const PICK = "__mlv_currency_picker_v2";
  const MENU = "__mlv_currency_menu_v2";
  const KEY = "mlv_currency_choice_v2";
  const TTL = 1000 * 60 * 15;

  const PRICE_SELECTORS = [
    "[data-price]",
    ".price",
    ".product__price",
    ".cart__price",
    "span.money",
    ".price-item--regular",
    ".price-item--sale",
    ".cart-item__price",
  ];

  const FALLBACK_SETTINGS = {
    selectedCurrencies: ["USD", "EUR", "INR"],
    defaultCurrency: "INR",
    baseCurrency: "USD",
    placement: "fixed", // fixed | inline | hidden
    fixedCorner: "bottom-right",
    distanceTop: 16,
    distanceRight: 16,
    distanceBottom: 16,
    distanceLeft: 16,
  };

  const SHOP =
    window.__MLV_SHOP__ ||
    (window.Shopify && window.Shopify.shop) ||
    window.location.hostname;

  const HEADER_SELECTORS = [
    "header",
    ".header",
    ".site-header",
    "#shopify-section-header",
  ];

  /* ================= STORAGE ================= */
  const now = () => Date.now();

  function cacheSet(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify({ v, x: now() + TTL }));
    } catch {}
  }

  function cacheGet(k) {
    try {
      const r = JSON.parse(localStorage.getItem(k));
      if (!r || now() > r.x) return null;
      return r.v;
    } catch {
      return null;
    }
  }

  /* ================= HELPERS ================= */
  function findHeader() {
    for (const sel of HEADER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function detectCurrency() {
    try {
      const l = navigator.language.toLowerCase();
      if (l.includes("in")) return "INR";
      if (l.includes("gb")) return "GBP";
      if (l.includes("eu")) return "EUR";
      return "USD";
    } catch {
      return "USD";
    }
  }

  function parseAmount(text) {
    const n = parseFloat(text.replace(/[^\d.-]/g, ""));
    return isNaN(n) ? null : n;
  }

  function formatAmount(v, c) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 2,
    }).format(v);
  }

  function findPriceNodes() {
    const set = new Set();
    PRICE_SELECTORS.forEach((q) =>
      document.querySelectorAll(q).forEach((el) => set.add(el))
    );
    return [...set];
  }

  /* ================= API ================= */
  async function fetchRates(base, target) {
    const key = `mlv_rate_${base}_${target}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
      const r = await fetch(
        `${API_HOST}/api/rates?base=${base}&symbols=${target}`
      );
      const j = await r.json();
      if (j?.rates?.[target]) {
        cacheSet(key, j.rates[target]);
        return j.rates[target];
      }
    } catch {}
    return null;
  }

  async function loadSettings() {
    try {
      const r = await fetch(
        `${API_HOST}/api/storefront-settings?shop=${encodeURIComponent(SHOP)}`
      );
      const j = await r.json();
      return j?.settings || FALLBACK_SETTINGS;
    } catch {
      return FALLBACK_SETTINGS;
    }
  }

  /* ================= CONVERSION ================= */
  async function convertPrices(cur, settings) {
    const base = settings.baseCurrency;

    if (cur === base) {
      findPriceNodes().forEach((el) => {
        if (el.dataset.orig) el.textContent = el.dataset.orig;
      });
      return;
    }

    const rate = await fetchRates(base, cur);
    if (!rate) return;

    findPriceNodes().forEach((el) => {
      if (!el.dataset.orig) el.dataset.orig = el.textContent.trim();
      const v = parseAmount(el.dataset.orig);
      if (v !== null) el.textContent = formatAmount(v * rate, cur);
    });
  }

  /* ================= UI ================= */
  function injectCSS() {
    if (document.getElementById("__mlv_css")) return;

    const s = document.createElement("style");
    s.id = "__mlv_css";
    s.textContent = `
#${PICK} {
  z-index: 2147483647;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

#${MENU} {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: none;
}

#${MENU} div {
  padding: 10px 16px;
  cursor: pointer;
}
#${MENU} div:hover { background: #f2f2f2; }
`;
    document.head.appendChild(s);
  }

  /* ================= WIDGET ================= */
  function createWidget(settings) {
    document.getElementById(PICK)?.remove();
    document.getElementById(MENU)?.remove();

    if (settings.placement === "hidden") return;

    const saved =
      localStorage.getItem(KEY) || settings.defaultCurrency || detectCurrency();

    const w = document.createElement("div");
    w.id = PICK;
    w.innerHTML = `<span>${saved}</span><span>▾</span>`;

    const m = document.createElement("div");
    m.id = MENU;

    let menuOpen = false;

    function closeMenu() {
      if (!menuOpen) return;
      menuOpen = false;
      m.style.display = "none";
      m.remove();
    }

    document.addEventListener("pointerdown", (e) => {
      if (!w.contains(e.target)) closeMenu();
    });

    settings.selectedCurrencies.forEach((c) => {
      const item = document.createElement("div");
      item.textContent = c;
      item.onclick = async (e) => {
        e.stopPropagation();
        localStorage.setItem(KEY, c);
        w.children[0].textContent = c;
        closeMenu();
        await convertPrices(c, settings);
      };
      m.appendChild(item);
    });

    /* ---------- PLACEMENT ---------- */
    if (settings.placement === "inline") {
      const header = findHeader();
      if (header) {
        w.style.position = "absolute";
        w.style.right = "16px";
        w.style.top = "50%";
        w.style.transform = "translateY(-50%)";
        header.style.position ||= "relative";
        header.appendChild(w);
      }
    } else {
      w.style.position = "fixed";
      w.style.bottom = (settings.distanceBottom ?? 16) + "px";
      w.style.right = (settings.distanceRight ?? 16) + "px";
      document.body.appendChild(w);
    }

    /* ---------- MENU TOGGLE ---------- */
    w.addEventListener("pointerdown", (e) => {
      e.stopPropagation();

      if (menuOpen) {
        closeMenu();
        return;
      }

      menuOpen = true;
      m.style.display = "block";

      if (settings.placement === "inline") {
        m.style.position = "absolute";
        m.style.top = "100%";
        m.style.left = "0";
        w.appendChild(m);
        return;
      }

      const r = w.getBoundingClientRect();
      m.style.position = "fixed";
      m.style.left = r.left + "px";
      m.style.top = r.bottom + 6 + "px";
      document.body.appendChild(m);
    });

    convertPrices(saved, settings);
  }

  /* ================= INIT ================= */
  async function init() {
    injectCSS();
    const settings = await loadSettings();
    createWidget(settings);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
