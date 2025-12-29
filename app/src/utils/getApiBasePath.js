export function getApiBasePath() {
  if (typeof window === "undefined") return "";

  // Shopify embedded apps are mounted under /apps/<handle>/app
  const match = window.location.pathname.match(/^(.*\/apps\/[^/]+\/app)/);

  return match ? match[1] : "";
}
