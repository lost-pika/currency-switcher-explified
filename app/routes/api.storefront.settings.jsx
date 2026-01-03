import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing shop" }),
      {
        status: 400,
        headers: corsHeaders(request),
      }
    );
  }

  const record = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      settings: record || null,
    }),
    {
      status: 200,
      headers: corsHeaders(request),
    }
  );
}

/* ✅ CORS helper */
function corsHeaders(request) {
  const origin = request.headers.get("origin") || "*";

  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function options({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}
