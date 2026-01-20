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
    inlineSide: "right",
  };

  const SHOP =
    window.__MLV_SHOP__ ||
    (window.Shopify && window.Shopify.shop) ||
    window.location.hostname;

  const HEADER_SELECTORS = [
    ".header__icons",
    ".header__inline-menu",
    "#shopify-section-header header",
    "header",
    ".header",
    ".site-header",
  ];

  let __MLV_WIDGET_INITED__ = false;

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
    console.log(
      "🔎 [findHeader] Starting search with selectors:",
      HEADER_SELECTORS,
    );

    for (const sel of HEADER_SELECTORS) {
      const el = document.querySelector(sel);
      console.log(
        `🔎 [findHeader] Selector "${sel}":`,
        el ? "FOUND" : "NOT FOUND",
        el?.offsetParent !== null ? "(visible)" : "(hidden)",
      );
      if (el && el.offsetParent !== null) {
        console.log(
          "🔎 [findHeader] Returning header:",
          el.tagName,
          el.className,
        );
        return el;
      }
    }

    console.log(
      "🔎 [findHeader] No header found! Checking all header-like elements...",
    );
    const allHeaders = document.querySelectorAll(
      "header, nav, [role='banner']",
    );
    console.log("🔎 [findHeader] Found these elements:", allHeaders.length);
    allHeaders.forEach((h, i) => {
      console.log(`  [${i}]`, h.tagName, h.className, h.id);
    });

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
      const url = `${API_HOST}/api/storefront-settings?shop=${encodeURIComponent(
        SHOP,
      )}`;
      console.log("🌐 [loadSettings] Fetching from:", url);

      const r = await fetch(url);
      const j = await r.json();

      console.log(
        "🌐 [loadSettings] Raw response:",
        JSON.stringify(j, null, 2),
      );

      // ✅ WORKAROUND: Merge API response with defaults to fill missing fields
      const result = {
        ...FALLBACK_SETTINGS,
        ...(j?.settings || {}),
      };
      console.log(
        "🌐 [loadSettings] Merged result (with defaults):",
        JSON.stringify(result, null, 2),
      );

      return result;
    } catch (err) {
      console.log("🌐 [loadSettings] Error:", err);
      return FALLBACK_SETTINGS;
    }
  }

  /* ================= CONVERSION ================= */
  async function convertPrices(cur, settings) {
    const base = settings.baseCurrency;
    const nodes = findPriceNodes();

    // RESTORE BASE CURRENCY
    if (cur === base) {
      nodes.forEach((el) => {
        if (el.dataset.origAmount) {
          const val = parseFloat(el.dataset.origAmount);
          el.textContent = formatAmount(val, base);
        }
      });
      return;
    }

    // GET RATE
    const rate = await fetchRates(base, cur);
    if (!rate) return;

    // CONVERT
    nodes.forEach((el) => {
      if (!el.dataset.origAmount) {
        const numeric = parseAmount(el.textContent);
        if (numeric !== null) {
          el.dataset.origAmount = numeric;
        }
      }

      const val = parseFloat(el.dataset.origAmount);
      if (!isNaN(val)) {
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
  z-index: 2147483647;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

#${MENU} {
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
}`;
    document.head.appendChild(style);
  }

  function placeFixed(el, s) {
    el.style.position = "fixed";
    el.style.top = "";
    el.style.bottom = "";
    el.style.left = "";
    el.style.right = "";

    if (s.fixedCorner.includes("top")) {
      el.style.top = (s.distanceTop ?? 16) + "px";
    } else {
      el.style.bottom = (s.distanceBottom ?? 16) + "px";
    }

    if (s.fixedCorner.includes("right")) {
      el.style.right = (s.distanceRight ?? 16) + "px";
    } else {
      el.style.left = (s.distanceLeft ?? 16) + "px";
    }
  }

  let docClickBound = false;

  function attachMenuHandler(w, m) {
    w.onclick = (e) => {
      e.stopPropagation();
      m.style.display = "block";

      const r = w.getBoundingClientRect();
      const menuHeight = m.offsetHeight || 220;

      m.style.position = "fixed";
      m.style.left = r.left + "px";

      if (window.innerHeight - r.bottom < menuHeight && r.top > menuHeight) {
        m.style.top = "auto";
        m.style.bottom = window.innerHeight - r.top + 6 + "px";
      } else {
        m.style.bottom = "auto";
        m.style.top = r.bottom + 6 + "px";
      }

      document.body.appendChild(m);
    };

    if (!docClickBound) {
      document.addEventListener("click", () => {
        m.style.display = "none";
        m.remove();
      });
      docClickBound = true;
    }
  }


  function createWidget(settings) {
    document.getElementById(PICK)?.remove();
    document.getElementById(MENU)?.remove();
    if (settings.placement === "hidden") return;

    console.log(
      "🔍 [createWidget] Full settings:",
      JSON.stringify(settings, null, 2),
    );
    console.log("🔍 [createWidget] placement:", settings.placement);
    console.log("🔍 [createWidget] inlineSide:", settings.inlineSide);

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

    /* ----- INLINE PLACEMENT ----- */
    if (settings.placement === "inline") {
      console.log("📍 [INLINE] Entering inline placement logic");
      const header = findHeader();
      console.log("📍 [INLINE] Found header?", !!header);

      if (header) {
        // ✅ FIXED: Look for right column or icons container first
                // ✅ IMPROVED: Prioritize right-side containers, fallback to header end
        let target = header.querySelector(".header__column--right") ||
                     header.querySelector(".header__icons") ||
                     header.querySelector(".header__actions") ||
                     header.querySelector(".header__menu") ||
                     header;
        
        // If target is the header itself, try to find the rightmost section
        if (target === header) {
          const rightContainers = header.querySelectorAll("[class*='right'], [class*='icons'], [class*='actions']");
          if (rightContainers.length > 0) {
            target = rightContainers[rightContainers.length - 1];
          }
        }


        console.log(
          "📍 [INLINE] Target element:",
          target?.tagName,
          target?.className,
        );

        w.style.position = "relative";
        w.style.marginLeft = "10px";

        console.log("📍 [INLINE] inlineSide value:", settings.inlineSide);

        // ACTUAL inline logic: use settings.inlineSide
        if (settings.inlineSide === "left") {
          console.log("📍 [INLINE] Using PREPEND (left)");
          target.prepend(w);
        } else {
          console.log("📍 [INLINE] Using APPEND (right)");
          target.appendChild(w);
        }

        attachMenuHandler(w, m);
        convertPrices(saved, settings);
        return;
      }
    }

    /* ----- FIXED FALLBACK ----- */
    console.log("📍 [FIXED] Using fixed placement fallback");
    placeFixed(w, settings);
    document.body.appendChild(w);

    /* ----- MENU HANDLER ----- */
    attachMenuHandler(w, m);

    convertPrices(saved, settings);
  }

  /* ================= INIT ================= */
    async function init() {
    if (__MLV_WIDGET_INITED__) return;
    __MLV_WIDGET_INITED__ = true;
    injectCSS();
    
    // Wait 500ms for Shopify's theme JS to finish rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const settings = await loadSettings();
    createWidget(settings);
  }


  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
