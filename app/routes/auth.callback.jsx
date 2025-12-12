// app/routes/auth.callback.jsx
import shopify from "../shopify.server";

export async function loader({ request }) {
  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  // TEMP: paste your Client ID (API key) from the app settings page here
  const appId = "8ee8e1494446dc18e5df11fce259645e"; // ← replace with your real client ID
  const extensionHandle = "currency-app-embed";

  const themeEditorUrl =
    `https://${shop}/admin/themes/current/editor` +
    `?context=apps&activateAppId=${appId}/${extensionHandle}`;

  return new Response(null, {
    status: 302,
    headers: { Location: themeEditorUrl },
  });
}
