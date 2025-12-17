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

  const {
    shop: bodyShop,
    currencies,
    defaultCurrency,
    baseCurrency = "USD",
    placement = "bottom-right",
    fixedCorner = "bottom-right",
    distanceTop = 16,
    distanceRight = 16,
    distanceBottom = 16,
    distanceLeft = 16,
  } = body;

  const shop = sessionShop || bodyShop; // IMPORTANT: fallback to body.shop

  if (!shop || !currencies || !defaultCurrency) {
    console.error("Missing fields", { shop, currencies, defaultCurrency });
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  await prisma.merchantSettings.upsert({
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

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: CORS_HEADERS }
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
