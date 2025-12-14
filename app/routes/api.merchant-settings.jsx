// app/routes/api.merchant-settings.jsx
import prisma from "../db.server.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function loader({ request }) {
  console.log("🔍 [LOADER] Method:", request.method);

  // Handle OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    console.log("✅ [LOADER] Responding to OPTIONS");
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Handle GET
  if (request.method === "GET") {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    console.log("📝 [GET] shop:", shop);

    if (!shop) {
      console.warn("⚠️ [GET] No shop provided");
      return new Response(JSON.stringify({ error: "Shop not provided" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    try {
      console.log("🔄 [GET] Querying Prisma...");
      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      console.log("✅ [GET] Prisma result:", saved);

      if (saved) {
        return new Response(JSON.stringify(saved), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }

      // Return defaults
      console.log("⚠️ [GET] No saved record, returning defaults");
      return new Response(
        JSON.stringify({
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "bottom-right",
        }),
        {
          status: 200,
          headers: CORS_HEADERS,
        }
      );
    } catch (err) {
      console.error("❌ [GET] Prisma error:", err.message, err.stack);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  console.warn("⚠️ [LOADER] Method not allowed:", request.method);
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: CORS_HEADERS,
  });
}

export async function action({ request }) {
  console.log("🔍 [ACTION] Method:", request.method);

  // Handle OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    console.log("✅ [ACTION] Responding to OPTIONS");
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Handle POST
  if (request.method === "POST") {
    try {
      console.log("📝 [POST] Reading request body...");
      const body = await request.json();
      const { shop, currencies, defaultCurrency, placement } = body;

      console.log("✅ [POST] Body parsed:", {
        shop,
        currencies,
        defaultCurrency,
        placement,
      });

      if (!shop || !currencies || !defaultCurrency) {
        console.warn("⚠️ [POST] Missing required fields");
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: CORS_HEADERS,
          }
        );
      }

      console.log("🔄 [POST] Starting Prisma upsert...");
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

      console.log("✅ [POST] Saved successfully:", result);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } catch (err) {
      console.error("❌ [POST] Error:", err.message, err.stack);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  }

  console.warn("⚠️ [ACTION] Method not allowed:", request.method);
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: CORS_HEADERS,
  });
}