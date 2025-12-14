import prisma from "../db.server.js";

export default async function handler(req, res) {
  console.log("📝 [API] /api/merchant-settings hit:", req.method);

  // ---------------- CORS ----------------
  res.setHeader("Access-Control-Allow-Origin", "https://admin.shopify.com");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // ---------------- GET ----------------
  if (req.method === "GET") {
    const { shop } = req.query;
    console.log("📝 [GET] shop:", shop);

    if (!shop) {
      return res.status(400).json({ error: "Shop not provided" });
    }

    try {
      const saved = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      console.log("💾 DB result:", saved);

      if (saved) {
        return res.status(200).json({
          selectedCurrencies: Array.isArray(saved.selectedCurrencies)
            ? saved.selectedCurrencies
            : JSON.parse(saved.selectedCurrencies || "[]"),
          defaultCurrency: saved.defaultCurrency,
          baseCurrency: saved.baseCurrency || "USD",
          placement: saved.placement || "bottom-right",
        });
      }

      // Defaults
      return res.status(200).json({
        selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
        defaultCurrency: "INR",
        baseCurrency: "USD",
        placement: "bottom-right",
      });
    } catch (err) {
      console.error("❌ [GET] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ---------------- POST ----------------
  if (req.method === "POST") {
    try {
      const { shop, currencies, defaultCurrency, placement } = req.body;

      console.log("📝 [POST] Payload:", {
        shop,
        currencies,
        defaultCurrency,
        placement,
      });

      if (!shop || !currencies || !defaultCurrency) {
        return res.status(400).json({ error: "Missing required fields" });
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

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ [POST] Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ---------------- FALLBACK ----------------
  return res.status(405).json({ error: "Method not allowed" });
}
