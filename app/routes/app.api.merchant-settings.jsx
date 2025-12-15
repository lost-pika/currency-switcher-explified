// app/routes/app.api.merchant-settings.jsx

import prisma from "../db.server";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function action({ request }) {
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const defaultShop = "currency-switcher-app-2.myshopify.com";

    // ---------- POST: SAVE ----------
    if (method === "POST") {
      const body = await request.json();

      console.log("📨 [API POST] Raw body:", body);

      const {
        shop = defaultShop,
        currencies = [],
        defaultCurrency = "USD",
        baseCurrency = "USD",
        placement = "Fixed Position",
        fixedCorner = "bottom-right",
        distanceTop = 16,
        distanceRight = 16,
        distanceBottom = 16,
        distanceLeft = 16,
      } = body;

      console.log("🔍 [API POST] Parsed:", {
        shop,
        currencies,
        defaultCurrency,
        placement,
        fixedCorner,
      });

      if (!shop || !Array.isArray(currencies) || currencies.length === 0) {
        console.error("❌ [API POST] Missing shop/currencies");
        return jsonResponse(
          {
            ok: false,
            error:
              "Missing required fields: shop and currencies (non-empty array) required",
          },
          400,
        );
      }

      if (!defaultCurrency) {
        console.error("❌ [API POST] Missing defaultCurrency");
        return jsonResponse(
          { ok: false, error: "Missing defaultCurrency" },
          400,
        );
      }

      const saved = await prisma.merchantSettings.upsert({
        where: { shop },
        update: {
          selectedCurrencies: currencies,
          defaultCurrency,
          baseCurrency,
          placement,
          fixedCorner,
          distanceTop,
          distanceRight,
          distanceBottom,
          distanceLeft,
        },
        create: {
          shop,
          selectedCurrencies: currencies,
          defaultCurrency,
          baseCurrency,
          placement,
          fixedCorner,
          distanceTop,
          distanceRight,
          distanceBottom,
          distanceLeft,
        },
      });

      console.log("✅ [API POST] Saved row:", saved);

      return jsonResponse(
        { ok: true, message: "Settings saved", data: saved },
        200,
      );
    }

    // ---------- GET: LOAD ----------
    if (method === "GET") {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || defaultShop;

      console.log("📨 [API GET] shop:", shop);

      if (!shop) {
        return jsonResponse({ ok: false, error: "Shop not provided" }, 400);
      }

      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      if (saved) {
        console.log("✅ [API GET] Found:", saved);
        return jsonResponse({ ok: true, data: saved }, 200);
      }

      console.log("⚠️ [API GET] Not found, sending defaults");
      return jsonResponse(
        {
          ok: true,
          data: {
            shop,
            selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
            defaultCurrency: "INR",
            baseCurrency: "USD",
            placement: "Fixed Position",
            fixedCorner: "bottom-right",
            distanceTop: 16,
            distanceRight: 16,
            distanceBottom: 16,
            distanceLeft: 16,
          },
        },
        200,
      );
    }

    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("❌ [API ERROR]:", err);
    return jsonResponse(
      { ok: false, error: err?.message || "Internal error" },
      500,
    );
  }
}

export async function loader(args) {
  return action(args);
}
