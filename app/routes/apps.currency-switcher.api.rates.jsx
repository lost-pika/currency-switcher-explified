// app/routes/api.rates.jsx
export async function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const base = (url.searchParams.get("base") || "USD").toUpperCase();
    const symbolsParam = (url.searchParams.get("symbols") || "").toUpperCase(); // CSV like "AUD,EUR"

    // Build frankfurter URL
    // frankfurter expects: /latest?base=USD&symbols=EUR,GBP
    const remote = new URL("https://api.frankfurter.app/latest");
    remote.searchParams.set("base", base);
    if (symbolsParam) {
      // frankfurter expects symbols as comma-separated without spaces
      remote.searchParams.set("symbols", symbolsParam);
    }

    const r = await fetch(remote.toString(), { method: "GET" });

    // If upstream returns non-ok, capture body text for debugging and return an error to client
    if (!r.ok) {
      const bodyText = await r.text().catch(() => "");
      console.error("Rates proxy: frankfurter returned non-OK", r.status, bodyText);
      return jsonResponse({ ok: false, error: "upstream_failed", status: r.status, body: bodyText }, 502);
    }

    const j = await r.json().catch(() => null);
    if (!j || !j.rates || typeof j.rates !== "object") {
      console.error("Rates proxy: invalid JSON from frankfurter", j);
      return jsonResponse({ ok: false, error: "no rates" }, 500);
    }

    // frankfurter returns { amount?, base, date, rates:{...} }
    // We want to return { ok:true, rates: { ... } } which your widget expects
    return jsonResponse({ ok: true, rates: j.rates });
  } catch (err) {
    console.error("Rates proxy error", err);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}
