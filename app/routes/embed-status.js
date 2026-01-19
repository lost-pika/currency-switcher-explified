import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  let session;

  try {
    ({ session } = await authenticate.admin(request));
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }

  const { shop, accessToken } = session;

  try {
    // 1. Get all themes
    const themesRes = await fetch(`https://${shop}/admin/api/2024-10/themes.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!themesRes.ok) throw new Error("Failed to fetch themes");

    const themesData = await themesRes.json();
    const mainTheme = themesData.themes.find((t) => t.role === "main");

    if (!mainTheme) {
      return json({ shop, mainThemeId: null, isEnabled: false });
    }

    // 2. Load settings_data.json
    const settingsRes = await fetch(
      `https://${shop}/admin/api/2024-10/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    if (!settingsRes.ok) {
      return json({ shop, mainThemeId: mainTheme.id, isEnabled: false });
    }

    const settingsData = await settingsRes.json();
    const settingsJson = JSON.parse(settingsData.asset?.value || "{}");

    // 3. App embed detection — UPDATE THIS with your actual embed name
    const EMBED_TYPE = "currency-switcher-app";

    let isEnabled = false;
    const blocks = settingsJson.current?.blocks || {};

    for (const id in blocks) {
      const block = blocks[id];
      if (block.type?.includes(EMBED_TYPE) && block.disabled !== true) {
        isEnabled = true;
        break;
      }
    }

    return new Response(
      JSON.stringify({
        shop,
        isEnabled,
        mainThemeId: mainTheme.id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Embed Status Error:", error);
    return new Response(
      JSON.stringify({
        shop,
        isEnabled: false,
        mainThemeId: null,
        error: error.message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
