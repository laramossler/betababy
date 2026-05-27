// ─── MVP APP ─ Supabase-backed, magic-link auth ──────────────
// All data lives in Supabase Postgres. RLS scopes every row to the
// signed-in user. Frontend talks directly to Supabase via the JS SDK
// for everything except email parsing, which goes through the
// `parse-email` edge function so the Anthropic key never leaves the
// server side.

const { useState, useMemo, useEffect, useRef, useCallback } = React;
const { C, F, Mono, SC, Btn, Welcome, YouStep, TripStep, CompanionsStep, ForwardStep, ReadyStep } = window.MVP;
const { Home } = window.HOME;
const { TripDetail } = window.TRIP_DETAIL;

// ─── Supabase client ─────────────────────────────────────────
const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";
const supabase = window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

// ─── localStorage cache (offline-first feel) ──────────────────
const CACHE_KEY = "ledger.mvp.cache.v1";
const DRAFT_KEY = "ledger.mvp.draft.v1";

const loadCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; } };
const saveCache = (s) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {} };
const clearCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch {} };

const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; } };
const saveDraft = (d) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} };
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

// ─── Supabase data layer ─────────────────────────────────────
// All callers handle a null `supabase` (e.g. when config hasn't been
// filled in yet) by returning empty/false — the UI degrades to local-only.
function makeApi(client, userId) {
  if (!client || !userId) return null;
  return {
    async fetchProfile() {
      const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) return null;
      return data;
    },
    async updateProfile(patch) {
      const { error } = await client.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", userId);
      return !error;
    },
    async fetchTrips() {
      const { data, error } = await client.from("trips").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      if (error) return [];
      return (data || []).map(rowToTrip);
    },
    async upsertTrip(trip) {
      const row = tripToRow(trip, userId);
      const { error } = await client.from("trips").upsert(row, { onConflict: "id" });
      return !error;
    },
    async registerRoute(address, tripId) {
      const { error } = await client.from("inbox_routes").upsert({
        address: address.toLowerCase(), user_id: userId, trip_id: tripId,
      }, { onConflict: "address" });
      return !error;
    },
    async getItems(tripId) {
      const { data, error } = await client.from("forwarded_items")
        .select("*").eq("trip_id", tripId).order("when_at", { ascending: true });
      if (error) return [];
      return (data || []).map(rowToItem);
    },
    async deleteItem(tripId, itemId) {
      const { error } = await client.from("forwarded_items").delete().eq("trip_id", tripId).eq("id", itemId);
      return !error;
    },
    async fetchWants() {
      const { data, error } = await client.from("user_wants").select("feature_id").eq("user_id", userId);
      if (error) return [];
      return (data || []).map(r => r.feature_id);
    },
    async toggleWant(featureId, on) {
      if (on) {
        await client.from("user_wants").upsert({ user_id: userId, feature_id: featureId });
      } else {
        await client.from("user_wants").delete().eq("user_id", userId).eq("feature_id", featureId);
      }
    },
    async sendFeedback(note) {
      const { error } = await client.from("feedback_notes").insert({
        user_id: userId,
        working: note.working || "",
        not_working: note.notWorking || "",
        other: note.other || "",
        wants: note.wants || [],
      });
      return !error;
    },
    async pasteEmail({ tripId, from, subject, text }) {
      const { data, error } = await client.functions.invoke("parse-email", {
        body: { tripId, from, subject, text },
      });
      if (error) throw new Error(error.message || "edge function failed");
      return data;
    },
  };
}

