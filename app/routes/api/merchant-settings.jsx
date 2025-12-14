import { json } from "@react-router/node";
import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop is required" }, { status: 400 });
  }

  const row = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  return json(
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

export async function action({ request }) {
  const body = await request.json();

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
  } = body;

  if (!shop || !currencies || !defaultCurrency) {
    return json({ error: "Missing fields" }, { status: 400 });
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

  return json({ success: true });
}
