# Supabase setup — The Ledger MVP

This directory holds:

- `migrations/20260519000000_initial.sql` — main schema (profiles,
  trips, forwarded_items, inbox_routes, user_wants, feedback_notes) +
  RLS policies that scope every row to `auth.uid()`.
- `migrations/20260520000000_keys_table.sql` — *optional* keys table +
  provision_key helper. Only needed if you turn on the multi-key-per-user
  flow (see bottom of this README).
- `functions/parse-email/` — *optional* authenticated edge function the
  frontend calls to paste-and-parse a forwarded email.
- `functions/parse-inbound-email/` — *optional* webhook target for
  Postmark Inbound. Routes incoming mail to the right trip.
- `functions/exchange-key/` — *optional* used only by the multi-key flow.
- `config.toml` — function-level JWT verification flags.

## What's required vs optional

**Required for login + first trip + persistence:**
- The Supabase project (URL + anon key in `supabase-config.js`)
- The main schema migration
- That's it — no CLI, no edge functions, no secrets

**Optional for the email parsing layer** (paste-an-email + real
forwarded mail): the two `parse-*` edge functions + Postmark.

**Optional for multi-key-per-user**: the `keys` migration +
`exchange-key` edge function.

## Required setup (5 minutes, no CLI)

You need:
- A Supabase project — create at https://supabase.com/dashboard

### 1. Push the schema

Open SQL Editor in the dashboard → New query → paste the contents of
`migrations/20260519000000_initial.sql` → Run.

### 2. Turn off self-signup

Authentication → Sign In / Up → Email → toggle **"Allow new users to
sign up"** off. Only Lara-provisioned users will be able to sign in.

### 3. Drop the URL + anon key into the app

Edit `supabase-config.js` in the repo root and set both values from
your project's Settings → API page.

## Optional setup — email parsing layer

(Only do this when you're ready to forward real bookings or use the
"paste an email" debug surface.)

You'll need:
- An Anthropic API key (`sk-ant-…`)
- A Postmark account with an Inbound Stream (for live forwarding)
- The Supabase CLI: `brew install supabase/tap/supabase`

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set INBOUND_SECRET=$(openssl rand -hex 24)
supabase functions deploy parse-email
supabase functions deploy parse-inbound-email --no-verify-jwt
```

### 5. Wire up Postmark Inbound

Then in the Postmark dashboard:

1. Create a server, then an "Inbound Stream"
2. Set up DNS: add an MX record on your inbox domain pointing to
   `inbound.postmarkapp.com` (priority 10). Postmark's setup page
   verifies the records.
3. Set the **Webhook URL** to:

   ```
   https://<project-ref>.functions.supabase.co/parse-inbound-email?secret=<INBOUND_SECRET>
   ```

4. Send a test email from the Postmark Inbound page. Within seconds it
   should land in the `forwarded_items` table (if the recipient
   address has a matching `inbox_routes` row for that user/trip).

## Deploying the frontend

The static files (`index.html` + the `mvp-*.jsx` modules) host anywhere
that serves static content. Three free options ordered by friction:

**Vercel — fastest** (CLI, 60 seconds):
```bash
cd <repo root>
npx vercel
```
Follow the prompts (defaults are fine). At the end it prints a URL like
`https://betababy-xxx.vercel.app`. Subsequent pushes redeploy
automatically once you link the repo.

**Cloudflare Pages** (git-driven, no CLI):
1. Cloudflare dashboard → Workers & Pages → Create application → Pages
2. Connect to your GitHub repo
3. Build settings: no build command, output directory `/`
4. Deploy

**Netlify** (drag-and-drop, no CLI):
1. netlify.com → drop the repo folder onto the upload zone
2. Done

After deploy you've got a real URL. Share invites as
`https://your-deploy-url/?k=<the-key>`.

## Provisioning users (URL-as-credential)

Users never see a sign-in screen — Lara hands them a URL like
`https://theledger.app/?k=chloe-7f3k9p` and they're in. No edge function,
no CLI, no email step.

### Add a person

1. Decide on a key for them. Long, random-ish, lowercase + hyphens.
   Examples: `chloe-7f3k9p3q9w`, `lara-test-2k88tt`, `taylor-x7m9p`.
   The regex is `^[a-z0-9][a-z0-9-]{6,127}$`.

2. **Authentication → Users → "Add user → Create new user"**
   - Email: `<key>@theledger.app` (e.g. `chloe-7f3k9p3q9w@theledger.app`)
   - Password: same as the key (e.g. `chloe-7f3k9p3q9w`)
   - **Tick "Auto Confirm User"** — critical, otherwise sign-in won't work

3. **Send the URL** out of band — Signal, iMessage, whatever:

   ```
   https://your-app-url/?k=chloe-7f3k9p3q9w
   ```

That's it. They click; URL strips; they land on Welcome. Their session
persists in localStorage; subsequent visits don't need the URL.

### Revoke access

Authentication → Users → click the user → "Delete user". Their session
on any device fails on next refresh (within ~1 hour).

Or to keep their data but cut access:

```sql
update auth.users set encrypted_password = null where email = 'chloe-7f3k9p3q9w@theledger.app';
```

### See who's signed in

Authentication → Users shows `last_sign_in_at` for each. Or query:

```sql
select email, last_sign_in_at from auth.users order by last_sign_in_at desc nulls last;
```

### A note on multi-device

Same key works on as many devices as the person opens the URL on. Each
device gets its own session (stored in its own localStorage) but they
all point at the same account and see the same trips.

### A note on "multiple keys per user"

This simpler setup is one-key-per-user (since the key is the password).
If you need multiple keys for the same person (e.g. a recoverable
"backup" link), you'd add the `keys` table + `exchange-key` edge
function back — the migration and function code are still in this repo
but unused by default.

## Local development

```bash
supabase start          # spins up Postgres + Auth + Storage locally
supabase functions serve parse-email --env-file ./.env.local
```

Put your local Anthropic key in `supabase/functions/.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
INBOUND_SECRET=local-dev-secret
```

Then point the frontend at the local Supabase by setting
`window.SUPABASE_URL = "http://127.0.0.1:54321"` and the matching local
anon key from `supabase status`.

## Data shape

| Table             | Owned by | Rough contents                                    |
|-------------------|----------|---------------------------------------------------|
| `profiles`        | user     | name, email, city                                 |
| `trips`           | user     | where, dates, vibes, companions, note, items map  |
| `forwarded_items` | user     | parsed email items (kind, title, when, etc.)      |
| `inbox_routes`    | user     | address → (user, trip)                            |
| `user_wants`      | user     | upvoted feature ids                               |
| `feedback_notes`  | user     | "note back to the makers" submissions             |

RLS lets each row only be read/written by `auth.uid()` matching its
`user_id`. The edge function `parse-inbound-email` uses the service role
to bypass RLS for inbound (since Postmark has no concept of the user).

To read all feedback notes as Lara, use the Supabase dashboard's Table
Editor with the service role, or write a tiny SQL query in the editor:

```sql
select sent_at, profiles.email, working, not_working, other, wants
from feedback_notes
join profiles on profiles.id = feedback_notes.user_id
order by sent_at desc;
```
