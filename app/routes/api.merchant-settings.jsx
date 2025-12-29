import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * GET /api/merchant-settings
 */
export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    return new Response(
      JSON.stringify({ ok: true, data: settings }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("GET merchant-settings failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
};

/**
 * POST /api/merchant-settings
 */
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const body = await request.json();

    const {
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

    console.log("💾 Saving settings for:", shop);

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

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("POST merchant-settings failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500 }
    );
  }
};
