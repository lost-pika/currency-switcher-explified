import { prisma } from "../db.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

/* GET - Fetch existing settings */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(
      JSON.stringify({ error: "Missing shop" }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  try {
    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    return new Response(
      JSON.stringify({ data: settings }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Loader error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch settings" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

/* POST - Save settings */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
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
      return new Response(
        JSON.stringify({ error: "Missing shop" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log("💾 Saving settings for shop:", shop);

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

    console.log("✅ Settings saved successfully");

    return new Response(null, { 
      status: 204,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Action error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to save settings" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
