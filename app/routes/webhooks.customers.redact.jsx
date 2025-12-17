export const runtime = "nodejs";

import { unauthenticated } from "../shopify.server";

export const action = async ({ request }) => {
  await unauthenticated.webhook(request);
  return new Response(null, { status: 200 });
};
