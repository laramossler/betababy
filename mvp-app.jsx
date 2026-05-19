// ─── MVP APP ─ wires the flow into a full-bleed web app ─────
// - URL-as-credential auth: ?k=… is her account. Stored to localStorage
//   on first visit. No password, no email step. Lara hands out keys.
// - Local-first: every change writes to localStorage immediately, then
//   debounce-syncs to the worker so a new device sees everything.
// - Mid-flow draft persists — refresh in the middle of "Tell us about
//   the trip" and she lands back on the same step with the same input.
// - Wants (placeholder upvotes) and feedback drafts persist too.

const { useState, useMemo, useEffect, useCallback, useRef } = React;
const { C, F, Mono, SC, Btn, Welcome, YouStep, TripStep, CompanionsStep, ForwardStep, ReadyStep } = window.MVP;
const { Home } = window.HOME;
const { TripDetail } = window.TRIP_DETAIL;

const API_BASE = window.LEDGER_API_BASE || "";
const STATE_KEY = "ledger.mvp.v2";
const USERKEY_KEY = "ledger.userKey";
const FEEDBACK_DRAFT_KEY = "ledger.mvp.feedbackDraft";

// ─── User-key management ─────────────────────────────────────
const KEY_RE = /^[a-z0-9][a-z0-9-]{6,63}$/i;
function readKeyFromURL() {
  const k = new URLSearchParams(window.location.search).get("k");
  return k && KEY_RE.test(k) ? k.toLowerCase() : null;
}
function loadUserKey() {
  const fromURL = readKeyFromURL();
  if (fromURL) {
    try { window.localStorage.setItem(USERKEY_KEY, fromURL); } catch {}
    // strip the key from the URL so it doesn't sit in tab history / share sheets
    try { window.history.replaceState({}, "", window.location.pathname); } catch {}
    return fromURL;
  }
  try { return window.localStorage.getItem(USERKEY_KEY); } catch { return null; }
}
function saveUserKey(k) {
  try { window.localStorage.setItem(USERKEY_KEY, k); } catch {}
}
function clearUserKey() {
  try { window.localStorage.removeItem(USERKEY_KEY); } catch {}
}

// ─── Local persistence ───────────────────────────────────────
function loadLocal() {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function persistLocal(state) {
  try { window.localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
}
function clearLocal() {
  try { window.localStorage.removeItem(STATE_KEY); } catch {}
  try { window.localStorage.removeItem(FEEDBACK_DRAFT_KEY); } catch {}
}

// ─── API ─────────────────────────────────────────────────────
function makeApi(userKey) {
  const headers = () => ({ "content-type": "application/json", "x-ledger-key": userKey });
  return {
    async fetchState() {
      try {
        const r = await fetch(`${API_BASE}/api/state`, { headers: headers() });
        if (!r.ok) return null;
        const j = await r.json();
        return j.state || null;
      } catch { return null; }
    },
    async putState(payload) {
      try {
        const r = await fetch(`${API_BASE}/api/state`, {
          method: "POST", headers: headers(), body: JSON.stringify(payload),
        });
        return r.ok;
      } catch { return false; }
    },
    async registerInbox(address, tripId) {
      try {
        const r = await fetch(`${API_BASE}/api/trips/register`, {
          method: "POST", headers: headers(),
          body: JSON.stringify({ address, tripId }),
        });
        return r.ok;
      } catch { return false; }
    },
    async getItems(tripId) {
      try {
        const r = await fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}/items`, { headers: headers() });
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j.items) ? j.items : [];
      } catch { return []; }
    },
    async pasteEmail({ tripId, from, subject, text }) {
      const r = await fetch(`${API_BASE}/api/parse-and-store`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ tripId, from, subject, text }),
      });
      if (!r.ok) throw new Error((await r.json())?.error || `HTTP ${r.status}`);
      return await r.json();
    },
    async deleteItem(tripId, itemId) {
      try {
        const r = await fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}/items/${encodeURIComponent(itemId)}`, {
          method: "DELETE", headers: headers(),
        });
        return r.ok;
      } catch { return false; }
    },
    async sendFeedback(note) {
      try {
        const r = await fetch(`${API_BASE}/api/feedback`, {
          method: "POST", headers: headers(), body: JSON.stringify(note),
        });
        return r.ok;
      } catch { return false; }
    },
  };
}

