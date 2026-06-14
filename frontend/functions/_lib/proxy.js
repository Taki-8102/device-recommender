// Shared reverse-proxy handler for Cloudflare Pages Functions.
// Forwards the incoming request to the Render backend SERVER-SIDE, so the
// visitor's browser only ever talks to the Cloudflare (*.pages.dev) domain.
// This bypasses ISP/country blocks on onrender.com without a VPN.
export async function proxy(context) {
  const { request, env } = context;
  const backend = ((env && env.BACKEND_URL) || "https://device-recommender-ttm8.onrender.com").replace(/\/$/, "");
  const url = new URL(request.url);
  const target = backend + url.pathname + url.search;
  // Re-create the request against the backend URL, preserving method, headers,
  // and body (including streaming for SSE on /recommend/stream).
  return fetch(new Request(target, request));
}
