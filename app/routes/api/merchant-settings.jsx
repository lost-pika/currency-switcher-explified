import prisma from "../app/db.server.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://admin.shopify.com");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    if (req.method === "GET") {
      const shop = req.query.shop;
      if (!shop) {
        return res.status(400).json({ error: "Shop is required" });
      }

      const row = await prisma.merchantSettings.findUnique({
        where: { shop },
      });

      return res.status(200).json(
        row || {
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "bottom-right",
          fixedCorner: "bottom-left",
          distanceTop: 16,
          distanceRight: 16,
          distanceBottom: 16,
          distanceLeft: 16,
        }
      );
    }

    if (req.method === "POST") {
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
      } = req.body;

      if (!shop || !currencies || !defaultCurrency) {
        return res.status(400).json({ error: "Missing fields" });
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

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("❌ API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
