import { json } from "@remix-run/node";
import { prisma } from "../db.server";

// GET: load settings
export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop" }, { status: 400 });
  }

  const settings = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  if (!settings) {
    return json({
      data: {
        selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
        defaultCurrency: "INR",
        baseCurrency: "USD",
        placement: "Fixed Position",
        fixedCorner: "bottom-right",
        distanceTop: 16,
        distanceRight: 16,
        distanceBottom: 16,
        distanceLeft: 16,
      },
    });
  }

  return json({ data: settings });
}

// POST: save settings
export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json();
  const {
    shop,
    currencies,
    defaultCurrency,
    baseCurrency,
    placement,
    fixedCorner,
    distanceTop,
    distanceRight,
    distanceBottom,
    distanceLeft,
  } = body;

  if (!shop) {
    return json({ error: "Missing shop in payload" }, { status: 400 });
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

  return json({ success: true, data: saved });
}
