import prisma from "../db.server";

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

    return new Response(
      JSON.stringify({
        ok: true,
        settings: settings ?? null,
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
