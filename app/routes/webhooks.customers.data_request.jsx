export const runtime = "nodejs";

import { unauthenticated } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    await unauthenticated.webhook(request);

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Webhook auth/HMAC failed (customers data_request)", err);
    return new Response("Unauthorized", { status: 401 });
  }
};
