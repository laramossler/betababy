// ─── MAIN APP ──────────────────────────────────────────────
const { C, F, ME } = window.LEDGER;
const { Mono, SC, Ini, Btn } = window.ATOMS;
const { Home, TripDetail } = window.SCREENS_A;
const { Concierge, BlackBook, Memory, Gatherings } = window.SCREENS_B;
const { CreateFlow } = window.SCREENS_CREATE;
const { Onboarding } = window.ONBOARDING;
const { useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "midnight",
  "typeface": "playfair",
  "showChinese": true,
  "showPet": true,
  "showConcierge": true
}/*EDITMODE-END*/;

const PALETTES = {
  midnight: { bg: "#0A0908", card: "#151413", cream: "#EDE8DF", gold: "#B8A07A", border: "#252320" },
  porcelain: { bg: "#F4EFE6", card: "#EAE3D5", cream: "#1A1715", gold: "#8A6E3F", border: "#D4CABA" },
  jade: { bg: "#0E1412", card: "#161E1B", cream: "#E0E8DF", gold: "#9EB7A0", border: "#1F2925" },
};

const STORAGE_KEY = "ledger.profile.v1";

// Snapshots of the seed data taken at module load so applyProfile can be
// re-run idempotently (overwrite, not append, when re-applying on reload).
const SEED_TRIPS = window.LEDGER.TRIPS.slice();
const SEED_THREAD = window.LEDGER.CONCIERGE_THREAD.slice();
const SEED_ME = JSON.parse(JSON.stringify(window.LEDGER.ME));

function loadProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function persistProfile(profile) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch (e) {}
}
function clearProfile() {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") || "trip";
}

// Apply collected onboarding state into the live data so every screen reads
// the user's actual identity and sees the trips Margaux is drafting for them.
// Mutates window.LEDGER objects/arrays in place — components captured those
// references at module load.
function applyProfile(profile) {
  // Reset to seed first so re-applying (e.g. after a reload) doesn't compound.
  Object.keys(window.LEDGER.ME).forEach(k => delete window.LEDGER.ME[k]);
  Object.assign(window.LEDGER.ME, JSON.parse(JSON.stringify(SEED_ME)));
  window.LEDGER.TRIPS.length = 0;
  window.LEDGER.TRIPS.push(...SEED_TRIPS);
  window.LEDGER.CONCIERGE_THREAD.length = 0;
  window.LEDGER.CONCIERGE_THREAD.push(...SEED_THREAD);

  if (!profile) return;

  const me = window.LEDGER.ME;
  if (profile.firstName) {
    me.name = profile.firstName;
    me.initial = profile.firstName.charAt(0).toUpperCase();
  }
  if (profile.firstName || profile.lastName) {
    me.fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  }
  if (typeof profile.cnName === "string") me.cnName = profile.cnName;
  if (profile.city1) me.city = profile.city1;
  if (profile.city2) me.city2 = profile.city2;

  const firstPet = (profile.companions || []).find(c => c.kind === "pet" && c.name);
  if (firstPet) {
    me.pet = {
      name: firstPet.name,
      breed: firstPet.fields?.breed || "",
      weight: firstPet.fields?.weight || "",
      emoji: "🐕",
    };
  }

  if (profile.tones) me.tones = profile.tones.slice();
  window.LEDGER.PROFILE = profile;

  // Year ahead → drafting trips, prepended so the lead (Rome) is at the top.
  const yearAhead = (profile.yearAhead || []).filter(t => t.destination && t.destination.trim());
  const newTrips = yearAhead.map(t => {
    const lead = !!t.lead;
    return {
      id: `ya_${slugify(t.month)}_${slugify(t.destination)}`,
      title: t.destination,
      sub: lead ? "Margaux is drafting" : (t.role || "Sketched"),
      dates: t.dates || `${t.month} 2026`,
      daysOut: 0,
      cover: lead ? "#9A8460" : "#5A5042",
      coverGrad: lead
        ? "linear-gradient(135deg, #2A1815 0%, #6A4F3A 50%, #B8A07A 100%)"
        : "linear-gradient(135deg, #1F1815 0%, #3A3530 60%, #7A6D54 100%)",
      status: "drafting",
      role: t.role && /guest/i.test(t.role) ? "guest" : "host",
      guests: ["chloe"],
      note: t.why || (lead ? "First pass in 48 hours — villas, the table, the chef." : "Sketched. Margaux is on it."),
    };
  });
  if (newTrips.length) window.LEDGER.TRIPS.unshift(...newTrips);

  // Margaux thread: replace the legacy demo conversation with a real first
  // exchange seeded from the user's first word + Rome (or graceful fallback).
  const thread = window.LEDGER.CONCIERGE_THREAD;
  thread.length = 0;
  const lead = yearAhead.find(t => t.lead) || yearAhead[0];
  thread.push({
    from: "margaux",
    time: "Today, just now",
    body: `Hello${profile.firstName ? `, ${profile.firstName}` : ""}. I'm at the desk. Tell me when something's on your mind — I'll keep what matters and forget the rest.`,
  });
  if (profile.firstWord && profile.firstWord.trim()) {
    thread.push({ from: "me", time: "Today, just now", body: profile.firstWord.trim() });
  }
  if (lead) {
    thread.push({
      from: "margaux",
      time: "Today, just now",
      body: `Noted. First pass on ${lead.destination}${lead.dates ? ` (${lead.dates})` : ""} in 48 hours — villas, the table, the chef. I'll write properly when I have something worth sharing.`,
    });
  } else {
    thread.push({
      from: "margaux",
      time: "Today, just now",
      body: "I've enough to start with. Three places I think you'd love based on your tones — I'll write Friday.",
    });
  }
}

