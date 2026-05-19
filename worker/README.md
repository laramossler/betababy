# Ledger MVP Worker

Cloudflare Worker that:

1. **Receives inbound email** (Email Workers) at `*@in.theledger.co` (or whatever
   domain you set up), parses it with Claude, and stores structured items
   under the trip whose inbox address matches.
2. **Serves the static frontend** from the parent directory (`../`).
3. **Exposes a JSON API** at `/api/*` for the frontend to register inboxes,
   list items, manually paste an email for testing, and delete bad parses.

## One-time setup

You need:
- A Cloudflare account (free)
- A domain whose nameservers point at Cloudflare (15-min DNS change if it's
  elsewhere)
- An Anthropic API key (`sk-ant-…`) — grab at https://console.anthropic.com

### 1. Install dependencies

```bash
cd worker
npm install
npx wrangler login
```

### 2. Create the KV namespace

```bash
npx wrangler kv namespace create LEDGER_ITEMS
```

Paste the printed `id = "…"` into `wrangler.toml` (replacing
`REPLACE_WITH_KV_NAMESPACE_ID`).

### 3. Set secrets

```bash
npx wrangler secret put ANTHROPIC_API_KEY
# paste your sk-ant-… key when prompted

# optional — anything that can't be routed gets forwarded here as a backup
npx wrangler secret put FORWARD_TO_LARA
# paste your email when prompted
```

### 4. First deploy

```bash
npx wrangler deploy
```

This deploys at `https://ledger-mvp.<your-subdomain>.workers.dev`. Open it
in a browser — the static MVP should load and the API should respond at
`/api/trips/test/items`.

### 5. Bind a custom domain (so the frontend lives at theledger.co)

In the Cloudflare dashboard:
- Workers & Pages → ledger-mvp → Settings → Triggers → Custom Domains
- Add `theledger.co` (or whatever subdomain you want for the app)
- Cloudflare wires DNS automatically since the domain is on your account

### 6. Wire up Email Routing

In the Cloudflare dashboard:
- Email → Email Routing
- Enable routing for your domain (`in.theledger.co` recommended as a
  dedicated inbox subdomain — keep your main domain's email separate)
- Verify the DNS records Cloudflare adds (MX, SPF, etc.)
- Email Workers → "Catch-all address" → Action: **Send to a Worker** →
  pick `ledger-mvp`

That's it. Anything mailed to `anything@in.theledger.co` now hits the
worker's `email()` handler.

### 7. Sanity check

Open the deployed app, walk through the first trip, copy the inbox address
on the Forward step. Forward any old confirmation email from your inbox to
that address. Switch back to the trip detail in the app — it should appear
within a few seconds (the page refreshes parsed items on focus).

Or use the **Paste an email to test the parser** button on the trip detail
to skip DNS entirely while testing.

## Development

```bash
# Local dev — runs on http://127.0.0.1:8787
npx wrangler dev

# Tail production logs
npx wrangler tail
```

For local dev, the frontend's API base defaults to same-origin. To point at
the deployed worker from `localhost`, open the browser console and set:

```js
window.LEDGER_API_BASE = "https://ledger-mvp.<your-subdomain>.workers.dev"
```

## Storage shape (KV)

| Key                    | Value                                           |
|------------------------|-------------------------------------------------|
| `inbox:<address>`      | `{ tripId }` — routes incoming mail to a trip   |
| `items:<tripId>`       | array of parsed items (dedup'd by item id)      |
| `trips:<tripId>`       | optional trip metadata (reserved for later)     |

Items are dedup'd on a SHA-1 of `kind + title + when + where`, so forwarding
the same confirmation twice doesn't duplicate.

## API

| Method   | Path                                              | Description                              |
|----------|---------------------------------------------------|------------------------------------------|
| POST     | `/api/trips/register`                             | Body: `{ address, tripId }` — route mail |
| GET      | `/api/trips/:tripId/items`                        | List parsed items for a trip             |
| POST     | `/api/parse-and-store`                            | Body: `{ tripId, text, from?, subject? }` — paste-an-email debugger |
| DELETE   | `/api/trips/:tripId/items/:itemId`                | Remove a single item                     |

## Parser notes

- Uses `claude-sonnet-4-6` with ephemeral prompt caching for the persona.
- Costs are pennies per email at typical confirmation length.
- The parser's system prompt is in `src/parse.js` — tune the tone there if
  Margaux's voice should soak through.
- If a parse fails, the raw email is forwarded to `FORWARD_TO_LARA` (if set)
  so nothing is lost.
