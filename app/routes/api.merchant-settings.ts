import { prisma } from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  if (request.method === "GET") {
    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    return new Response(
      JSON.stringify({ data: settings }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (request.method === "POST") {
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

    return new Response(null, { status: 204 });
  }

  return new Response("Method Not Allowed", { status: 405 });
}
