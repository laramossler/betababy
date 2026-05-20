// ─── Authenticated paste-and-parse ────────────────────────────
// Called by the frontend when the user pastes an email into the trip
// detail. Uses the caller's JWT so RLS still applies.
//
// Deploy: supabase functions deploy parse-email

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SYSTEM_PROMPT = `You read forwarded travel confirmation emails and extract structured items.

Tone for the "details" field:
- short, statement-form, no marketing language
- one short sentence describing the thing in concierge voice
- example good: "The corner suite. Sea side. Check-in from 14:00."

Return strictly valid JSON: { "items": [ Item, ... ] }

Item: { "kind": "hotel"|"flight"|"restaurant"|"transfer"|"event"|"other",
  "title": string, "when": string|null, "end": string|null,
  "where": string|null, "party": number|null, "details": string,
  "confidence": number, "raw_excerpt": string }

Rules:
- Multiple bookings → multiple items.
- Can't determine \`when\`? Return null. Don't guess.
- Output JSON only.`;

async function sha1Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).slice(0, 8)
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

async function parseWithClaude(email: { from: string; subject: string; text: string }, apiKey: string) {
  const userPrompt = `From: ${email.from || "(unknown)"}
Subject: ${email.subject || "(no subject)"}

---

${(email.text || "").slice(0, 12000)}`;

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
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const raw = (json.content?.[0]?.text || "").trim();
  const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(stripped);
  const items: any[] = Array.isArray(parsed.items) ? parsed.items : [];
  return Promise.all(items.map(async (it: any) => ({
    ...it,
    id: await sha1Hex(`${it.kind}|${it.title}|${it.when}|${it.where}`),
  })));
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response("missing bearer", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response("unauthorized", { status: 401, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const { tripId, from, subject, text } = body || {};
  if (!tripId || !text) {
    return new Response(JSON.stringify({ error: "tripId and text required" }), {
      status: 400, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  // Confirm the trip belongs to this user (RLS would also block, but explicit is clearer)
  const { data: trip, error: tripErr } = await supabase
    .from("trips").select("id").eq("id", tripId).maybeSingle();
  if (tripErr || !trip) {
    return new Response(JSON.stringify({ error: "trip not found" }), {
      status: 404, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let items;
  try {
    items = await parseWithClaude({ from, subject, text }, Deno.env.get("ANTHROPIC_API_KEY")!);
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const rows = items.map(it => ({
    id: it.id, trip_id: tripId, user_id: user.id,
    kind: it.kind, title: it.title,
    when_at: it.when, end_at: it.end, where_text: it.where,
    party: it.party, details: it.details,
    confidence: it.confidence, raw_excerpt: it.raw_excerpt,
  }));

  if (rows.length > 0) {
    const { error: upsertErr } = await supabase
      .from("forwarded_items").upsert(rows, { onConflict: "trip_id,id" });
    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ items: rows, total: rows.length }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