// Row ↔ object mappers (Postgres uses snake_case + reserved words)
function rowToTrip(row) {
  return {
    id: row.id,
    where: row.where_text || "",
    start: row.start_date || "",
    end: row.end_date || "",
    note: row.note || "",
    companions: Array.isArray(row.companions) ? row.companions : [],
    vibes: Array.isArray(row.vibes) ? row.vibes : [],
    items: row.items || {},
    address: row.address || "",
  };
}
function tripToRow(t, userId) {
  return {
    id: t.id,
    user_id: userId,
    where_text: t.where || "",
    start_date: t.start || null,
    end_date: t.end || null,
    note: t.note || "",
    companions: t.companions || [],
    vibes: t.vibes || [],
    items: t.items || {},
    address: t.address || null,
  };
}
function rowToItem(row) {
  return {
    id: row.id,
    kind: row.kind || "other",
    title: row.title || "",
    when: row.when_at,
    end: row.end_at,
    where: row.where_text,
    party: row.party,
    details: row.details || "",
    confidence: row.confidence,
    raw_excerpt: row.raw_excerpt,
    received_at: row.received_at,
  };
}

// ─── Trip id counter ─────────────────────────────────────────
let _tripCounter = 0;
const nextTripId = () => `t${(++_tripCounter).toString().padStart(3, "0")}`;
function syncCounter(trips) {
  const max = (trips || []).reduce((m, t) => {
    const n = parseInt(String(t.id).replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  _tripCounter = Math.max(_tripCounter, max);
}

function buildAddress(name, where) {
  const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "trip";
  const first = slug(name).split(" ")[0];
  const tag = Math.random().toString(36).slice(2, 5);
  return `${first}.${slug(where)}.${tag}@in.theledger.co`;
}

const EMPTY_TRIP = { where: "", start: "", end: "", note: "", companions: [], vibes: [] };
const FIRST_RUN_STEPS = ["you", "trip", "companions", "forward"];
const REPEAT_STEPS    = ["trip", "companions", "forward"];
const DEFAULT_USER = { name: "Chloe", email: "", city: "Hong Kong" };
const RESUMABLE = new Set(["you", "trip", "companions", "forward", "home", "detail"]);

// ─── Auth via email magic link + 6-digit code ────────────────
// Supabase sends BOTH a link and a 6-digit code in every "magic link"
// email. We surface both so we're robust against the common failure:
// email clients (WhatsApp, iOS Mail, etc.) often pre-fetch URLs for
// link previews, which consumes the one-shot token before the user
// can click it. The code is unaffected by pre-fetching.
//
// Supabase configuration required:
//   - Authentication → Providers → Email → "Allow new users to sign up" ON
//   - Authentication → URL Configuration → Site URL = your deploy URL
//     (must include https://)
//   - Authentication → URL Configuration → Redirect URLs include
//     https://your-deploy/** and any local dev URL.

// Pull any error Supabase put in the URL hash on a failed redirect
// (e.g. expired/already-used link). Returns a human message + strips
// the hash so we don't keep showing the same error.
function consumeURLAuthError() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  if (!hash.includes("error")) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("error_code") || params.get("error");
  const desc = params.get("error_description")?.replace(/\+/g, " ") || "";
  let msg;
  if (code === "otp_expired") {
    msg = "That link was already used or has expired. Request a new one — the 6-digit code in the email also works.";
  } else if (desc) {
    msg = desc;
  } else if (code) {
    msg = code;
  } else {
    msg = "Sign-in failed. Try again.";
  }
  try { window.history.replaceState({}, "", window.location.pathname); } catch {}
  return msg;
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("enter"); // enter | sent | verifying
  const [error, setError] = useState(() => consumeURLAuthError() || "");

  const send = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("That doesn't look like an email."); return;
    }
    setStage("verifying"); setError("");
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (otpErr) { setStage("enter"); setError(otpErr.message); return; }
    setStage("sent"); setCode("");
  };

  const verify = async () => {
    if (code.length < 6) return;
    setStage("verifying"); setError("");
    const { error: otpErr } = await supabase.auth.verifyOtp({
      type: "email",
      email: email.trim().toLowerCase(),
      token: code.trim(),
    });
    if (otpErr) {
      setStage("sent");
      setError(otpErr.message || "That code didn't work — check the latest email.");
      return;
    }
    // Success — onAuthStateChange in Root flips the session and renders App
  };

  const reset = () => { setStage("enter"); setCode(""); setError(""); };

  // Common shell — monogram top, error banner if any, body in the middle
  const shell = (body, footer) => (
    <div style={{ height: "100%", padding: "80px 30px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `radial-gradient(ellipse at 50% 25%, #1A1815 0%, #0A0908 60%)`, animation: "fadeIn 0.6s ease both" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 36 }}>
        <Mono s={38} />
      </div>
      {error && (
        <div style={{ padding: "10px 14px", border: `0.5px solid ${C.blush}55`, background: `${C.blush}10`, marginTop: 20 }}>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.blush, fontStyle: "italic", lineHeight: 1.5, textAlign: "center" }}>{error}</p>
        </div>
      )}
      {body}
      {footer}
    </div>
  );

  if (stage === "sent" || stage === "verifying") {
    return shell(
      <div style={{ textAlign: "center" }}>
        <SC color={C.gold} size={9} style={{ display: "inline-block", marginBottom: 22 }}>Check your inbox</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 28, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, color: C.cream, marginBottom: 16 }}>
          Enter the 6-digit<br/>code from your email.
        </h1>
        <p style={{ fontFamily: F.body, fontSize: 14, fontWeight: 300, lineHeight: 1.5, color: C.creamSoft, maxWidth: 290, margin: "0 auto 22px" }}>
          We sent it to <span style={{ color: C.cream }}>{email}</span>. Tap the link in the email or paste the code here — either works.
        </p>
        <input
          type="text" inputMode="numeric" autoComplete="one-time-code"
          maxLength={6} value={code}
          onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
          onKeyDown={e => e.key === "Enter" && verify()}
          placeholder="000000"
          autoFocus
          style={{
            fontFamily: F.mono, fontSize: 28, color: C.cream,
            padding: "10px 0 12px", borderBottom: `0.5px solid ${C.borderLight}`,
            textAlign: "center", letterSpacing: 8, maxWidth: 220,
            margin: "0 auto", display: "block",
          }}
        />
      </div>,
      <div>
        <Btn full primary onClick={verify} disabled={stage === "verifying" || code.length < 6}>
          {stage === "verifying" ? "Signing in…" : "Continue"}
        </Btn>
        <button onClick={reset} style={{
          marginTop: 14, width: "100%",
          background: "none", border: "none", color: C.stone, cursor: "pointer",
          fontFamily: F.sans, fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
        }}>← use a different email</button>
      </div>
    );
  }

  return shell(
    <div style={{ textAlign: "center" }}>
      <SC color={C.gold} size={9} style={{ display: "inline-block", marginBottom: 22 }}>The Ledger</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1, color: C.cream, marginBottom: 18 }}>
        Your email.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 300, lineHeight: 1.55, color: C.creamSoft, maxWidth: 290, margin: "0 auto 28px" }}>
        We'll send a 6-digit code and a one-tap link. Either gets you in.
      </p>
      <input
        type="email" value={email}
        onChange={e => { setEmail(e.target.value); setError(""); }}
        onKeyDown={e => e.key === "Enter" && send()}
        placeholder="you@example.com"
        autoFocus spellCheck={false} autoCapitalize="none" autoCorrect="off"
        style={{
          fontFamily: F.body, fontSize: 20, fontStyle: "italic", color: C.cream,
          padding: "10px 0 12px", borderBottom: `0.5px solid ${C.borderLight}`,
          textAlign: "center", maxWidth: 300, margin: "0 auto", display: "block",
        }}
      />
    </div>,
    <Btn full primary onClick={send} disabled={!email.trim()}>
      Send the code
    </Btn>
  );
}

