import { prisma } from "../db.server";

// GET: load settings for a shop
export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Missing shop" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const settings = await prisma.merchantSettings.findUnique({ where: { shop } });

  return new Response(
    JSON.stringify({
      data:
        settings ?? {
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "fixed",           // internal values
          fixedCorner: "bottom-right",
          distanceTop: 16,
          distanceRight: 16,
          distanceBottom: 16,
          distanceLeft: 16,
        },
    }),
    { headers: { "Content-Type": "application/json" } },
  );
}

// POST: save settings
export async function action({ request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ error: "Missing shop" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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

  return new Response(JSON.stringify({ success: true, data: saved }), {
    headers: { "Content-Type": "application/json" },
  });
}

// dummy component so route is valid
export default function ApiRoute() {
  return null;
}
