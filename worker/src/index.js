// Cloudflare Worker — Ledger MVP
//
// Responsibilities:
//   1. Inbound email (Email Workers): parse → store under the right trip
//   2. HTTP API: list/poll items, paste-an-email debugger, state mirror,
//      feedback sink, inbox registration
//   3. Serve static frontend via [assets] binding
//
// Auth: every /api/* request must carry `x-ledger-key: <userKey>`. The
// key is just a long opaque string Lara hands Chloe out-of-band. All KV
// is namespaced under it so users can't see each other's data even if
// the key ever leaks (one-user product today, but no reason to bake in
// a single-tenant assumption).
//
// Storage shape (KV):
//   inbox:<address>                         → { userKey, tripId }
//   user:<userKey>:state                    → { trips, user, wants, savedAt }
//   user:<userKey>:items:<tripId>           → [ Item, ... ]
//   user:<userKey>:notes                    → [ { sentAt, working, notWorking, other, wants } ]

import PostalMime from "postal-mime";
import { parseEmail } from "./parse.js";

// ─── HTTP helpers ────────────────────────────────────────────
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type,x-ledger-key",
      "access-control-expose-headers": "*",
    },
  });

const corsPreflight = () => new Response(null, {
  status: 204,
  headers: {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,x-ledger-key",
    "access-control-max-age": "86400",
  },
});

// ─── Auth ────────────────────────────────────────────────────
// Key format: 8+ chars, [a-z0-9-]. Lara controls the keys (she generates
// them and shares them — no public signup). Anyone with the key sees the
// data under it, so the key should be long and shared over a private
// channel.
const KEY_RE = /^[a-z0-9][a-z0-9-]{6,63}$/i;

function getUserKey(request) {
  const k = request.headers.get("x-ledger-key") || "";
  if (!KEY_RE.test(k)) return null;
  return k.toLowerCase();
}

// ─── KV helpers ──────────────────────────────────────────────
async function getItems(env, userKey, tripId) {
  const raw = await env.LEDGER_ITEMS.get(`user:${userKey}:items:${tripId}`, "json");
  return Array.isArray(raw) ? raw : [];
}
async function putItems(env, userKey, tripId, items) {
  await env.LEDGER_ITEMS.put(`user:${userKey}:items:${tripId}`, JSON.stringify(items));
}
async function appendItems(env, userKey, tripId, newItems) {
  const existing = await getItems(env, userKey, tripId);
  const byId = new Map(existing.map(it => [it.id, it]));
  for (const it of newItems) {
    byId.set(it.id, { ...byId.get(it.id), ...it, received_at: new Date().toISOString() });
  }
  const merged = Array.from(byId.values());
  await putItems(env, userKey, tripId, merged);
  return merged;
}
async function getRouting(env, address) {
  return env.LEDGER_ITEMS.get(`inbox:${address.toLowerCase()}`, "json");
}
async function setRouting(env, address, userKey, tripId) {
  await env.LEDGER_ITEMS.put(`inbox:${address.toLowerCase()}`, JSON.stringify({ userKey, tripId }));
}

async function getState(env, userKey) {
  const raw = await env.LEDGER_ITEMS.get(`user:${userKey}:state`, "json");
  return raw || null;
}
async function putState(env, userKey, state) {
  await env.LEDGER_ITEMS.put(`user:${userKey}:state`, JSON.stringify({
    ...state,
    savedAt: new Date().toISOString(),
  }));
}

async function appendNote(env, userKey, note) {
  const raw = await env.LEDGER_ITEMS.get(`user:${userKey}:notes`, "json");
  const list = Array.isArray(raw) ? raw : [];
  list.push({ ...note, sentAt: new Date().toISOString() });
  await env.LEDGER_ITEMS.put(`user:${userKey}:notes`, JSON.stringify(list));
}

