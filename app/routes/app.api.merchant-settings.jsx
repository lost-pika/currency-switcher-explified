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

    if (method === "POST") {
      const body = await request.json();

      const {
        shop = defaultShop,
        currencies,
        defaultCurrency,
        baseCurrency = "USD",
        placement = "Fixed Position",
        fixedCorner = "bottom-right",
        distanceTop = 16,
        distanceRight = 16,
        distanceBottom = 16,
        distanceLeft = 16,
      } = body;

      if (!shop || !currencies || !Array.isArray(currencies) || !defaultCurrency) {
        return jsonResponse({ error: "Missing required fields" }, 400);
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

      console.log("✅ merchant-settings POST saved for shop:", shop);
      return jsonResponse(saved, 200);
    }

    if (method === "GET") {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || defaultShop;

      if (!shop) {
        return jsonResponse({ error: "Shop not provided" }, 400);
      }

      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      if (saved) {
        console.log("✅ merchant-settings GET found for shop:", shop);
        return jsonResponse(saved, 200);
      }

      console.log("⚠️ merchant-settings GET no record, sending defaults");
      return jsonResponse(
        {
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
        200,
      );
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("❌ merchant-settings error:", err);
    return jsonResponse({ error: err?.message || "Internal error" }, 500);
  }
}

// Remix loader
export async function loader(args) {
  return action(args);
}
