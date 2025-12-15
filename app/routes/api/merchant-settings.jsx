import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // adjust ../ if needed
import prisma from "../db.server";

export async function action({ request }) {
  try {
    console.log("🔍 /merchant-settings ACTION method:", request.method);

    const authResult = await authenticate.admin(request);
    if (authResult instanceof Response) {
      console.warn("❌ Auth failed");
      return authResult;
    }

    const sessionShop =
      authResult.session?.shop || authResult.shop?.myshopifyDomain;

    if (request.method === "POST") {
      const body = await request.json();
      console.log("📝 Body:", body);

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

      console.log("✅ Saved:", saved.id || saved.shop);
      return json({ success: true });
    }

    if (request.method === "GET") {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop") || sessionShop;

      if (!shop) {
        return json({ error: "Shop not provided" }, { status: 400 });
      }

      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      if (saved) return json(saved);

      return json({
        selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
        defaultCurrency: "INR",
        baseCurrency: "USD",
        placement: "bottom-right",
        fixedCorner: "bottom-right",
        distanceTop: 16,
        distanceRight: 16,
        distanceBottom: 16,
        distanceLeft: 16,
      });
    }

    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    console.error("❌ merchant-settings error:", err);
    return json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
