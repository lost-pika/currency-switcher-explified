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
    selectedCurrencies: ["USD", "EUR", "INR", "AUD"],
    defaultCurrency: "INR",
    baseCurrency: "USD",
    placement: "Fixed Position",
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

  // ✅ RESTORE ORIGINAL PRICES WHEN BASE CURRENCY
  if (cur === base) {
    findPriceNodes().forEach((el) => {
      if (el.dataset.orig) {
        el.textContent = el.dataset.orig;
      }
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

  function place(el, s) {
    if (s.fixedCorner.includes("top")) {
      el.style.top = s.distanceTop + "px";
      el.style.bottom = "auto";
    } else {
      el.style.bottom = s.distanceBottom + "px";
      el.style.top = "auto";
    }

    if (s.fixedCorner.includes("right")) {
      el.style.right = s.distanceRight + "px";
      el.style.left = "auto";
    } else {
      el.style.left = s.distanceLeft + "px";
      el.style.right = "auto";
    }
  }

  function createWidget(settings) {
    document.getElementById(PICK)?.remove();
    document.getElementById(MENU)?.remove();

    const saved =
      localStorage.getItem(KEY) ||
      settings.defaultCurrency ||
      detectCurrency();

    const w = document.createElement("div");
    w.id = PICK;
    w.innerHTML = `<span>${saved}</span><span>▾</span>`;
    place(w, settings);

    const m = document.createElement("div");
    m.id = MENU;

    settings.selectedCurrencies.forEach((c) => {
      const item = document.createElement("div");
      item.textContent = c;
      item.onclick = async () => {
        localStorage.setItem(KEY, c);
        w.children[0].textContent = c;
        m.style.display = "none";
        await convertPrices(c, settings);
      };
      m.appendChild(item);
    });

    w.onclick = (e) => {
      e.stopPropagation();
      const r = w.getBoundingClientRect();
      const openUp = r.bottom + 200 > window.innerHeight;

      m.style.display = "block";
      m.style.left = r.left + "px";
      m.style.top = openUp ? "auto" : r.bottom + 6 + "px";
      m.style.bottom = openUp
        ? window.innerHeight - r.top + 6 + "px"
        : "auto";
    };

    document.addEventListener("click", () => (m.style.display = "none"));

    document.body.appendChild(w);
    document.body.appendChild(m);

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
