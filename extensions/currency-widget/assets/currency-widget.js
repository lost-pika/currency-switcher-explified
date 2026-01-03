(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const API_HOST = "https://currency-switcher-explified.vercel.app";
  const PICK = "__mlv_currency_picker_v2";
  const MENU = "__mlv_currency_menu_v2";
  const KEY = "mlv_currency_choice_v2";
  const TTL = 1000 * 60 * 15;

  const SEL = [
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

  /* ================= UTILS ================= */

  const now = () => Date.now();

  function sset(k, v, ttl = TTL) {
    try {
      localStorage.setItem(k, JSON.stringify({ v, x: now() + ttl }));
    } catch {}
  }

  function sget(k) {
    try {
      const r = localStorage.getItem(k);
      if (!r) return null;
      const o = JSON.parse(r);
      if (!o || now() > o.x) {
        localStorage.removeItem(k);
        return null;
      }
      return o.v;
    } catch {
      return null;
    }
  }

  function parseNum(s) {
    const c = s.replace(/[^\d.,-]/g, "");
    const v = parseFloat(c.replace(/,/g, ""));
    return isNaN(v) ? null : v;
  }

  function fmt(v, cur) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(v);
  }

  function findNodes() {
    const s = new Set();
    SEL.forEach((q) => document.querySelectorAll(q).forEach((e) => s.add(e)));
    return [...s];
  }

  function convertEl(el, rate, cur) {
    if (!el.dataset.orig) el.dataset.orig = el.textContent.trim();
    const n = parseNum(el.dataset.orig);
    if (n === null) return;
    el.textContent = fmt(n * rate, cur);
  }

  function revertEl(el) {
    if (el.dataset.orig) el.textContent = el.dataset.orig;
  }

  /* ================= API ================= */

  async function fetchRates(base, target) {
    const key = `rates_${base}_${target}`;
    const cached = sget(key);
    if (cached) return cached;

    const res = await fetch(
      `${API_HOST}/api/rates?base=${base}&symbols=${target}`
    );
    const json = await res.json();
    const rate = json?.rates?.[target];

    if (rate) sset(key, rate);
    return rate;
  }

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

  /* ================= PICKER ================= */

  async function createPicker(settings) {
    document.getElementById(PICK)?.remove();
    document.getElementById(MENU)?.remove();

    const saved =
      localStorage.getItem(KEY) || settings.defaultCurrency;

    /* ---------- BUTTON ---------- */
    const w = document.createElement("div");
    w.id = PICK;
    w.innerHTML = `
      <span>${saved}</span>
      <span class="mlv-arrow">▾</span>
    `;

    Object.assign(w.style, {
      padding: "10px 32px 10px 14px",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "8px",
      cursor: "pointer",
      position: "fixed",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: "500",
      fontSize: "14px",
      zIndex: 2147483647,
      boxShadow: "0 2px 8px rgba(0,0,0,.12)",
    });

    const arrow = w.querySelector(".mlv-arrow");

    /* ---------- DB POSITION ---------- */
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

    /* ---------- MENU ---------- */
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
    });

    settings.selectedCurrencies.forEach((cur) => {
      const d = document.createElement("div");
      d.textContent = cur;
      Object.assign(d.style, {
        padding: "10px 14px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
      });

      d.onclick = async (e) => {
        e.stopPropagation();
        localStorage.setItem(KEY, cur);
        w.firstChild.textContent = cur;
        m.style.display = "none";
        arrow.textContent = "▾";

        if (cur === settings.baseCurrency) {
          findNodes().forEach(revertEl);
          return;
        }

        const rate = await fetchRates(settings.baseCurrency, cur);
        findNodes().forEach((el) => convertEl(el, rate, cur));
      };

      m.appendChild(d);
    });

    /* ---------- TOGGLE + DIRECTION ---------- */
    w.onclick = (e) => {
      e.stopPropagation();

      const r = w.getBoundingClientRect();
      const openUp = window.innerHeight - r.bottom < 200;

      m.style.left = r.left + "px";

      if (openUp) {
        m.style.top = "auto";
        m.style.bottom = window.innerHeight - r.top + 6 + "px";
        arrow.textContent = "▴";
      } else {
        m.style.bottom = "auto";
        m.style.top = r.bottom + 6 + "px";
        arrow.textContent = "▾";
      }

      m.style.display = m.style.display === "block" ? "none" : "block";
    };

    document.addEventListener("click", () => {
      m.style.display = "none";
      arrow.textContent = "▾";
    });

    document.body.appendChild(w);
    document.body.appendChild(m);

    // initial conversion
    if (saved !== settings.baseCurrency) {
      const rate = await fetchRates(settings.baseCurrency, saved);
      findNodes().forEach((el) => convertEl(el, rate, saved));
    }
  }

  /* ================= INIT ================= */

  async function init() {
    const settings = await loadSettings();
    console.log("✅ DB settings used:", settings);
    createPicker(settings);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
