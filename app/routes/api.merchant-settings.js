import { prisma } from "../db.server";
import { authenticate } from "../shopify.server";

const DISABLE_AUTH_FOR_DB_TEST =
  process.env.DISABLE_AUTH_FOR_DB_TEST === "true";

/* ---------------- GET ---------------- */
export async function loader({ request }) {
  if (!DISABLE_AUTH_FOR_DB_TEST) {
    await authenticate.admin(request);
  }

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
    JSON.stringify({ success: true, data: settings }),
    { headers: { "Content-Type": "application/json" } }
  );
}

/* ---------------- POST ---------------- */
export async function action({ request }) {
  if (!DISABLE_AUTH_FOR_DB_TEST) {
    await authenticate.admin(request);
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
    return new Response(
      JSON.stringify({ error: "Missing shop" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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

  return new Response(
    JSON.stringify({ success: true, data: saved }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export default function ApiRoute() {
  return null;
}
