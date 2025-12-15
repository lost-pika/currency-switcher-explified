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

      console.log("📨 [API POST] Raw body received:", body);

      const {
        shop = defaultShop,
        currencies = [],           // ✅ EXPECTS THIS KEY
        defaultCurrency = "USD",
        baseCurrency = "USD",
        placement = "Fixed Position",
        fixedCorner = "bottom-right",
        distanceTop = 16,
        distanceRight = 16,
        distanceBottom = 16,
        distanceLeft = 16,
      } = body;

      console.log("🔍 [API POST] Parsed values:", {
        shop,
        currencies,
        defaultCurrency,
      });

      // ✅ VALIDATION (Clear error messages)
      if (!shop || !Array.isArray(currencies) || currencies.length === 0) {
        console.error("❌ [API POST] Validation failed:", {
          shop: shop || "MISSING",
          currencies: currencies || "NOT_ARRAY",
          length: currencies?.length || 0,
        });
        return jsonResponse(
          {
            ok: false,
            error: "Missing required fields: shop, currencies (array)",
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

      console.log("✅ [API POST] Validation passed, saving to DB...");

      // ✅ UPSERT TO DB
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

      console.log("✅ [API POST] Saved to DB:", saved);

      return jsonResponse(
        {
          ok: true,
          message: "Settings saved successfully",
          data: saved,
        },
        200,
      );
    }

    if (method === "GET") {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || defaultShop;

      console.log("📨 [API GET] shop param:", shop);

      if (!shop) {
        return jsonResponse({ ok: false, error: "Shop not provided" }, 400);
      }

      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      if (saved) {
        console.log("✅ [API GET] Found in DB:", saved);
        return jsonResponse({ ok: true, data: saved }, 200);
      }

      console.log("⚠️ [API GET] Not found, returning defaults");
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
      {
        ok: false,
        error: err?.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      500,
    );
  }
}

export async function loader(args) {
  return action(args);
}
