// ─── MVP APP ─ wires the flow into a full-bleed web app ─────
// Drops the IOSDevice + sidebar wrapper that lived in the design preview.
// Persists user + trips to localStorage so a reload doesn't lose her work.
// Registers each trip's inbox with the worker so forwarded mail can route.

const { useState, useMemo, useEffect } = React;
const { C, F, Mono, SC, Welcome, YouStep, TripStep, CompanionsStep, ForwardStep, ReadyStep } = window.MVP;
const { Home } = window.HOME;
const { TripDetail } = window.TRIP_DETAIL;

// API base — same-origin when served by the Worker; override for local dev.
const API_BASE = window.LEDGER_API_BASE || "";
window.LEDGER_API = {
  async registerInbox(address, tripId) {
    try {
      const r = await fetch(`${API_BASE}/api/trips/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, tripId }),
      });
      return r.ok;
    } catch (e) { return false; }
  },
  async getItems(tripId) {
    try {
      const r = await fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}/items`);
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j.items) ? j.items : [];
    } catch (e) { return []; }
  },
  async pasteEmail({ tripId, from, subject, text }) {
    const r = await fetch(`${API_BASE}/api/parse-and-store`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tripId, from, subject, text }),
    });
    if (!r.ok) throw new Error((await r.json())?.error || `HTTP ${r.status}`);
    return await r.json();
  },
  async deleteItem(tripId, itemId) {
    const r = await fetch(`${API_BASE}/api/trips/${encodeURIComponent(tripId)}/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
    return r.ok;
  },
};

const STORAGE_KEY = "ledger.mvp.v1";

function loadPersisted() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function persist(state) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function clearPersisted() {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

let _tripCounter = 0;
const nextTripId = () => `t${(++_tripCounter).toString().padStart(3, "0")}`;

// Per-trip inbox address — name + where + 3-char tag for uniqueness
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

function App() {
  // Hydrate from localStorage on first render
  const initial = loadPersisted();
  const [user, setUser] = useState(initial?.user || DEFAULT_USER);
  const [trips, setTrips] = useState(initial?.trips || []);
  const [draft, setDraft] = useState(EMPTY_TRIP);

  // Bring the in-process trip counter in line with persisted trips so new
  // trips don't collide with already-saved ids.
  useEffect(() => {
    if (initial?.trips?.length) {
      const max = initial.trips.reduce((m, t) => {
        const n = parseInt(String(t.id).replace(/[^0-9]/g, ""), 10);
        return Number.isFinite(n) ? Math.max(m, n) : m;
      }, 0);
      _tripCounter = max;
    }
  }, []);

  // Persist whenever user or trips changes
  useEffect(() => { persist({ user, trips }); }, [user, trips]);

  const [step, setStep] = useState(() => initial?.trips?.length ? "home" : "welcome");
  const [firstRun, setFirstRun] = useState(() => !initial?.trips?.length);
  const [selectedTripId, setSelectedTripId] = useState(null);

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

  const go = (target) => setStep(target);

  const commitDraft = () => {
    const id = nextTripId();
    const trip = { ...draft, id, address };
    setTrips(prev => [...prev, trip]);
    // Tell the worker which trip this address routes to. Fire and forget.
    window.LEDGER_API?.registerInbox(address, id);
    return trip;
  };

  const handleForwardNext = () => {
    commitDraft();
    setStep("ready");
  };

  const handleReadyNext = () => {
    setDraft(EMPTY_TRIP);
    setFirstRun(false);
    setStep("home");
  };

  const startNewTrip = () => {
    setDraft(EMPTY_TRIP);
    setStep("trip");
  };

  const openTrip = (tripId) => {
    setSelectedTripId(tripId);
    setStep("detail");
  };

  const updateTripItem = (tripId, itemId, itemState) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const items = { ...(t.items || {}), [itemId]: itemState };
      return { ...t, items };
    }));
  };

  const reset = () => {
    if (!window.confirm("Reset — clear all trips? This can't be undone.")) return;
    clearPersisted();
    _tripCounter = 0;
    setTrips([]);
    setDraft(EMPTY_TRIP);
    setUser(DEFAULT_USER);
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
        return <Home user={user} trips={trips} onNew={startNewTrip} onOpen={openTrip} onRestart={reset} />;
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

// Full-bleed web app: mobile-width column centered on desktop, full screen
// on phones. No design-stage chrome, no iOS device frame.
function Root() {
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
        <App />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
