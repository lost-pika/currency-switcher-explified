import { prisma } from "../db.server";
import { authenticate } from "../shopify.server";

/* -----------------------------
   GET → loader
------------------------------ */
export async function loader({ request }) {
  let session;

  try {
    ({ session } = await authenticate.admin(request));
  } catch (err) {
    // 🔥 REQUIRED for Shopify OAuth redirect
    if (err instanceof Response) {
      return err;
    }
    throw err;
  }

  const shop = session.shop;

  const settings = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  return new Response(
    JSON.stringify({ data: settings }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

/* -----------------------------
   POST → action
------------------------------ */
export async function action({ request }) {
  let session;

  try {
    ({ session } = await authenticate.admin(request));
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

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

  // ✅ NORMALIZE FIXED CORNER (CRITICAL FIX)
  const safeFixedCorner =
    placement === "fixed" ? fixedCorner ?? "bottom-right" : "bottom-right";

  await prisma.merchantSettings.upsert({
    where: { shop },
    update: {
      selectedCurrencies: currencies,
      defaultCurrency,
      baseCurrency,
      placement,
      fixedCorner: safeFixedCorner,
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
      fixedCorner: safeFixedCorner,
      distanceTop,
      distanceRight,
      distanceBottom,
      distanceLeft,
    },
  });

  return new Response(null, { status: 204 });
}

