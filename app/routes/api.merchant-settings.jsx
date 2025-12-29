import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * GET /api/merchant-settings?shop=xxx.myshopify.com
 */
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(
      JSON.stringify({ error: "Missing shop" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const settings = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  return new Response(
    JSON.stringify({ data: settings }),
    { headers: { "Content-Type": "application/json" } }
  );
};

/**
 * POST /api/merchant-settings
 */
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);

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
    return new Response(
      JSON.stringify({ error: "Missing shop" }),
      { status: 400 }
    );
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

  // IMPORTANT: empty 204 response
  return new Response(null, { status: 204 });
};
