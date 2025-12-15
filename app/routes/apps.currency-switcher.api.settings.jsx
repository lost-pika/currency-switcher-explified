import prisma from "../db.server";

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    console.log(`🏪 [Settings API] Loading for shop: ${shop}`);

    if (!shop) {
      return jsonResponse({ error: "shop parameter required" }, 400);
    }

    // Query database
    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    if (settings) {
      console.log(`✅ Settings found for ${shop}`);
      return jsonResponse(settings);
    }

    console.log(`⚠️ No settings found for ${shop}, returning defaults`);
    return jsonResponse({
      shop,
      selectedCurrencies: ["USD", "EUR", "INR", "CAD"],
      defaultCurrency: "INR",
      baseCurrency: "USD",
      placement: "Fixed Position",
      fixedCorner: "bottom-right",
      distanceTop: 16,
      distanceRight: 16,
      distanceBottom: 16,
      distanceLeft: 16,
    });
  } catch (err) {
    console.error("Settings API error:", err);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}

export async function action({ request }) {
  if (request.method === "OPTIONS") {
    return options();
  }
  return loader({ request });
}
