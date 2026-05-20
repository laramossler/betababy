// ─── Exchange a URL key for a Supabase session ────────────────
// Public endpoint (no JWT). Client posts { key }, we look it up in
// public.keys, mint a magiclink hashed_token via the admin API (no email
// sent), return it. Client uses verifyOtp to set the session.
//
// Deploy: supabase functions deploy exchange-key --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEY_RE = /^[a-z0-9][a-z0-9-]{6,127}$/i;

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-client-info, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }

  const key = String(body?.key || "").trim().toLowerCase();
  if (!KEY_RE.test(key)) return json({ error: "invalid key format" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Look up which user this key belongs to
  const { data: row, error: lookupErr } = await supabase
    .from("keys")
    .select("user_id")
    .eq("key", key)
    .maybeSingle();
  if (lookupErr) return json({ error: "lookup failed" }, 500);
  if (!row) return json({ error: "unknown key" }, 401);

  // Resolve the user's email (needed to generate the magiclink token)
  const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(row.user_id);
  if (userErr || !userData?.user?.email) return json({ error: "user not found" }, 500);

  // Mint a one-shot magic-link hashed_token. generateLink itself does NOT
  // send an email — Supabase only emails when you call signInWithOtp.
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: userData.user.email,
  });
  if (linkErr || !linkData?.properties?.hashed_token) {
    return json({ error: linkErr?.message || "could not mint session" }, 500);
  }

  // Best-effort: update last_used_at (don't block the response on it)
  supabase.from("keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key", key)
    .then(() => {});

  return json({
    email: userData.user.email,
    token_hash: linkData.properties.hashed_token,
  });
});
