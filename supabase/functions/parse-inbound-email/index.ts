// ─── Inbound email handler ────────────────────────────────────
// Hooked up as a Postmark Inbound webhook. Receives the parsed email
// payload, looks up which trip the recipient address belongs to, asks
// Claude to extract structured items, and inserts them into the
// forwarded_items table.
//
// Deploy: supabase functions deploy parse-inbound-email --no-verify-jwt
// Postmark uses Basic Auth for inbound webhooks; we verify INBOUND_SECRET
// instead via a query param (?secret=...) since Postmark supports custom
// webhook URLs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────
type ParsedItem = {
  id: string;
  kind: "hotel" | "flight" | "restaurant" | "transfer" | "event" | "other";
  title: string;
  when: string | null;
  end: string | null;
  where: string | null;
  party: number | null;
  details: string;
  confidence: number;
  raw_excerpt: string;
};

// ─── Claude parser ────────────────────────────────────────────
const SYSTEM_PROMPT = `You read forwarded travel confirmation emails and extract structured items.

Tone for the "details" field:
- short, statement-form, no marketing language
- no "great", "amazing", "wonderful", "perfect"
- one short sentence describing the thing in concierge voice
- example good: "The corner suite. Sea side. Check-in from 14:00."
- example bad:  "Amazing 5-star resort with stunning views!"

Return strictly valid JSON matching this schema:
{ "items": [ Item, ... ] }

Item: {
  "kind": "hotel" | "flight" | "restaurant" | "transfer" | "event" | "other",
  "title": string,            // 60 chars max
  "when": string | null,      // ISO 8601 datetime. Local time of the venue.
  "end":  string | null,      // checkout for hotels, arrival for flights
  "where": string | null,     // city, address, or airport code
  "party": number | null,     // restaurants only
  "details": string,          // 1-2 short sentences max, concierge tone
  "confidence": number,       // 0..1
  "raw_excerpt": string       // 200 chars from the source that justifies this
}

Rules:
- Multiple bookings in one email → multiple items.
- If you can't determine \`when\`, return null. Don't guess.
- Flights: title is "AA 100 · JFK → LHR".
- Hotels: title is "Aman Tokyo · Suite 3304" (only include room number if explicit).
- Transfers: title is "Driver · NCE → Cap-Ferrat", when is pickup.
- Output JSON only — no prose, no markdown.`;

async function sha1Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).slice(0, 8)
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

async function parseWithClaude(email: { from: string; subject: string; text: string }, apiKey: string): Promise<ParsedItem[]> {
  const body = (email.text || "").slice(0, 12000);
  const userPrompt = `From: ${email.from || "(unknown)"}
Subject: ${email.subject || "(no subject)"}

---

${body}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`anthropic ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const raw = (json.content?.[0]?.text || "").trim();
  const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(stripped);
  const items: Omit<ParsedItem, "id">[] = Array.isArray(parsed.items) ? parsed.items : [];
  return Promise.all(items.map(async (it) => ({
    ...it,
    id: await sha1Hex(`${it.kind}|${it.title}|${it.when}|${it.where}`),
  })));
}

// ─── Entry point ──────────────────────────────────────────────
Deno.serve(async (req) => {
  // Postmark passes the webhook secret in the URL: ?secret=XXX
  const url = new URL(req.url);
  const presentedSecret = url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("INBOUND_SECRET");
  if (!expectedSecret || presentedSecret !== expectedSecret) {
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  let payload: any;
  try { payload = await req.json(); }
  catch { return new Response("bad json", { status: 400 }); }

  // Postmark Inbound payload shape:
  // { To, ToFull[{Email}], From, Subject, TextBody, HtmlBody, ... }
  const to = (payload.ToFull?.[0]?.Email || payload.To || "").toLowerCase().trim();
  if (!to) return new Response("no recipient", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up which trip + user this address belongs to
  const { data: route, error: routeErr } = await supabase
    .from("inbox_routes")
    .select("user_id, trip_id")
    .eq("address", to)
    .maybeSingle();
  if (routeErr) return new Response(`db error: ${routeErr.message}`, { status: 500 });
  if (!route) {
    // Unknown inbox — return 200 so Postmark doesn't retry, but log it.
    console.warn(`unknown inbox: ${to}`);
    return new Response("unknown inbox", { status: 200 });
  }

  const email = {
    from: payload.From || payload.FromFull?.Email || "",
    subject: payload.Subject || "",
    text: payload.TextBody || payload.HtmlBody?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") || "",
  };

  let items: ParsedItem[];
  try {
    items = await parseWithClaude(email, Deno.env.get("ANTHROPIC_API_KEY")!);
  } catch (e) {
    console.error("parse failed:", e);
    return new Response(`parse failed: ${(e as Error).message}`, { status: 500 });
  }

  // Insert (or update on conflict) each item. (trip_id, id) is the PK.
  const rows = items.map(it => ({
    id: it.id,
    trip_id: route.trip_id,
    user_id: route.user_id,
    kind: it.kind,
    title: it.title,
    when_at: it.when,
    end_at: it.end,
    where_text: it.where,
    party: it.party,
    details: it.details,
    confidence: it.confidence,
    raw_excerpt: it.raw_excerpt,
  }));

  if (rows.length === 0) {
    return new Response(JSON.stringify({ ok: true, items: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  const { error: upsertErr } = await supabase
    .from("forwarded_items")
    .upsert(rows, { onConflict: "trip_id,id" });
  if (upsertErr) return new Response(`upsert error: ${upsertErr.message}`, { status: 500 });

  return new Response(JSON.stringify({ ok: true, items: rows.length }), {
    headers: { "content-type": "application/json" },
  });
});