// ─── HTTP handlers ───────────────────────────────────────────
async function handleApi(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") return corsPreflight();

  const userKey = getUserKey(request);
  if (!userKey) return json({ error: "missing or malformed x-ledger-key" }, 401);

  // ─── State mirror (the source of truth for cross-device sync) ──
  if (path === "/api/state") {
    if (method === "GET") {
      const state = await getState(env, userKey);
      return json({ state });
    }
    if (method === "POST") {
      const body = await request.json();
      // We accept whatever the client sends and trust it (single-tenant
      // per key). Validation could tighten later.
      const next = {
        user: body.user || null,
        trips: Array.isArray(body.trips) ? body.trips : [],
        wants: Array.isArray(body.wants) ? body.wants : [],
      };
      await putState(env, userKey, next);
      return json({ ok: true, savedAt: new Date().toISOString() });
    }
  }

  // ─── Register an inbox → tripId routing ────────────────────
  if (method === "POST" && path === "/api/trips/register") {
    const body = await request.json();
    const { address, tripId } = body || {};
    if (!address || !tripId) return json({ error: "address and tripId required" }, 400);
    await setRouting(env, address, userKey, tripId);
    return json({ ok: true });
  }

  // ─── List items for a trip ─────────────────────────────────
  const itemsMatch = path.match(/^\/api\/trips\/([^/]+)\/items$/);
  if (itemsMatch && method === "GET") {
    const items = await getItems(env, userKey, itemsMatch[1]);
    return json({ items });
  }

  // ─── Paste-an-email debugger ───────────────────────────────
  if (method === "POST" && path === "/api/parse-and-store") {
    const body = await request.json();
    const { tripId, from, subject, text, html } = body || {};
    if (!tripId) return json({ error: "tripId required" }, 400);
    try {
      const items = await parseEmail({ from, subject, text, html }, env);
      const merged = await appendItems(env, userKey, tripId, items);
      return json({ items, total: merged.length });
    } catch (e) {
      return json({ error: String(e.message || e) }, 500);
    }
  }

  // ─── Delete an item ────────────────────────────────────────
  const delMatch = path.match(/^\/api\/trips\/([^/]+)\/items\/([^/]+)$/);
  if (delMatch && method === "DELETE") {
    const [, tripId, itemId] = delMatch;
    const items = await getItems(env, userKey, tripId);
    const next = items.filter(it => it.id !== itemId);
    await putItems(env, userKey, tripId, next);
    return json({ ok: true, items: next });
  }

  // ─── Feedback sink ─────────────────────────────────────────
  if (method === "POST" && path === "/api/feedback") {
    const body = await request.json();
    const note = {
      working: String(body.working || "").slice(0, 8000),
      notWorking: String(body.notWorking || "").slice(0, 8000),
      other: String(body.other || "").slice(0, 8000),
      wants: Array.isArray(body.wants) ? body.wants.slice(0, 20) : [],
    };
    await appendNote(env, userKey, note);
    // Optional: also email Lara so she sees it without checking KV
    if (env.FORWARD_TO_LARA && env.ANTHROPIC_API_KEY) {
      ctx.waitUntil(notifyLara(env, userKey, note).catch(() => {}));
    }
    return json({ ok: true });
  }

  return json({ error: "not found" }, 404);
}

// Best-effort: fire a notification to Lara when a note arrives. Uses
// MailChannels (free for Cloudflare Workers) if available; otherwise
// it just no-ops. Lara can also read notes directly from KV.
async function notifyLara(env, userKey, note) {
  if (!env.FORWARD_TO_LARA) return;
  const body = `Note from ${userKey}\n\n` +
    `WORKING:\n${note.working || "—"}\n\n` +
    `NOT WORKING:\n${note.notWorking || "—"}\n\n` +
    `WANTS NEXT (${note.wants.join(", ") || "—"}):\n${note.other || "—"}`;
  try {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: env.FORWARD_TO_LARA }] }],
        from: { email: `notes@${env.INBOX_DOMAIN || "in.theledger.co"}`, name: "The Ledger" },
        subject: `Note from ${userKey}`,
        content: [{ type: "text/plain", value: body }],
      }),
    });
  } catch (e) { /* swallow — KV write already succeeded */ }
}

// ─── Email handler ───────────────────────────────────────────
async function handleEmail(message, env, ctx) {
  const rawBytes = await new Response(message.raw).arrayBuffer();
  const parsed = await new PostalMime().parse(rawBytes);

  const to = (message.to || parsed.to?.[0]?.address || "").toLowerCase();
  const routing = await getRouting(env, to);
  if (!routing) {
    if (env.FORWARD_TO_LARA) { try { await message.forward(env.FORWARD_TO_LARA); } catch (e) {} }
    console.log(`unknown inbox: ${to}`);
    return;
  }
  const { userKey, tripId } = routing;
  if (!userKey || !tripId) { console.log(`malformed routing for ${to}`); return; }

  const email = {
    from: parsed.from?.address || parsed.from?.name || "",
    subject: parsed.subject || "",
    text: parsed.text || "",
    html: parsed.html || "",
  };
  const items = await parseEmail(email, env);
  await appendItems(env, userKey, tripId, items);
}

// ─── Worker exports ──────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, ctx);
    return env.ASSETS.fetch(request);
  },

  async email(message, env, ctx) {
    try {
      await handleEmail(message, env, ctx);
    } catch (e) {
      console.error("email handler failed:", e);
      if (env.FORWARD_TO_LARA) {
        try { await message.forward(env.FORWARD_TO_LARA); } catch {}
      }
    }
  },
};