// ─── Auth screen ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    const v = val.trim().toLowerCase();
    if (!KEY_RE.test(v)) {
      setErr("That doesn't look right. Long, lowercase, hyphens are fine.");
      return;
    }
    saveUserKey(v);
    onAuth(v);
  };
  return (
    <div style={{ height: "100%", padding: "80px 30px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `radial-gradient(ellipse at 50% 25%, #1A1815 0%, #0A0908 60%)`, animation: "fadeIn 0.6s ease both" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 36 }}>
        <Mono s={38} />
      </div>
      <div style={{ textAlign: "center" }}>
        <SC size={9} color={C.gold} style={{ display: "inline-block", marginBottom: 22 }}>The Ledger</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 36, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1, color: C.cream, marginBottom: 18 }}>
          The key, please.
        </h1>
        <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 300, lineHeight: 1.55, color: C.creamSoft, maxWidth: 290, margin: "0 auto 28px" }}>
          A long string Lara sent you. Paste it once — this device will remember.
        </p>
        <input
          value={val} onChange={e => { setVal(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="chloe-7f3k9p"
          autoFocus
          style={{
            fontFamily: F.mono, fontSize: 16, color: C.cream,
            padding: "10px 0 12px", borderBottom: `0.5px solid ${C.borderLight}`,
            textAlign: "center", letterSpacing: 0.5,
          }}
        />
        {err && <p style={{ fontFamily: F.body, fontSize: 13, color: C.blush, fontStyle: "italic", marginTop: 12 }}>{err}</p>}
      </div>
      <Btn full primary onClick={submit} disabled={!val.trim()}>Open</Btn>
    </div>
  );
}

// ─── Trip-id counter, kept in sync with persisted trips ──────
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
const DEFAULT_USER = { name: "Chloe", email: "chloe@example.com", city: "Hong Kong" };

// Steps that should not be "resumable" on reload — they're snapshot-y
// (ready) or auth-flow-y (welcome). Mid-flow form steps are resumable.
const RESUMABLE = new Set(["you", "trip", "companions", "forward", "home", "detail"]);

// ─── Root with auth gate ─────────────────────────────────────
function Root() {
  const [userKey, setUserKey] = useState(() => loadUserKey());
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
        {userKey
          ? <App userKey={userKey} signOut={() => { clearUserKey(); clearLocal(); setUserKey(null); }} />
          : <AuthScreen onAuth={setUserKey} />}
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
function App({ userKey, signOut }) {
  const api = useMemo(() => makeApi(userKey), [userKey]);
  // Expose for child components (TripDetail uses pasteEmail/deleteItem)
  useEffect(() => { window.LEDGER_API = api; }, [api]);

  // Hydrate from localStorage synchronously — fast path
  const initial = loadLocal();
  const [user, setUser] = useState(initial?.user || DEFAULT_USER);
  const [trips, setTrips] = useState(initial?.trips || []);
  const [draft, setDraft] = useState(initial?.draft || EMPTY_TRIP);
  const [wants, setWants] = useState(initial?.wants || []);
  const [step, setStep] = useState(initial?.step && RESUMABLE.has(initial.step) ? initial.step : (initial?.trips?.length ? "home" : "welcome"));
  const [firstRun, setFirstRun] = useState(initial ? (initial.firstRun ?? !initial.trips?.length) : true);
  const [selectedTripId, setSelectedTripId] = useState(initial?.selectedTripId || null);
  syncCounter(trips);

  // Pull from server once on mount. If server has newer state, replace
  // local. If server has nothing, push our local state up.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    (async () => {
      const serverState = await api.fetchState();
      if (!serverState) {
        // First time on this user key — push local (or empty) up
        api.putState({ user, trips, wants });
        return;
      }
      const local = loadLocal();
      const localSavedAt = local?.savedAt || null;
      const serverSavedAt = serverState.savedAt || null;
      // Server wins when local has no save timestamp OR server is strictly newer
      if (!localSavedAt || (serverSavedAt && serverSavedAt > localSavedAt)) {
        const nextUser = serverState.user || DEFAULT_USER;
        const nextTrips = Array.isArray(serverState.trips) ? serverState.trips : [];
        const nextWants = Array.isArray(serverState.wants) ? serverState.wants : [];
        setUser(nextUser); setTrips(nextTrips); setWants(nextWants);
        syncCounter(nextTrips);
        // If we hydrated a populated state and we were sitting on the auth-like
        // welcome screen, jump to home.
        if (nextTrips.length && step === "welcome") setStep("home");
      }
    })();
  }, []);

  // Persist locally on every state change (fast, synchronous-feeling)
  useEffect(() => {
    persistLocal({
      user, trips, draft, wants, step, firstRun, selectedTripId,
      savedAt: new Date().toISOString(),
    });
  }, [user, trips, draft, wants, step, firstRun, selectedTripId]);

  // Debounced server sync — wait for a quiet moment so we don't hammer
  // KV on every keystroke. Only sync the persistent slice (not draft).
  const syncTimerRef = useRef(null);
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      api.putState({ user, trips, wants });
    }, 800);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [user, trips, wants, api]);

  // ─── Form adapter — keeps existing flow components unchanged ──
  const data = { ...user, ...draft };
  const setData = (next) => {
    const { name, email, city, ...rest } = next;
    setUser({ name, email, city });
    setDraft(rest);
  };

  const address = useMemo(
    () => buildAddress(user.name, draft.where || "trip"),
    [user.name, draft.where]
  );

  const stepList = firstRun ? FIRST_RUN_STEPS : REPEAT_STEPS;
  const idx = stepList.indexOf(step);
  const total = stepList.length;

  // ─── Transitions ─────────────────────────────────────────────
  const go = (target) => setStep(target);

  const commitDraft = () => {
    const id = nextTripId();
    const trip = { ...draft, id, address };
    setTrips(prev => [...prev, trip]);
    api.registerInbox(address, id);
    return trip;
  };

  const handleForwardNext = () => { commitDraft(); setStep("ready"); };
  const handleReadyNext = () => { setDraft(EMPTY_TRIP); setFirstRun(false); setStep("home"); };
  const startNewTrip = () => { setDraft(EMPTY_TRIP); setStep("trip"); };
  const openTrip = (tripId) => { setSelectedTripId(tripId); setStep("detail"); };

  const updateTripItem = (tripId, itemId, itemState) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const items = { ...(t.items || {}), [itemId]: itemState };
      return { ...t, items };
    }));
  };

  const toggleWant = (id) => {
    setWants(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const reset = () => {
    if (!window.confirm("Reset — clear all trips on this device? The server copy stays until you sync.")) return;
    clearLocal();
    _tripCounter = 0;
    setTrips([]);
    setDraft(EMPTY_TRIP);
    setUser(DEFAULT_USER);
    setWants([]);
    setFirstRun(true);
    setStep("welcome");
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
