import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

/**
 * Small helper to always return JSON (important for Remix + Vite)
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/* =====================================================
   GET: Load merchant settings
   ===================================================== */
export async function loader({ request }) {
  // 🔐 Required for embedded Shopify apps
  await authenticate.admin(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return jsonResponse({ error: "Missing shop" }, 400);
  }

  const settings = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  return jsonResponse({
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
  });
}

/* =====================================================
   POST: Save merchant settings
   ===================================================== */
export async function action({ request }) {
  const ua = request.headers.get("user-agent") || "";

  // 🔓 TEMP: allow curl / Postman
  if (!ua.includes("curl")) {
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


/**
 * Dummy default export so Remix treats this as a valid route module
 */
export default function ApiRoute() {
  return null;
}
