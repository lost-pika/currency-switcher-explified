(function () {
  "use strict";

  const API_HOST = "https://currency-switcher-explified.vercel.app";
  const PICK = "__mlv_currency_picker_v2";

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

  function createPicker(settings) {
    const existing = document.getElementById(PICK);
    if (existing) existing.remove();

    const w = document.createElement("div");
    w.id = PICK;
    w.textContent = settings.defaultCurrency;
    w.style.padding = "10px 14px";
    w.style.background = "#fff";
    w.style.border = "1px solid #ccc";
    w.style.borderRadius = "8px";
    w.style.cursor = "pointer";
    w.style.zIndex = "2147483647";
    w.style.position = "fixed";

    // ✅ PLACEMENT FROM DB ONLY
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

    document.body.appendChild(w);
  }

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
