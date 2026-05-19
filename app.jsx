// ─── MAIN APP ──────────────────────────────────────────────
const { C, F, ME } = window.LEDGER;
const { Mono, SC, Ini, Btn } = window.ATOMS;
const { Home, TripDetail } = window.SCREENS_A;
const { Concierge, BlackBook, Memory, Gatherings } = window.SCREENS_B;
const { CreateFlow } = window.SCREENS_CREATE;
const { WovenFlow, loadFlow, clearFlow } = window.WOVEN;
const { DAYS, SLOTS, planFromVerdicts } = window.WOVEN_B;
const { useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "midnight",
  "typeface": "playfair",
  "showChinese": true,
  "showPet": true,
  "showConcierge": true
}/*EDITMODE-END*/;

// Full atlas palettes — every C token has a value in every palette so
// applyPalette can swap them all in place and every screen reads coherent
// colors. Mutating the shared C object lets every component pick up the
// new palette on the next render without prop drilling.
const PALETTES = {
  midnight: {
    bg: "#0A0908", bgSoft: "#111010", card: "#151413", cardHover: "#1C1B19",
    cream: "#EDE8DF", creamSoft: "#B8B0A2",
    gold: "#B8A07A", goldDeep: "#9A8460", goldMuted: "#7A6D54",
    stone: "#928679", border: "#252320", borderLight: "#322F2B",
    blush: "#C4A89A", sage: "#8E9E82", sea: "#7A9BA0", dusk: "#9890AE", red: "#B07070",
  },
  porcelain: {
    bg: "#F4EFE6", bgSoft: "#EDE6DA", card: "#EAE3D5", cardHover: "#E4DBCA",
    cream: "#1A1715", creamSoft: "#4A3F35",
    gold: "#8A6E3F", goldDeep: "#6E5430", goldMuted: "#A89070",
    stone: "#7A6B5A", border: "#D4CABA", borderLight: "#C4B8A4",
    blush: "#9A6E5A", sage: "#5E7048", sea: "#506878", dusk: "#6A6080", red: "#9A4848",
  },
  jade: {
    bg: "#0E1412", bgSoft: "#131B18", card: "#161E1B", cardHover: "#1E2823",
    cream: "#E0E8DF", creamSoft: "#A8B5A8",
    gold: "#9EB7A0", goldDeep: "#7E977E", goldMuted: "#6A8068",
    stone: "#7A8A7C", border: "#1F2925", borderLight: "#2A3530",
    blush: "#B8A89A", sage: "#A8C0A0", sea: "#7AA0A0", dusk: "#8898A8", red: "#A07878",
  },
};

function applyPalette(palName) {
  const pal = PALETTES[palName] || PALETTES.midnight;
  Object.assign(C, pal);
}

// ─── Seed snapshots — keep so applyFromFlow is idempotent ─────
const SEED_TRIPS = window.LEDGER.TRIPS.slice();
const SEED_THREAD = window.LEDGER.CONCIERGE_THREAD.slice();
const SEED_ME = JSON.parse(JSON.stringify(window.LEDGER.ME));

function resetSeed() {
  Object.keys(window.LEDGER.ME).forEach(k => delete window.LEDGER.ME[k]);
  Object.assign(window.LEDGER.ME, JSON.parse(JSON.stringify(SEED_ME)));
  window.LEDGER.TRIPS.length = 0;
  window.LEDGER.TRIPS.push(...SEED_TRIPS);
  window.LEDGER.CONCIERGE_THREAD.length = 0;
  window.LEDGER.CONCIERGE_THREAD.push(...SEED_THREAD);
}

// ─── Translate first-sitting state → main-app data ────────────
function applyFromFlow(flow) {
  resetSeed();
  if (!flow || !flow.completed) return;

  const captures = flow.captures || {};
  const verdicts = flow.verdicts || {};
  const overrides = flow.planOverrides || {};
  const tones = captures.year_tones?.chips || [];
  const why = captures.rome_why?.chips || [];
  const who = captures.rome_who?.chips || [];
  const when = captures.rome_when?.chips || [];

  const autoplan = planFromVerdicts(verdicts);
  const getEntry = (di, sid) => {
    const k = `${di}-${sid}`;
    return k in overrides ? overrides[k] : autoplan[k];
  };
  const totalPlaces = DAYS.reduce((acc, d) => acc + SLOTS.filter(s => !!getEntry(d.idx, s.id)).length, 0);
  const keptCount = Object.values(verdicts).filter(v => v === "keep" || v === "more").length;

  const romeTrip = {
    id: "rome_jul",
    title: "Rome",
    sub: "Margaux is drafting",
    dates: "Jul 13 — 17, 2026",
    daysOut: 0,
    cover: "#9A8460",
    coverGrad: "linear-gradient(135deg, #2A1815 0%, #6A4F3A 50%, #B8A07A 100%)",
    status: "drafting",
    role: who.includes("just me") ? "guest" : "host",
    guests: ["chloe"],
    note: `${keptCount} kept from Lara's six · ${totalPlaces} places across five days`,
    tones,
    capturedAt: new Date().toISOString(),
  };
  window.LEDGER.TRIPS.unshift(romeTrip);
  window.LEDGER.ROME = {
    trip: romeTrip,
    plan: DAYS.map(d => ({
      day: d,
      slots: SLOTS.map(s => ({ slot: s, entry: getEntry(d.idx, s.id) })),
    })),
  };

  const thread = window.LEDGER.CONCIERGE_THREAD;
  thread.length = 0;
  thread.push({ from: "margaux", time: "Today, just now", body: "Thank you for the call. Quick recap so you've got the same notes I do." });
  if (why.length) thread.push({ from: "margaux", time: "Today, just now", body: `Rome — chasing ${why.join(", ")}.` });
  if (when.length) thread.push({ from: "margaux", time: "Today, just now", body: `${when[0]}, week of the 13th of July.` });
  if (who.length) thread.push({ from: "margaux", time: "Today, just now", body: `Who: ${who[0]}.` });
  if (tones.length) thread.push({ from: "margaux", time: "Today, just now", body: `The year, in three words: ${tones.join(" · ")}.` });
  thread.push({ from: "margaux", time: "Today, just now", body: `I've laid your five days against Lara's picks. ${keptCount} kept, ${totalPlaces} slots filled. Reservations confirmed in the ledger as I clear them.` });
  thread.push({ from: "me", time: "Today, just now", body: "Thank you." });

  window.LEDGER.ME.tones = tones;
}

