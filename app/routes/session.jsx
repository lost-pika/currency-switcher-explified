// app/routes/session.jsx
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  return new Response(
    JSON.stringify({
      shop: session.shop,
      accessToken: session.accessToken,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
