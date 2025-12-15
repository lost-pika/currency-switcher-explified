import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";

export async function action({ request }) {
  try {
    console.log("🔍 [ACTION] Method:", request.method);
    
    // Authenticate the request
    const authResult = await authenticate.admin(request);
    if (authResult instanceof Response) {
      console.warn("❌ [ACTION] Auth failed");
      return authResult;
    }

    console.log("✅ [ACTION] Auth successful, shop:", authResult.shop.myshopifyDomain);

    // Handle POST
    if (request.method === "POST") {
      console.log("📝 [POST] Reading request body...");
      
      const body = await request.json();
      const {
        shop,
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

      console.log("✅ [POST] Body parsed:", {
        shop,
        currencies,
        defaultCurrency,
        placement,
      });

      if (!shop || !currencies || !defaultCurrency) {
        console.warn("⚠️ [POST] Missing required fields");
        return json({ error: "Missing required fields" }, { status: 400 });
      }

      console.log("🔄 [POST] Starting Prisma upsert...");
      
      const result = await prisma.merchantSettings.upsert({
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

      console.log("✅ [POST] Saved successfully:", result);
      return json({ success: true });
    }

    // Handle GET (for loading settings)
    if (request.method === "GET") {
      const url = new URL(request.url);
      const shop = url.searchParams.get("shop");
      
      console.log("📝 [GET] shop:", shop);

      if (!shop) {
        console.warn("⚠️ [GET] No shop provided");
        return json({ error: "Shop not provided" }, { status: 400 });
      }

      console.log("🔄 [GET] Querying Prisma...");
      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      console.log("✅ [GET] Prisma result:", saved);

      if (saved) {
        return json(saved);
      }

      // Return defaults
      console.log("⚠️ [GET] No saved record, returning defaults");
      return json({
        selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
        defaultCurrency: "INR",
        baseCurrency: "USD",
        placement: "bottom-right",
      });
    }

    console.warn("⚠️ [ACTION] Method not allowed:", request.method);
    return json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    console.error("❌ [ACTION] Error:", err.message, err.stack);
    return json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}