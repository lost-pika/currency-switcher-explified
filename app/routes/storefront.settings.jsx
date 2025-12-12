import prisma from "../db.server";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ ok: false, error: "Missing shop" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const record = await prisma.shopSettings.findUnique({
    where: { shop },
  });

  return new Response(
    JSON.stringify({
      ok: true,
      settings: record?.config || null,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
