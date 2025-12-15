(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const TTL = 1000 * 60 * 15;
  const SEL = [
    "[data-price]",
    ".price",
    ".product__price",
    ".cart__price",
    "span.money",
  ];

  const PICK = "__mlv_currency_picker_v2";
  const KEY = "mlv_currency_choice_v2";

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

  function detect() {
    try {
      const lang =
        (navigator.languages && navigator.languages[0]) ||
        navigator.language ||
        "en-US";
      const l = lang.toLowerCase();

      if (l.includes("in")) return "INR";
      if (l.includes("gb")) return "GBP";
      if (l.includes("eu")) return "EUR";
      if (l.includes("jp")) return "JPY";
      return "USD";
    } catch {
      return "USD";
    }
  }

  function parseNum(s) {
    if (!s) return null;
    const c = s.replace(/[^\d.,-]/g, "");
    if (!c) return null;
    const v = parseFloat(c.replace(/,/g, ""));
    return isNaN(v) ? null : v;
  }

  function fmt(v, cur) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: cur,
        maximumFractionDigits: 2,
      }).format(v);
    } catch {
      return cur + " " + v.toFixed(2);
    }
  }

  function appOrigin() {
    return window.location.origin;
  }

  /* ================= API ================= */

  async function fetchRates(base, targets) {
    const key = `rates_${base}_${targets.join(",")}`;
    const cached = sget(key);
    if (cached) return cached;

    const url = `${appOrigin()}/apps/currency-switcher/api/rates?base=${base}&symbols=${targets.join(",")}`;
    const r = await fetch(url);
    if (!r.ok) return null;

    const j = await r.json();
    if (!j || !j.rates) return null;

    sset(key, j.rates);
    return j.rates;
  }

  async function loadSettings() {
    try {
      const shop =
        window.__MLV_SHOP__ ||
        Shopify?.shop ||
        window.location.hostname;

      const url = `${appOrigin()}/apps/currency-switcher/api/merchant-settings?shop=${encodeURIComponent(
        shop,
      )}`;

      const r = await fetch(url);
      if (!r.ok) return null;

      return await r.json();
    } catch {
      return null;
    }
  }

  /* ================= DOM ================= */

  function findNodes() {
    const s = new Set();
    SEL.forEach((q) =>
      document.querySelectorAll(q).forEach((e) => s.add(e)),
    );
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

  /* ================= STYLES ================= */

  function injectCSS() {
    if (document.getElementById("__mlv_css")) return;

    const css = `
#${PICK}{
  position:fixed;
  z-index:2147483647;
  font-family:system-ui;
}
#${PICK} button{
  padding:8px 28px 8px 12px; /* ⬅️ GAP BETWEEN TEXT & ARROW */
  border-radius:10px;
  border:1px solid rgba(0,0,0,.15);
  background:#fff;
  cursor:pointer;
  position:relative;
  font-weight:500;
}
#${PICK} button::after{
  content:"▾";
  position:absolute;
  right:10px;
  top:50%;
  transform:translateY(-50%);
}
[data-mlv-menu]{
  position:fixed;
  background:#fff;
  border-radius:8px;
  border:1px solid rgba(0,0,0,.15);
  box-shadow:0 12px 30px rgba(0,0,0,.12);
  display:none;
  z-index:2147483647;
}
[data-mlv-menu] div{
  padding:8px 12px;
  cursor:pointer;
}
[data-mlv-menu] div:hover{
  background:#f2f2f2;
}`;
    const s = document.createElement("style");
    s.id = "__mlv_css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ================= PICKER ================= */

  function applyPlacement(el, st) {
    const corner = st?.fixedCorner || "top-right"; // ✅ DEFAULT FIX
    const t = st?.distanceTop ?? 16;
    const r = st?.distanceRight ?? 16;
    const b = st?.distanceBottom ?? 16;
    const l = st?.distanceLeft ?? 16;

    el.style.top = corner.includes("top") ? `${t}px` : "auto";
    el.style.bottom = corner.includes("bottom") ? `${b}px` : "auto";
    el.style.right = corner.includes("right") ? `${r}px` : "auto";
    el.style.left = corner.includes("left") ? `${l}px` : "auto";
  }

  function createPicker(st, cur, onSel) {
    document.getElementById(PICK)?.remove();

    const w = document.createElement("div");
    w.id = PICK;

    const b = document.createElement("button");
    b.textContent = cur;

    const m = document.createElement("div");
    m.setAttribute("data-mlv-menu", "");

    (st?.selectedCurrencies || [cur]).forEach((c) => {
      const d = document.createElement("div");
      d.textContent = c;
      d.onclick = (e) => {
        e.stopPropagation();
        m.style.display = "none";
        b.textContent = c;
        onSel(c);
      };
      m.appendChild(d);
    });

    b.onclick = (e) => {
      e.stopPropagation();
      const r = b.getBoundingClientRect();
      m.style.display = "block";
      m.style.left = `${r.left}px`;
      m.style.top = `${r.bottom + 8}px`;
      m.style.minWidth = `${r.width}px`;
    };

    document.addEventListener("click", () => (m.style.display = "none"));

    w.appendChild(b);
    document.body.appendChild(w);
    document.body.appendChild(m);

    applyPlacement(w, st);
  }

  /* ================= MAIN ================= */

  async function runFor(cur, st) {
    const base = st?.baseCurrency || "USD";
    if (cur === base) {
      findNodes().forEach(revertEl);
      return;
    }

    const rates = await fetchRates(base, [cur]);
    if (!rates || !rates[cur]) return;

    findNodes().forEach((e) => convertEl(e, rates[cur], cur));
  }

  async function init() {
    injectCSS();

    const st = (await loadSettings()) || {};
    const detected = detect();
    const def = st.defaultCurrency || detected;

    const saved = localStorage.getItem(KEY) || def;

    createPicker(st, saved, async (c) => {
      localStorage.setItem(KEY, c);
      await runFor(c, st);
    });

    await runFor(saved, st);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
