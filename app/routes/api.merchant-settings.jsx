// app/routes/api.merchant-settings.jsx
import prisma from "../db.server.js";
import { cors } from "remix-utils/cors";

export async function loader({ request }) {
  return await cors(request, async () => {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    
    if (!shop) {
      return new Response(JSON.stringify({ error: "Shop not provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      if (saved) {
        return new Response(JSON.stringify(saved), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Defaults
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
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  });
}

export async function action({ request }) {
  return await cors(request, async () => {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { shop, currencies, defaultCurrency, placement } = body;

        if (!shop || !currencies || !defaultCurrency) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
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

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    
    return new Response(null, { status: 405 });
  });
}