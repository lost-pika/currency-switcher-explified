import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * GET /api/merchant-settings
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const settings = await prisma.merchantSettings.findUnique({
    where: { shop: session.shop },
  });

  console.log("📥 Loaded settings for:", session.shop);

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

  console.log("💾 Saving for shop:", session.shop);
  console.log("📦 Payload:", body);

  await prisma.merchantSettings.upsert({
    where: { shop: session.shop },
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
      shop: session.shop,
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

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
