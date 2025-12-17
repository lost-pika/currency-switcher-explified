(function () {
  "use strict";

  /* ================= CONFIG ================= */
  const API_BASE = window.location.origin;
  const TTL = 1000 * 60 * 15; // 15 min cache

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

  /* ================= API CALLS ================= */

  async function fetchRates(base, targets) {
    const key = `rates_${base}_${targets.join(",")}`;
    const cached = sget(key);
    if (cached) {
      console.log("📦 Using cached rates");
      return cached;
    }

    const url = `${API_BASE}/apps/currency-switcher/api/rates?base=${base}&symbols=${targets.join(",")}`;
    console.log("📊 Fetching rates from:", url);

    try {
      const r = await fetch(url);
      if (!r.ok) {
        console.error("❌ rates fetch failed", r.status, r.statusText);
        return null;
      }

      const j = await r.json();
      console.log("✅ rates response:", j);

      if (!j || !j.rates) {
        console.error("❌ invalid rates payload", j);
        return null;
      }

      sset(key, j.rates);
      return j.rates;
    } catch (err) {
      console.error("❌ rates fetch error:", err);
      return null;
    }
  }

  async function loadSettings() {
    try {
      const shop =
        window.__SHOP__ ||
        (window.Shopify && window.Shopify.shop) ||
        window.location.hostname;

      console.log("🏪 Shop:", shop);

      const url = `${API_BASE}/apps/currency-switcher/api/settings?shop=${encodeURIComponent(
        shop,
      )}`;
      console.log("🔗 Loading settings from:", url);

      const r = await fetch(url);
      if (!r.ok) {
        console.warn("⚠️ settings fetch failed", r.status, "using defaults");
        return null;
      }

      const data = await r.json();
      console.log("✅ settings loaded:", data);

      return {
        selectedCurrencies: data.selectedCurrencies || [
          "USD",
          "EUR",
          "INR",
          "CAD",
        ],
        defaultCurrency: data.defaultCurrency || "INR",
        baseCurrency: data.baseCurrency || "USD",
        placement: data.placement || "Fixed Position",
        fixedCorner: data.fixedCorner || "bottom-right",
        distanceTop: data.distanceTop ?? 16,
        distanceRight: data.distanceRight ?? 16,
        distanceBottom: data.distanceBottom ?? 16,
        distanceLeft: data.distanceLeft ?? 16,
      };
    } catch (err) {
      console.error("❌ settings load error:", err);
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
    console.log("🔍 Original text:", el.dataset.orig);
    const n = parseNum(el.dataset.orig);
    if (n === null) {
      console.warn("⚠️ Could not parse number from:", el.dataset.orig);
      return;
    }
    const converted = fmt(n * rate, cur);
    console.log(`💱 ${el.dataset.orig} * ${rate} = ${converted}`);
    el.textContent = converted;
  }

  function revertEl(el) {
    if (el.dataset.orig) el.textContent = el.dataset.orig;
  }

  /* ================= STYLES ================= */

  function injectCSS() {
    if (document.getElementById("__mlv_css")) return;

    const css = `
#${PICK} {
  position: fixed;
  z-index: 2147483647;
  font-family: system-ui, -apple-system, sans-serif;
  bottom: 16px;
  right: 16px;
}

#${PICK} button {
  padding: 10px 32px 10px 14px;
  border-radius: 8px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

#${PICK} button:hover {
  background: #f8f8f8;
}

#${PICK} button::after {
  content: "▾";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

[data-mlv-menu] {
  position: fixed;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ddd;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: none;
  z-index: 2147483646;
  min-width: 160px;
}

[data-mlv-menu] div {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid #eee;
}

[data-mlv-menu] div:last-child {
  border-bottom: none;
}

[data-mlv-menu] div:hover {
  background: #f2f2f2;
}`;
    const s = document.createElement("style");
    s.id = "__mlv_css";
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ================= PICKER ================= */

  function createPicker(st, cur, onSel) {
    document.getElementById(PICK)?.remove();
    document.querySelector("[data-mlv-menu]")?.remove();

    const w = document.createElement("div");
    w.id = PICK;

    const b = document.createElement("button");
    b.textContent = cur;
    b.title = "Switch currency";

    const m = document.createElement("div");
    m.setAttribute("data-mlv-menu", "");

    (st?.selectedCurrencies || ["USD", "EUR", "INR", "CAD"]).forEach((c) => {
      const d = document.createElement("div");
      d.textContent = c;
      d.style.cursor = "pointer";
      d.onclick = (e) => {
        e.stopPropagation();
        m.style.display = "none";
        b.textContent = c;
        console.log("💱 Currency selected:", c);
        onSel(c);
      };
      m.appendChild(d);
    });

    b.onclick = (e) => {
      e.stopPropagation();
      const r = b.getBoundingClientRect();
      m.style.display = m.style.display === "none" ? "block" : "none";
      m.style.left = `${r.left}px`;
      m.style.top = `${r.bottom + 4}px`;
    };

    document.addEventListener("click", () => (m.style.display = "none"));

    w.appendChild(b);
    document.body.appendChild(w);
    document.body.appendChild(m);

    if (st?.placement === "Fixed Position") {
      w.style.position = "fixed";
      w.style.bottom = `${st.distanceBottom || 16}px`;
      w.style.right = `${st.distanceRight || 16}px`;
      w.style.top = "auto";
      w.style.left = "auto";
    }
  }

  /* ================= MAIN ================= */

  async function runFor(cur, st) {
    const base = st?.baseCurrency || "USD";
    console.log(`🔄 Converting to ${cur} (base: ${base})`);

    if (cur === base) {
      console.log("✅ Reverting to base currency");
      findNodes().forEach(revertEl);
      return;
    }

    const rates = await fetchRates(base, [cur]);
    if (!rates || !rates[cur]) {
      console.error(`❌ No rate for ${cur}`, rates);
      return;
    }

    console.log(`✅ Got rate for ${cur}:`, rates[cur]);
    findNodes().forEach((e) => convertEl(e, rates[cur], cur));
  }

  async function init() {
    console.log("🚀 Initializing currency widget...");
    injectCSS();

    const st = (await loadSettings()) || {
      selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
      defaultCurrency: "INR",
      baseCurrency: "USD",
    };

    console.log("⚙️ Settings loaded:", st);

    const detected = detect();
    const def = st.defaultCurrency || detected;
    const saved = localStorage.getItem(KEY) || def;

    console.log(`🎯 Detected: ${detected}, Default: ${def}, Saved: ${saved}`);

    createPicker(st, saved, async (c) => {
      localStorage.setItem(KEY, c);
      await runFor(c, st);
    });

    await runFor(saved, st);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