// ─── Root with auth gate ─────────────────────────────────────
function Root() {
  const [session, setSession] = useState(undefined); // undefined while loading

  useEffect(() => {
    if (!supabase) { setSession(null); return; }
    let cancelled = false;

    // Auto-extracts #access_token from a returning magic-link URL via
    // detectSessionInUrl in the client config.
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!cancelled) setSession(sess || null);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    clearCache(); clearDraft();
    setSession(null);
  }, []);

  return (
    <div style={{
      height: "100%", width: "100%",
      display: "flex", justifyContent: "center", alignItems: "stretch",
      background: C.bg,
    }}>
      <div style={{
        width: "100%", maxWidth: 430, height: "100%",
        position: "relative", overflow: "hidden",
        background: C.bg, color: C.cream,
        boxShadow: "0 0 60px rgba(0,0,0,0.6)",
      }}>
        {session === undefined
          ? <LoadingSplash />
          : session
            ? <App session={session} signOut={signOut} />
            : <AuthScreen />}
      </div>
    </div>
  );
}

function LoadingSplash() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.6s ease both" }}>
      <Mono s={32} />
      <p style={{ marginTop: 22, fontFamily: F.sans, fontSize: 10, color: C.stone, letterSpacing: 3, textTransform: "uppercase" }}>opening the ledger</p>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────
