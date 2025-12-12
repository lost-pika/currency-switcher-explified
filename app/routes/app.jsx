// app/app.jsx
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

/**
 * Loader runs on the server. We dynamically import the server-only shopify
 * helpers inside the loader function to avoid bundling server-only code
 * into the client bundle (which causes "process is not defined" errors).
 */
export const loader = async ({ request }) => {
  console.log("app loader running - starting authenticate.admin");

  // Dynamically import server-only helpers (only executed on server)
  const { authenticate } = await import("../shopify.server");

  let session;
  try {
    ({ session } = await authenticate.admin(request));
  } catch (err) {
    // authenticate may throw for unauthenticated requests — continue gracefully
    console.warn("app loader: authenticate.admin threw:", String(err));
  }

  // Fallback: try to read ?shop= from the URL if session is missing
  try {
    const url = new URL(request.url);
    const shopFromQuery = url.searchParams.get("shop");
    if ((!session || !session.shop) && shopFromQuery) {
      console.log("app loader: using fallback shop from query:", shopFromQuery);
      session = session || {};
      session.shop = shopFromQuery;
      session.accessToken = session.accessToken || null;
    }
  } catch (err) {
    console.warn("app loader: fallback parsing error:", String(err));
  }

  console.log("app loader session:", {
    shop: session?.shop,
    hasToken: !!session?.accessToken,
  });

  // Return only data the client needs. Do NOT return process.env directly.
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
