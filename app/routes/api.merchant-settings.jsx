import prisma from "../db.server.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Shop is required" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const row = await prisma.merchantSettings.findUnique({
    where: { shop },
  });

  const response = row
    ? {
        selectedCurrencies: row.selectedCurrencies,
        defaultCurrency: row.defaultCurrency,
        baseCurrency: row.baseCurrency || "USD",
        placement: row.placement || "bottom-right",
        fixedCorner: row.fixedCorner || "bottom-left",
        distanceTop: row.distanceTop ?? 16,
        distanceRight: row.distanceRight ?? 16,
        distanceBottom: row.distanceBottom ?? 16,
        distanceLeft: row.distanceLeft ?? 16,
      }
    : {
        selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
        defaultCurrency: "INR",
        baseCurrency: "USD",
        placement: "bottom-right",
        fixedCorner: "bottom-left",
        distanceTop: 16,
        distanceRight: 16,
        distanceBottom: 16,
        distanceLeft: 16,
      };

  return new Response(JSON.stringify(response), { headers: corsHeaders });
} // ✅ THIS WAS MISSING

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

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
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
      headers: corsHeaders,
    });
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

  return new Response(JSON.stringify({ success: true }), {
    headers: corsHeaders,
  });
}
