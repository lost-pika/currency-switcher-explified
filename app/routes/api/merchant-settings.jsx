import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";

export async function action({ request }) {
  const authResult = await authenticate.admin(request);
  if (authResult instanceof Response) return authResult;

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
