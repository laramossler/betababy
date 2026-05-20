# Supabase setup — The Ledger MVP

This directory holds:

- `migrations/20260519000000_initial.sql` — full schema (profiles, trips,
  forwarded_items, inbox_routes, user_wants, feedback_notes) + RLS
  policies that scope every row to `auth.uid()`.
- `functions/parse-email/` — authenticated edge function the frontend
  calls to paste-and-parse a forwarded email.
- `functions/parse-inbound-email/` — webhook target for Postmark
  Inbound. Uses the service role to bypass RLS so it can write to any
  user's rows based on the inbox routing table.
- `config.toml` — function-level JWT verification flags.

## One-time setup

You need:

- A Supabase project — create at https://supabase.com/dashboard
- An Anthropic API key (`sk-ant-…`)
- A Postmark account with an Inbound Stream (for live email forwarding)
- Supabase CLI: `brew install supabase/tap/supabase` (or see docs)

### 1. Link the local project to your Supabase instance

```bash
supabase link --project-ref <your-project-ref>
```

Project ref is the part before `.supabase.co` in your project URL.

### 2. Push the schema

```bash
supabase db push
```

Or — easier first time — open the SQL Editor in the dashboard and paste
the contents of `migrations/20260519000000_initial.sql`.

### 3. Set function secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set INBOUND_SECRET=$(openssl rand -hex 24)
```

Save the `INBOUND_SECRET` value somewhere — you'll paste it into the
Postmark webhook URL in step 5.

### 4. Deploy the edge functions

```bash
supabase functions deploy parse-email
supabase functions deploy parse-inbound-email --no-verify-jwt
```

### 5. Wire up Postmark Inbound

In the Postmark dashboard:

1. Create a server, then a "Inbound Stream"
2. Note the inbound address it gives you, e.g. `<hash>@inbound.postmarkapp.com`
3. Set up DNS: add an MX record on your domain pointing to
   `inbound.postmarkapp.com` (priority 10). Postmark's docs walk through
   this; the setup page checks your records live.
4. Set the **Webhook URL** to:

   ```
   https://<project-ref>.functions.supabase.co/parse-inbound-email?secret=<INBOUND_SECRET>
   ```

5. Send a test email from the Postmark Inbound page. Within seconds it
   should appear in the `forwarded_items` table if (and only if) the
   recipient address has a matching row in `inbox_routes` for that
   user/trip.

Once that's working, real emails forwarded to
`chloe.rome.<tag>@<your-domain>` (where your domain has the MX record
pointing at Postmark) will land in the user's trip.

### 6. Wire up the frontend

In `index.html` or `supabase-config.js`, set:

```js
window.SUPABASE_URL = "https://<project-ref>.supabase.co";
window.SUPABASE_ANON_KEY = "<anon-key from project settings>";
```

The anon key is safe to expose — RLS protects the data.

### 7. (Optional) Customise the auth email

Supabase sends magic links from `noreply@mail.supabase.io` by default —
fine for testing. To send from your own domain, configure SMTP in
Authentication → Settings (Resend, Postmark Transactional, or any
provider).

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
