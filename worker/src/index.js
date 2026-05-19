// Cloudflare Worker — Ledger MVP
//
// Three responsibilities:
//   1. Inbound email (Email Workers): parse → store under the right trip
//   2. HTTP API: list/poll items, paste-an-email debugger, register inboxes
//   3. Serve static frontend via the [assets] binding (configured in
//      wrangler.toml). Anything not /api/* falls through to the assets handler.
//
// Storage shape (KV):
//   inbox:<address>           → { tripId }            // routing table
//   items:<tripId>            → [ Item, ... ]         // append-only list
//   trips:<tripId>            → { id, where, ... }    // optional metadata
//
// Conventions:
//   - Inbox address format: chloe.<slug>.<tag>@in.theledger.co
//   - Items dedupe on item.id (SHA1 of kind+title+when+where)

import PostalMime from "postal-mime";
import { parseEmail } from "./parse.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

const corsPreflight = () => new Response(null, {
  status: 204,
  headers: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  },
});

// ─── KV helpers ──────────────────────────────────────────────
async function getItems(env, tripId) {
  const raw = await env.LEDGER_ITEMS.get(`items:${tripId}`, "json");
  return Array.isArray(raw) ? raw : [];
}
async function putItems(env, tripId, items) {
  await env.LEDGER_ITEMS.put(`items:${tripId}`, JSON.stringify(items));
}
async function getRouting(env, address) {
  return env.LEDGER_ITEMS.get(`inbox:${address.toLowerCase()}`, "json");
}
async function setRouting(env, address, tripId) {
  await env.LEDGER_ITEMS.put(`inbox:${address.toLowerCase()}`, JSON.stringify({ tripId }));
}

async function appendItems(env, tripId, newItems) {
  const existing = await getItems(env, tripId);
  const byId = new Map(existing.map(it => [it.id, it]));
  for (const it of newItems) {
    byId.set(it.id, { ...byId.get(it.id), ...it, received_at: new Date().toISOString() });
  }
  const merged = Array.from(byId.values());
  await putItems(env, tripId, merged);
  return merged;
}

// ─── HTTP handlers ───────────────────────────────────────────
async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") return corsPreflight();

  // Register an inbox → tripId. Called by the frontend when a trip is committed.
  if (method === "POST" && path === "/api/trips/register") {
    const body = await request.json();
    const { address, tripId } = body || {};
    if (!address || !tripId) return json({ error: "address and tripId required" }, 400);
    await setRouting(env, address, tripId);
    return json({ ok: true });
  }

  // List items for a trip
  const itemsMatch = path.match(/^\/api\/trips\/([^/]+)\/items$/);
  if (itemsMatch && method === "GET") {
    const tripId = itemsMatch[1];
    const items = await getItems(env, tripId);
    return json({ items });
  }

  // Paste-an-email debugger — used by the frontend before DNS is hot
  if (method === "POST" && path === "/api/parse-and-store") {
    const body = await request.json();
    const { tripId, from, subject, text, html } = body || {};
    if (!tripId) return json({ error: "tripId required" }, 400);
    try {
      const items = await parseEmail({ from, subject, text, html }, env);
      const merged = await appendItems(env, tripId, items);
      return json({ items, total: merged.length });
    } catch (e) {
      return json({ error: String(e.message || e) }, 500);
    }
  }

  // Delete a single item from a trip (manual cleanup if parse went sideways)
  const delMatch = path.match(/^\/api\/trips\/([^/]+)\/items\/([^/]+)$/);
  if (delMatch && method === "DELETE") {
    const [, tripId, itemId] = delMatch;
    const items = await getItems(env, tripId);
    const next = items.filter(it => it.id !== itemId);
    await putItems(env, tripId, next);
    return json({ ok: true, items: next });
  }

  return json({ error: "not found" }, 404);
}

// ─── Email handler ───────────────────────────────────────────
async function handleEmail(message, env, ctx) {
  // Cloudflare Email Workers give us the raw RFC822 stream on `message.raw`
  const rawBytes = await new Response(message.raw).arrayBuffer();
  const parsed = await new PostalMime().parse(rawBytes);

  const to = (message.to || parsed.to?.[0]?.address || "").toLowerCase();
  const routing = await getRouting(env, to);
  if (!routing) {
    // Unknown inbox — drop quietly. Forward to Lara as a backup if configured.
    if (env.FORWARD_TO_LARA) {
      try { await message.forward(env.FORWARD_TO_LARA); } catch (e) {}
    }
    console.log(`unknown inbox: ${to}`);
    return;
  }
  const { tripId } = routing;

  const email = {
    from: parsed.from?.address || parsed.from?.name || "",
    subject: parsed.subject || "",
    text: parsed.text || "",
    html: parsed.html || "",
  };

  const items = await parseEmail(email, env);
  await appendItems(env, tripId, items);
}

// ─── Worker exports ──────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, ctx);
    }
    // Fall through to static assets (the frontend)
    return env.ASSETS.fetch(request);
  },

  async email(message, env, ctx) {
    try {
      await handleEmail(message, env, ctx);
    } catch (e) {
      console.error("email handler failed:", e);
      // If parsing fails, at least forward the raw to Lara so nothing is lost
      if (env.FORWARD_TO_LARA) {
        try { await message.forward(env.FORWARD_TO_LARA); } catch {}
      }
    }
  },
};
