import { authenticate } from "../../../shopify.server";
import { prisma } from "../../../db.server";

/* -------------------------------------------------
   GET: Load merchant settings
------------------------------------------------- */
export async function loader({ request }) {
  // 🔐 Shopify admin authentication (REQUIRED)
  await authenticate.admin(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Missing shop param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const settings = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  return new Response(
    JSON.stringify({
      data:
        settings ?? {
          selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
          defaultCurrency: "INR",
          baseCurrency: "USD",
          placement: "fixed",
          fixedCorner: "bottom-right",
          distanceTop: 16,
          distanceRight: 16,
          distanceBottom: 16,
          distanceLeft: 16,
        },
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

/* -------------------------------------------------
   POST: Save merchant settings
------------------------------------------------- */
export async function action({ request }) {
  // 🔐 Shopify admin authentication (REQUIRED)
  await authenticate.admin(request);

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();

  if (!body.shop) {
    return new Response(JSON.stringify({ error: "Missing shop in payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const saved = await prisma.merchantSettings.upsert({
    where: { shop: body.shop },
    update: {
      selectedCurrencies: body.currencies,
      defaultCurrency: body.defaultCurrency,
      baseCurrency: body.baseCurrency,
      placement: body.placement,
      fixedCorner: body.fixedCorner,
      distanceTop: body.distanceTop,
      distanceRight: body.distanceRight,
      distanceBottom: body.distanceBottom,
      distanceLeft: body.distanceLeft,
    },
    create: {
      shop: body.shop,
      selectedCurrencies: body.currencies,
      defaultCurrency: body.defaultCurrency,
      baseCurrency: body.baseCurrency,
      placement: body.placement,
      fixedCorner: body.fixedCorner,
      distanceTop: body.distanceTop,
      distanceRight: body.distanceRight,
      distanceBottom: body.distanceBottom,
      distanceLeft: body.distanceLeft,
    },
  });

  return new Response(JSON.stringify({ success: true, data: saved }), {
    headers: { "Content-Type": "application/json" },
  });
}
