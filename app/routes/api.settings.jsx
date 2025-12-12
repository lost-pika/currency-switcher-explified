import { authenticate } from "../shopify.server";
import prisma from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    let shop = null;

    try {
      const { session } = await authenticate.admin(request);
      shop = session?.shop;
      console.log("📝 [SETTINGS LOADER] Auth succeeded, shop:", shop);
    } catch (e) {
      console.warn("⚠️ [SETTINGS LOADER] Auth failed, falling back to ?shop param");
    }

    const url = new URL(request.url);
    shop = shop || url.searchParams.get("shop");

    if (!shop) {
      console.error("❌ [SETTINGS LOADER] No shop identifier");
      return new Response(JSON.stringify({ error: "Shop not provided" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    console.log("🔍 [SETTINGS LOADER] Querying DB for shop:", shop);

    let saved = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    if (saved) {
      const settings = {
        selectedCurrencies: Array.isArray(saved.selectedCurrencies)
          ? saved.selectedCurrencies
          : JSON.parse(saved.selectedCurrencies || "[]"),
        defaultCurrency: saved.defaultCurrency,
        baseCurrency: saved.baseCurrency || "USD",
        placement: saved.placement || "bottom-right",
        fixedCorner: saved.fixedCorner || "bottom-left",
        distanceTop: saved.distanceTop ?? 16,
        distanceRight: saved.distanceRight ?? 16,
        distanceBottom: saved.distanceBottom ?? 16,
        distanceLeft: saved.distanceLeft ?? 16,
      };
      console.log("✅ [SETTINGS LOADER] Returning saved settings:", settings);
      return new Response(JSON.stringify(settings), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    const defaults = {
      selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
      defaultCurrency: "INR",
      baseCurrency: "USD",
      placement: "bottom-right",
      fixedCorner: "bottom-left",
      distanceTop: 16,
      distanceRight: 16,
      distanceBottom: 16,
      distanceLeft: 16,
    };
    console.log("📝 [SETTINGS LOADER] No saved data, returning defaults");
    return new Response(JSON.stringify(defaults), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("❌ [SETTINGS LOADER] Error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    let shop = null;

    try {
      const { session } = await authenticate.admin(request);
      shop = session?.shop;
      console.log("📝 [SETTINGS ACTION] Auth succeeded, shop:", shop);
    } catch (e) {
      console.warn("⚠️ [SETTINGS ACTION] Auth failed, falling back to ?shop param");
    }

    const url = new URL(request.url);
    shop = shop || url.searchParams.get("shop");

    if (!shop) {
      console.error("❌ [SETTINGS ACTION] No shop identifier");
      return new Response(JSON.stringify({ error: "Shop not provided" }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    const body = await request.json();
    const { 
      currencies, 
      defaultCurrency, 
      placement,
      fixedCorner,
      distanceTop,
      distanceRight,
      distanceBottom,
      distanceLeft,
    } = body;

    console.log("📝 [SETTINGS ACTION] Received:", { 
      shop, 
      currencies, 
      defaultCurrency, 
      placement,
      fixedCorner 
    });

    if (!currencies || !defaultCurrency) {
      console.error("❌ [SETTINGS ACTION] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: currencies, defaultCurrency" }), 
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log("💾 [SETTINGS ACTION] Saving to DB...");
    const result = await prisma.merchantSettings.upsert({
      where: { shop },
      update: {
        selectedCurrencies: currencies,
        defaultCurrency,
        baseCurrency: "USD",
        placement: placement || "bottom-right",
        fixedCorner: fixedCorner || "bottom-left",
        distanceTop: distanceTop ?? 16,
        distanceRight: distanceRight ?? 16,
        distanceBottom: distanceBottom ?? 16,
        distanceLeft: distanceLeft ?? 16,
      },
      create: {
        shop,
        selectedCurrencies: currencies,
        defaultCurrency,
        baseCurrency: "USD",
        placement: placement || "bottom-right",
        fixedCorner: fixedCorner || "bottom-left",
        distanceTop: distanceTop ?? 16,
        distanceRight: distanceRight ?? 16,
        distanceBottom: distanceBottom ?? 16,
        distanceLeft: distanceLeft ?? 16,
      },
    });

    console.log("✅ [SETTINGS ACTION] Saved:", result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("❌ [SETTINGS ACTION] Error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
