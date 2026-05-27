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

## Auth configuration (real users, real emails)

The app uses Supabase magic-link auth. Each user signs in by typing
their email — we send them a one-tap link, they click it, they're in.
No password to remember. Sessions auto-refresh.

Three things to set in the Supabase dashboard:

1. **Authentication → Providers → Email**
   - **"Allow new users to sign up"** → ON (anyone with a valid email
     can join). If you want invite-only, leave it OFF and pre-create
     each user via Authentication → Users → "Add user".
   - **"Confirm email"** → ON (so the magic link is required; default).

2. **Authentication → URL Configuration**
   - **Site URL** → your deploy URL (e.g. `https://chloeledger.vercel.app`)
   - **Redirect URLs** → add a pattern for your deploy and for local
     dev, e.g.
     ```
     https://chloeledger.vercel.app/**
     http://localhost:3000/**
     http://localhost:5173/**
     ```
   - Without this, Supabase rejects the magic-link redirect for
     security and the user gets stuck on "site can't be reached".

3. **(Optional) Custom SMTP** — Authentication → Emails → SMTP Settings.
   By default Supabase sends magic links from `noreply@mail.supabase.io`
   — fine for testing. For a branded "from" address, plug in Resend
   (free 100/day), Postmark, or any SMTP provider. The default is
   rate-limited to ~2/hour per email, so move to custom SMTP before
   you have ~10 active testers.

## Migrating off the URL-key flow

If you tested with the URL-key + synthetic emails approach, those
accounts have emails like `chloe-7f3k9p3q9w@theledger.app`. They still
work as is — the user can sign in by entering that synthetic email —
but it's cleaner to delete them and have real users sign in fresh.

```sql
-- Delete a test account and all its data (cascades)
delete from auth.users where email like '%@theledger.app';
```

Or to keep a specific account but switch it to a real email:

```sql
update auth.users
   set email = 'chloe@gmail.com', email_confirmed_at = now()
 where email = 'chloe-7f3k9p3q9w@theledger.app';
```

## Managing users

### Invite a specific person (signups off)

If you've turned signup off, add them manually:
**Authentication → Users → "Add user → Send invitation"** with their
email. They get an invite link, click it, signed in.

### See who's signed in

Authentication → Users shows `last_sign_in_at`. Or query:

```sql
select email, last_sign_in_at
from auth.users
order by last_sign_in_at desc nulls last;
```

### Revoke a user

Authentication → Users → click → "Delete user" cascades and removes
all their data. Or to ban but keep their data:

```sql
update auth.users set banned_until = '2099-01-01' where email = '...';
```

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
