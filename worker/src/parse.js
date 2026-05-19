// Claude-powered email parser. Takes a forwarded confirmation email
// and returns one or more structured items the app can render on a day.
//
// Items always conform to:
//   {
//     id: string,            // stable hash
//     kind: "hotel"|"flight"|"restaurant"|"transfer"|"event"|"other",
//     title: string,         // headline ("Aman Tokyo · 3304")
//     when: string|null,     // ISO datetime if known, else null
//     end: string|null,      // ISO datetime if known (checkout, arrival, etc.)
//     where: string|null,    // city/address/airport
//     party: number|null,    // pax for restaurants
//     details: string,       // 1-2 line concierge-tone summary
//     confidence: 0..1,      // how sure the model is
//     raw_excerpt: string,   // 200-char excerpt for debugging
//   }

const SYSTEM_PROMPT = `You read forwarded travel confirmation emails and extract structured items.

You are extracting for a private editorial-luxury trip ledger. Tone for the "details" field:
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
  "end":  string | null,      // for hotels: checkout. For flights: arrival.
  "where": string | null,     // city, address, or airport code
  "party": number | null,     // for restaurants only
  "details": string,          // 1-2 short sentences max, concierge tone
  "confidence": number,       // 0..1, your honesty
  "raw_excerpt": string       // 200 chars from the source that justifies this
}

Rules:
- If the email contains multiple bookings (e.g. a hotel + flight chain), return multiple items.
- If you can't determine \`when\`, return null. Don't guess.
- Restaurants: \`when\` is the reservation datetime, \`party\` is the headcount.
- Flights: \`title\` is "AA 100 · JFK → LHR", \`when\` is departure, \`end\` is arrival.
- Hotels: \`title\` is "Aman Tokyo · Suite 3304" (room only if explicitly named).
- Transfers: \`title\` is "Driver · NCE → Cap-Ferrat", \`when\` is pickup time.
- Output JSON only — no prose, no markdown, no preamble.`;

function userPrompt(email) {
  const { subject, from, text, html } = email;
  const body = (text || "").slice(0, 12000) || (html || "").slice(0, 12000);
  return `From: ${from || "(unknown)"}
Subject: ${subject || "(no subject)"}

---

${body}`;
}

// Stable hash for deduplicating identical items on retries.
async function hashItem(item) {
  const data = JSON.stringify({
    kind: item.kind, title: item.title, when: item.when, where: item.where,
  });
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).slice(0, 8)
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function parseEmail(email, env) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userPrompt(email) }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`anthropic ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const raw = (json.content?.[0]?.text || "").trim();
  // Tolerate model occasionally wrapping in ```json fences
  const stripped = raw.replace(/^```(?:json)?\n?/, "").replace(/```$/, "").trim();
  let parsed;
  try { parsed = JSON.parse(stripped); }
  catch (e) { throw new Error(`parser produced non-JSON: ${raw.slice(0, 400)}`); }
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  // Attach stable ids
  const withIds = await Promise.all(items.map(async (it) => ({
    ...it,
    id: await hashItem(it),
  })));
  return withIds;
}