const INITIAL_FLOW = loadFlow();
applyFromFlow(INITIAL_FLOW);

function App() {
  const [screen, setScreen] = useState("home");
  const [tripId, setTripId] = useState(window.LEDGER.TRIPS[0]?.id || "rome_jul");
  const [plan, setPlan] = useState(window.LEDGER.WEEK);
  const [dynamicTrips, setDynamicTrips] = useState([]);
  const [t, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  applyPalette(t.palette);
  const pal = PALETTES[t.palette] || PALETTES.midnight;
  const [done, setDone] = useState(!!INITIAL_FLOW.completed);

  const onFinalise = (flow) => {
    applyFromFlow(flow);
    setTripId(window.LEDGER.TRIPS[0]?.id || "rome_jul");
    setDone(true);
    setScreen("home");
  };

  const replay = () => {
    clearFlow();
    resetSeed();
    setDynamicTrips([]);
    setDone(false);
  };

  // CreateFlow hands back a fully-formed trip object on lock-in
  const launchTrip = (tripPayload) => {
    setDynamicTrips(prev => [tripPayload, ...prev]);
    setTripId(tripPayload.id);
    setScreen("trip");
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "concierge", label: "Margaux", show: t.showConcierge },
    { id: "book", label: "Book" },
    { id: "memory", label: "Memory" },
    { id: "gatherings", label: "Gather" },
  ].filter(n => n.show !== false);

  const current = (() => {
    switch (screen) {
      case "home": return <Home go={setScreen} setTrip={setTripId} dynamicTrips={dynamicTrips} />;
      case "trip": return <TripDetail tripId={tripId} go={setScreen} plan={plan} setPlan={setPlan} dynamicTrips={dynamicTrips} />;
      case "concierge": return <Concierge go={setScreen} />;
      case "book": return <BlackBook go={setScreen} />;
      case "memory": return <Memory go={setScreen} />;
      case "gatherings": return <Gatherings go={setScreen} />;
      default: return <Home go={setScreen} setTrip={setTripId} dynamicTrips={dynamicTrips} />;
    }
  })();

  const inCreate = screen === "create";

  return (
    <div style={{ position: "relative", height: "100%", background: pal.bg, color: pal.cream }}>
      {!done ? (
        <WovenFlow onFinalise={onFinalise} />
      ) : (
        <React.Fragment>
          <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
            {current}
          </div>

          {inCreate && (
            <div style={{ position: "absolute", inset: 0, background: pal.bg, zIndex: 100, animation: "fadeIn 0.3s ease" }}>
              <CreateFlow
                onClose={() => setScreen("home")}
                onLaunched={launchTrip}
              />
            </div>
          )}

          {!inCreate && <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: `${pal.bg}E8`, backdropFilter: "blur(18px)",
            borderTop: `0.5px solid ${pal.border}`,
            display: "flex", justifyContent: "space-around",
            padding: "8px 0 22px", zIndex: 50,
          }}>
            {navItems.map(n => {
              const active = screen === n.id || (n.id === "home" && screen === "trip");
              return (
                <button key={n.id} onClick={() => setScreen(n.id)} style={{
                  flex: 1, background: "none", border: "none", cursor: "pointer",
                  padding: "8px 4px",
                  borderTop: active ? `1px solid ${C.gold}` : "1px solid transparent",
                  transition: "all 0.2s",
                }}>
                  <span style={{
                    fontFamily: F.sans, fontSize: 8.5, letterSpacing: 1.8, textTransform: "uppercase",
                    color: active ? C.gold : C.stone, fontWeight: active ? 500 : 400,
                  }}>{n.label}</span>
                </button>
              );
            })}
          </div>}
        </React.Fragment>
      )}

      {done && window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Atmosphere">
            <window.TweakRadio label="Palette" tweakKey="palette" value={t.palette} onChange={setTweak}
              options={[
                { value: "midnight", label: "Midnight" },
                { value: "porcelain", label: "Porcelain" },
                { value: "jade", label: "Jade" },
              ]} />
          </window.TweakSection>
          <window.TweakSection title="Personalisation">
            <window.TweakToggle label="Bilingual touches (中文)" tweakKey="showChinese" value={t.showChinese} onChange={setTweak} />
            <window.TweakToggle label="Pet logistics (Biscuit)" tweakKey="showPet" value={t.showPet} onChange={setTweak} />
            <window.TweakToggle label="Show concierge tab" tweakKey="showConcierge" value={t.showConcierge} onChange={setTweak} />
          </window.TweakSection>
          <window.TweakSection title="First Sitting">
            <button onClick={replay} style={{
              padding: "8px 12px", background: "transparent",
              border: `0.5px solid ${C.borderLight}`, color: C.creamSoft,
              fontFamily: F.sans, fontSize: 9.5, letterSpacing: 2.4,
              textTransform: "uppercase", cursor: "pointer", width: "100%",
            }}>
              Replay first sitting
            </button>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

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
