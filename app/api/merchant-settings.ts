import { prisma } from "../../db.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(JSON.stringify({ error: "Missing shop" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });
    return new Response(JSON.stringify({ data: settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Loader error:", error);
    return new Response(JSON.stringify({ error: "Loader failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
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
      return new Response(JSON.stringify({ error: "Missing shop" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
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

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Action error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
