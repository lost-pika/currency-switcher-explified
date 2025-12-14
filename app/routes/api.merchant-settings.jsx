import prisma from "../db.server.js";

export async function loader({ request }) {
  console.log("🔍 [LOADER] Method:", request.method);
  
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    console.log("📝 [GET] Received shop:", shop);

    if (!shop) {
      return new Response(JSON.stringify({ error: "Shop not provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      console.log("🔄 [GET] Querying DB for shop:", shop);
      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });
      console.log("✅ [GET] DB response:", saved);

      if (saved) {
        return new Response(JSON.stringify(saved), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log("⚠️ [GET] No saved settings, returning defaults");
      return new Response(
        JSON.stringify({
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "bottom-right",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      console.error("❌ [GET] Prisma error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }) {
  console.log("🔍 [ACTION] Method:", request.method);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      console.log("📝 [POST] Received body:", body);

      const { shop, currencies, defaultCurrency, placement } = body;

      if (!shop || !currencies || !defaultCurrency) {
        console.warn("⚠️ [POST] Missing fields:", {
          shop: !!shop,
          currencies: !!currencies,
          defaultCurrency: !!defaultCurrency,
        });
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log("🔄 [POST] Starting DB upsert for shop:", shop);
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
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("❌ [POST] Error:", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}