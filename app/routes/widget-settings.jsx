// app/routes/widget-settings.jsx
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (!shop) {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
  const rec = await prisma.shopSettings.findUnique({ where: { shop }});
  const config = rec?.config || null;
  // include baseCurrency (merchant default) and any flags the widget needs
  const payload = {
    ok: true,
    settings: {
      baseCurrency: (config && config.baseCurrency) || "USD",
      // other settings you want to expose
    }
  };
  return new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
  });
};
export default loader;
