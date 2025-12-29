import { prisma } from "../db.server";

export async function action({ request }) {
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

  // 🔑 THIS LINE UNBLOCKS THE UI
  return new Response(null, { status: 204 });
}

export default function ApiPostRoute() {
  return null;
}
