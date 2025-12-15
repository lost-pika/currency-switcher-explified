// app/routes/app.api.merchant-settings.jsx

import { json } from "@react-router/node";  // react-router v7
import prisma from "../db.server";

export async function action({ request, context }) {
  const method = request.method;

  // Optional CORS for safety
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
    // Authenticated shop in admin, fallback for dev
    const shop = context?.sessionShop || "currency-switcher-app-2.myshopify.com";

    if (method === "POST") {
      const body = await request.json();

      const {
        currencies,
        defaultCurrency,
        baseCurrency = "USD",
        placement = "Fixed Position",   // "Fixed Position" | "Inline with header" | "Hidden"
        fixedCorner = "bottom-right",   // "top-left" | "top-right" | "bottom-left" | "bottom-right"
        distanceTop = 16,
        distanceRight = 16,
        distanceBottom = 16,
        distanceLeft = 16,
      } = body;

      if (!currencies || !Array.isArray(currencies) || !defaultCurrency) {
        return json({ error: "Missing required fields" }, { status: 400 });
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
      return json(saved, { status: 200 });
    }

    if (method === "GET") {
      const url = new URL(request.url);
      const shopParam = url.searchParams.get("shop") || shop;

      if (!shopParam) {
        return json({ error: "Shop not provided" }, { status: 400 });
      }

      const saved = await prisma.merchantSettings.findUnique({
        where: { shop: shopParam },
      });

      if (saved) {
        console.log("✅ merchant-settings GET found for shop:", shopParam);
        return json(saved, { status: 200 });
      }

      console.log("⚠️ merchant-settings GET no record, sending defaults");
      return json(
        {
          shop: shopParam,
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
        { status: 200 },
      );
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    console.error("❌ merchant-settings error:", err);
    return json(
      { error: err?.message || "Internal error" },
      { status: 500 },
    );
  }
}

// Remix loader → GET /app/api/merchant-settings bhi yahi handle kare
export async function loader(args) {
  return action(args);
}
