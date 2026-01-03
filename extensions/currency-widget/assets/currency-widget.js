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
    defaultCurrency: "USD",
    baseCurrency: "USD",
    placement: "fixed",
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

  function findHeader() {
    for (const sel of HEADER_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  /* ================= HELPERS ================= */
  function detectCurrency() {
    try {
      const lang = navigator.language.toLowerCase();
      if (lang.includes("in")) return "INR";
      if (lang.includes("gb")) return "GBP";
      if (lang.includes("eu")) return "EUR";
      return "USD";
    } catch {
      return "USD";
    }
  }

  function parseAmount(text) {
    const n = parseFloat(text.replace(/[^\d.-]/g, ""));
    return isNaN(n) ? null : n;
  }

  function formatAmount(val, cur) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(val);
  }

  function findPriceNodes() {
    const set = new Set();
    PRICE_SELECTORS.forEach((q) =>
      document.querySelectorAll(q).forEach((el) => set.add(el)),
    );
    return [...set];
  }

  function followHeader(widget, header) {
    function update() {
      const r = header.getBoundingClientRect();
      widget.style.position = "fixed";
      widget.style.top = r.top + r.height / 2 + "px";
      widget.style.right = "16px";
      widget.style.transform = "translateY(-50%)";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ================= API ================= */
  async function fetchRates(base, target) {
    const key = `mlv_rate_${base}_${target}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
      const r = await fetch(
        `${API_HOST}/api/rates?base=${base}&symbols=${target}`,
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
        `${API_HOST}/api/storefront-settings?shop=${encodeURIComponent(SHOP)}`,
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
      const val = parseAmount(el.dataset.orig);
      if (val !== null) {
        el.textContent = formatAmount(val * rate, cur);
      }
    });
  }

  /* ================= UI ================= */
  function injectCSS() {
    if (document.getElementById("__mlv_css")) return;

    const style = document.createElement("style");
    style.id = "__mlv_css";
    style.textContent = `
#${PICK} {
  position: fixed;
  z-index: 2147483647;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 6px;
}


#${MENU} {
  position: fixed;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  display: none;
  z-index: 2147483646;
}


#${MENU} div {
  padding: 10px 16px;
  cursor: pointer;
}


#${MENU} div:hover {
  background: #f2f2f2;
}
`;
    document.head.appendChild(style);
  }

  function placeFixed(el, s) {
    el.style.position = "fixed";
    el.style.top = "";
    el.style.bottom = "";
    el.style.left = "";
    el.style.right = "";

    if (s.fixedCorner?.includes("top")) {
      el.style.top = (s.distanceTop ?? 16) + "px";
    } else {
      el.style.bottom = (s.distanceBottom ?? 16) + "px";
    }

    if (s.fixedCorner?.includes("right")) {
      el.style.right = (s.distanceRight ?? 16) + "px";
    } else {
      el.style.left = (s.distanceLeft ?? 16) + "px";
    }
  }

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

    settings.selectedCurrencies.forEach((c) => {
      const item = document.createElement("div");
      item.textContent = c;
      item.onclick = async (e) => {
        e.stopPropagation();
        localStorage.setItem(KEY, c);
        w.children[0].textContent = c;
        m.style.display = "none";
        m.remove();
        await convertPrices(c, settings);
      };
      m.appendChild(item);
    });

    if (settings.placement === "inline") {
      const header = findHeader();
      if (header) {
        w.style.position = "relative"; // IMPORTANT
        w.style.top = "auto";
        w.style.right = "auto";
        w.style.transform = "none";
        header.appendChild(w);
      } else {
        placeFixed(w, settings);
        document.body.appendChild(w);
      }
    } else {
      placeFixed(w, settings);
      document.body.appendChild(w);
    }

    w.onclick = (e) => {
      e.stopPropagation();
      m.style.display = "block";

      if (settings.placement === "inline") {
        m.style.position = "absolute";
        m.style.top = "100%";
        m.style.left = "0";
        w.appendChild(m);
        return;
      }

      const r = w.getBoundingClientRect();
      const openUp = r.bottom + 220 > window.innerHeight;

      m.style.position = "fixed";
      m.style.left = r.left + "px";
      m.style.top = openUp ? "auto" : r.bottom + 6 + "px";
      m.style.bottom = openUp ? window.innerHeight - r.top + 6 + "px" : "auto";
      document.body.appendChild(m);
    };

    m.addEventListener("click", (e) => e.stopPropagation());

    document.addEventListener("click", () => {
      if (m.parentNode) {
        m.style.display = "none";
        m.remove();
      }
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
