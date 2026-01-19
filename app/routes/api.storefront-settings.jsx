import { prisma } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing shop" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    // ✅ DEFAULT SETTINGS (fallback)
    const defaultSettings = {
      selectedCurrencies: ["USD", "EUR", "INR"],
      defaultCurrency: "USD",
      baseCurrency: "USD",
      placement: "fixed",
      fixedCorner: "bottom-right",
      distanceTop: 16,
      distanceRight: 16,
      distanceBottom: 16,
      distanceLeft: 16,
      inlineSide: "right", // ✅ ADD THIS
    };

    // ✅ IF SETTINGS EXIST, TRANSFORM & INCLUDE ALL FIELDS
    const responseSettings = settings
      ? {
          selectedCurrencies:
            settings.selectedCurrencies ||
            defaultSettings.selectedCurrencies,
          defaultCurrency:
            settings.defaultCurrency || defaultSettings.defaultCurrency,
          baseCurrency:
            settings.baseCurrency || defaultSettings.baseCurrency,
          placement: settings.placement || defaultSettings.placement,
          fixedCorner:
            settings.fixedCorner || defaultSettings.fixedCorner,
          distanceTop:
            settings.distanceTop ?? defaultSettings.distanceTop,
          distanceRight:
            settings.distanceRight ?? defaultSettings.distanceRight,
          distanceBottom:
            settings.distanceBottom ?? defaultSettings.distanceBottom,
          distanceLeft:
            settings.distanceLeft ?? defaultSettings.distanceLeft,
          inlineSide:
            settings.inlineSide || defaultSettings.inlineSide, // ✅ ADD THIS
        }
      : defaultSettings;

    return new Response(
      JSON.stringify({
        ok: true,
        settings: responseSettings, // ✅ Return transformed object
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Storefront settings error:", err);

    return new Response(
      JSON.stringify({ ok: false, error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
