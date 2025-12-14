import prisma from "../db.server.js";

export async function loader({ request }) {
  // Handle OPTIONS for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://admin.shopify.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // GET /api/merchant-settings?shop=xxx
  if (request.method === "GET") {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    console.log("📝 [GET] shop:", shop);

    if (!shop) {
      return new Response(JSON.stringify({ error: "Shop not provided" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://admin.shopify.com",
        },
      });
    }

    try {
      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      console.log("💾 DB result:", saved);

      if (saved) {
        return new Response(
          JSON.stringify({
            selectedCurrencies: Array.isArray(saved.selectedCurrencies)
              ? saved.selectedCurrencies
              : JSON.parse(saved.selectedCurrencies || "[]"),
            defaultCurrency: saved.defaultCurrency,
            baseCurrency: saved.baseCurrency || "USD",
            placement: saved.placement || "bottom-right",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://admin.shopify.com",
            },
          }
        );
      }

      // Return defaults
      return new Response(
        JSON.stringify({
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "bottom-right",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://admin.shopify.com",
          },
        }
      );
    } catch (err) {
      console.error("❌ [GET] Error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://admin.shopify.com",
        },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://admin.shopify.com",
    },
  });
}

export async function action({ request }) {
  // Handle OPTIONS for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://admin.shopify.com",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // POST /api/merchant-settings
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { shop, currencies, defaultCurrency, placement } = body;

      console.log("📝 [POST] Payload:", {
        shop,
        currencies,
        defaultCurrency,
        placement,
      });

      if (!shop || !currencies || !defaultCurrency) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "https://admin.shopify.com",
            },
          }
        );
      }

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

      console.log("✅ [POST] Saved:", result);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://admin.shopify.com",
        },
      });
    } catch (err) {
      console.error("❌ [POST] Error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://admin.shopify.com",
        },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://admin.shopify.com",
    },
  });
}