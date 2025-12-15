import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { CORS_HEADERS } from "../api.cors-headers"; // adjust import path

export async function action({ request }) {
  const method = request.method;

  // Preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const authResult = await authenticate.admin(request);
    if (authResult instanceof Response) return authResult;

    const sessionShop =
      authResult.session?.shop || authResult.shop?.myshopifyDomain;

    if (method === "POST") {
      const body = await request.json();
      const {
        shop = sessionShop,
        currencies,
        defaultCurrency,
        baseCurrency = "USD",
        placement,
        fixedCorner,
        distanceTop = 16,
        distanceRight = 16,
        distanceBottom = 16,
        distanceLeft = 16,
      } = body;

      if (!shop || !currencies || !defaultCurrency) {
        return json({ error: "Missing required fields" }, {
          status: 400,
          headers: CORS_HEADERS,
        });
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

      return json({ success: true }, { headers: CORS_HEADERS });
    }

    if (method === "GET") {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || sessionShop;

      if (!shop) {
        return json({ error: "Shop not provided" }, {
          status: 400,
          headers: CORS_HEADERS,
        });
      }

      const saved = await prisma.merchantSettings.findUnique({ where: { shop } });

      if (saved) {
        return json(saved, { headers: CORS_HEADERS });
      }

      return json(
        {
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "bottom-right",
          fixedCorner: "bottom-right",
          distanceTop: 16,
          distanceRight: 16,
          distanceBottom: 16,
          distanceLeft: 16,
        },
        { headers: CORS_HEADERS },
      );
    }

    return json({ error: "Method not allowed" }, {
      status: 405,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    console.error("merchant-settings error:", err);
    return json({ error: err.message || "Internal error" }, {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
