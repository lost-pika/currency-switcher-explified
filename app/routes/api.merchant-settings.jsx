import prisma from "../db.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function loader({ request }) {
  console.log("📝 [LOADER] Route hit:", request.url);
  
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  console.log("📝 [LOADER] Shop param:", shop);

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop not provided" }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  try {
    console.log("🔍 Querying DB for shop:", shop);
    const saved = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    console.log("💾 DB result:", saved);

    if (saved) {
      const settings = {
        selectedCurrencies: Array.isArray(saved.selectedCurrencies) 
          ? saved.selectedCurrencies 
          : JSON.parse(saved.selectedCurrencies || "[]"),
        defaultCurrency: saved.defaultCurrency,
        baseCurrency: saved.baseCurrency || "USD",
        placement: saved.placement || "bottom-right",
      };
      console.log("✅ [LOADER] Returning saved settings:", settings);
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
    };
    console.log("📝 [LOADER] No saved data, returning defaults");
    return new Response(JSON.stringify(defaults), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("❌ [LOADER] Error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export async function action({ request }) {
  console.log("📝 [ACTION] Route hit:", request.method);
  
  // Handle CORS preflight
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
    const body = await request.json();
    const { shop, currencies, defaultCurrency, placement } = body;

    console.log("📝 [ACTION] Received:", { shop, currencies, defaultCurrency });

    if (!shop || !currencies || !defaultCurrency) {
      console.error("❌ [ACTION] Missing required fields");
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    console.log("💾 Saving to DB...");
    const result = await prisma.merchantSettings.upsert({
      where: { shop },
      update: {
        selectedCurrencies: currencies,
        defaultCurrency,
        baseCurrency: "USD",
        placement: placement || "bottom-right",
      },
      create: {
        shop,
        selectedCurrencies: currencies,
        defaultCurrency,
        baseCurrency: "USD",
        placement: placement || "bottom-right",
      },
    });

    console.log("✅ [ACTION] Saved to DB:", result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("❌ [ACTION] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}