function App({ session, signOut }) {
  const userId = session?.user?.id;
  const api = useMemo(() => makeApi(supabase, userId), [userId]);
  // Expose so child components (TripDetail) can call pasteEmail/deleteItem
  useEffect(() => { window.LEDGER_API = api; }, [api]);

  // Hydrate from cache for instant first paint, then refresh from Supabase
  const cached = loadCache();
  const [user, setUser] = useState(cached?.user || { ...DEFAULT_USER, email: session.user.email || "" });
  const [trips, setTrips] = useState(cached?.trips || []);
  const [wants, setWants] = useState(cached?.wants || []);
  // Draft + step are device-local — restored from localStorage so a refresh
  // mid-flow doesn't lose her input.
  const draftCache = loadDraft();
  const [draft, setDraft] = useState(draftCache?.draft || EMPTY_TRIP);
  const [step, setStep] = useState(draftCache?.step && RESUMABLE.has(draftCache.step) ? draftCache.step : (cached?.trips?.length ? "home" : "welcome"));
  const [firstRun, setFirstRun] = useState(draftCache?.firstRun ?? !cached?.trips?.length);
  const [selectedTripId, setSelectedTripId] = useState(draftCache?.selectedTripId || null);

  syncCounter(trips);

  // Refresh from server on mount
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!api || hydratedRef.current) return;
    hydratedRef.current = true;
    (async () => {
      const [profile, freshTrips, freshWants] = await Promise.all([
        api.fetchProfile(), api.fetchTrips(), api.fetchWants(),
      ]);
      if (profile) {
        const u = { name: profile.name || "Chloe", email: profile.email || session.user.email || "", city: profile.city || "Hong Kong" };
        setUser(u);
      }
      setTrips(freshTrips);
      syncCounter(freshTrips);
      setWants(freshWants);
      // If we now have trips and were stuck on welcome, head to home
      if (freshTrips.length && step === "welcome") setStep("home");
    })();
  }, [api]);

  // Cache locally on every change
  useEffect(() => { saveCache({ user, trips, wants }); }, [user, trips, wants]);
  useEffect(() => { saveDraft({ draft, step, firstRun, selectedTripId }); }, [draft, step, firstRun, selectedTripId]);

  // ─── Form adapter ──────────────────────────────────────────
  const data = { ...user, ...draft };
  const setData = (next) => {
    const { name, email, city, ...rest } = next;
    const nextUser = { name, email, city };
    setUser(nextUser);
    setDraft(rest);
  };

  // Debounced profile update — push name/email/city to Supabase when they
  // settle. Email comes from auth so we don't sync it back.
  const profileTimer = useRef(null);
  useEffect(() => {
    if (!api) return;
    if (profileTimer.current) clearTimeout(profileTimer.current);
    profileTimer.current = setTimeout(() => {
      api.updateProfile({ name: user.name, city: user.city });
    }, 600);
  }, [user.name, user.city, api]);

  const address = useMemo(
    () => buildAddress(user.name, draft.where || "trip"),
    [user.name, draft.where]
  );

  const stepList = firstRun ? FIRST_RUN_STEPS : REPEAT_STEPS;
  const idx = stepList.indexOf(step);
  const total = stepList.length;

  // ─── Transitions ─────────────────────────────────────────────
  const go = (target) => setStep(target);

  const commitDraft = async () => {
    const id = nextTripId();
    const trip = { ...draft, id, address };
    setTrips(prev => [...prev, trip]);
    if (api) {
      await api.upsertTrip(trip);
      await api.registerRoute(address, id);
    }
    return trip;
  };

  const handleForwardNext = async () => { await commitDraft(); setStep("ready"); };
  const handleReadyNext = () => { setDraft(EMPTY_TRIP); setFirstRun(false); setStep("home"); };
  const startNewTrip = () => { setDraft(EMPTY_TRIP); setStep("trip"); };
  const openTrip = (tripId) => { setSelectedTripId(tripId); setStep("detail"); };

  const updateTripItem = (tripId, itemId, itemState) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const items = { ...(t.items || {}), [itemId]: itemState };
      const next = { ...t, items };
      if (api) api.upsertTrip(next);
      return next;
    }));
  };

  const toggleWant = (id) => {
    setWants(prev => {
      const has = prev.includes(id);
      const next = has ? prev.filter(x => x !== id) : [...prev, id];
      if (api) api.toggleWant(id, !has);
      return next;
    });
  };

  const reset = () => {
    if (!window.confirm("Clear local cache? Your data on the server stays — it'll re-hydrate next time.")) return;
    clearCache(); clearDraft();
    _tripCounter = 0;
    setTrips([]); setDraft(EMPTY_TRIP); setWants([]);
    setFirstRun(true); setStep("welcome");
  };

  const lastTrip = trips[trips.length - 1] || draft;

  const screen = (() => {
    switch (step) {
      case "welcome":
        return <Welcome next={() => go("you")} />;
      case "you":
        return <YouStep data={data} set={setData} stepIdx={idx} total={total}
          next={() => go("trip")} back={() => go("welcome")} />;
      case "trip":
        return <TripStep data={data} set={setData} stepIdx={idx} total={total}
          next={() => go("companions")}
          back={() => firstRun ? go("you") : go("home")} />;
      case "companions":
        return <CompanionsStep data={data} set={setData} stepIdx={idx} total={total}
          next={() => go("forward")} back={() => go("trip")} />;
      case "forward":
        return <ForwardStep data={data} address={address} stepIdx={idx} total={total}
          next={handleForwardNext} back={() => go("companions")} />;
      case "ready":
        return <ReadyStep data={{ ...user, ...lastTrip }} tripNumber={trips.length} next={handleReadyNext} />;
      case "home":
        return <Home user={user} trips={trips} wants={wants} toggleWant={toggleWant}
          onNew={startNewTrip} onOpen={openTrip} onRestart={reset} onSignOut={signOut} />;
      case "detail": {
        const trip = trips.find(t => t.id === selectedTripId);
        if (!trip) { setStep("home"); return null; }
        const tripNumber = trips.findIndex(t => t.id === trip.id) + 1;
        return <TripDetail trip={trip} tripNumber={tripNumber}
          back={() => setStep("home")}
          updateItem={(itemId, state) => updateTripItem(trip.id, itemId, state)} />;
      }
      default:
        return null;
    }
  })();

  return <div style={{ height: "100%", background: C.bg, color: C.cream, fontFamily: F.sans, overflow: "hidden", position: "relative" }}>{screen}</div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