// Apply any persisted profile BEFORE React first renders so the main app
// reflects who she said she was the moment it opens.
const SAVED_PROFILE = loadProfile();
if (SAVED_PROFILE) applyProfile(SAVED_PROFILE);

function App() {
  const [screen, setScreen] = useState("home");
  const [tripId, setTripId] = useState(window.LEDGER.TRIPS[0]?.id || "riviera");
  const [plan, setPlan] = useState(window.LEDGER.WEEK);
  const [t, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const pal = PALETTES[t.palette] || PALETTES.midnight;
  const [onboarded, setOnboarded] = useState(!!SAVED_PROFILE);

  const completeOnboarding = (profileState) => {
    applyProfile(profileState);
    persistProfile(profileState);
    setTripId(window.LEDGER.TRIPS[0]?.id || "riviera");
    setOnboarded(true);
    setScreen("home");
  };

  const replayOnboarding = () => {
    clearProfile();
    applyProfile(null); // restore seed
    setOnboarded(false);
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
      case "home": return <Home go={setScreen} setTrip={setTripId} />;
      case "trip": return <TripDetail tripId={tripId} go={setScreen} plan={plan} setPlan={setPlan} />;
      case "concierge": return <Concierge go={setScreen} />;
      case "book": return <BlackBook go={setScreen} />;
      case "memory": return <Memory go={setScreen} />;
      case "gatherings": return <Gatherings go={setScreen} />;
      default: return <Home go={setScreen} setTrip={setTripId} />;
    }
  })();

  const inCreate = screen === "create";

  return (
    <div style={{ position: "relative", height: "100%", background: pal.bg, color: pal.cream }}>
      {!onboarded ? (
        <Onboarding onDone={completeOnboarding} />
      ) : (
        <React.Fragment>
          <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
            {current}
          </div>

          {inCreate && (
            <div style={{ position: "absolute", inset: 0, background: pal.bg, zIndex: 100, animation: "fadeIn 0.3s ease" }}>
              <CreateFlow
                onClose={() => setScreen("home")}
                onLaunched={() => { setTripId(window.LEDGER.TRIPS[0]?.id || "riviera"); setScreen("trip"); }}
              />
            </div>
          )}

          {!inCreate && <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: `${pal.bg}E8`, backdropFilter: "blur(18px)",
            borderTop: `0.5px solid ${pal.border}`,
            display: "flex", justifyContent: "space-around",
            padding: "8px 0 22px",
            zIndex: 50,
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

      {onboarded && window.TweaksPanel && (
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
            <window.TweakToggle label="Pet logistics" tweakKey="showPet" value={t.showPet} onChange={setTweak} />
            <window.TweakToggle label="Show concierge tab" tweakKey="showConcierge" value={t.showConcierge} onChange={setTweak} />
          </window.TweakSection>
          <window.TweakSection title="First Experience">
            <button onClick={replayOnboarding} style={{
              padding: "8px 12px", background: "transparent",
              border: `0.5px solid ${C.borderLight}`, color: C.creamSoft,
              fontFamily: F.sans, fontSize: 9.5, letterSpacing: 2.4,
              textTransform: "uppercase", cursor: "pointer", width: "100%",
            }}>
              Replay onboarding
            </button>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
}

// Mount the app full-bleed in a mobile-width column. On phones it fills the
// viewport; on desktop the design's mobile dimensions are preserved with the
// rest of the screen filled by the app's own background.
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
