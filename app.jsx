// ─── MAIN APP ──────────────────────────────────────────────
const { C, F, ME } = window.LEDGER;
const { Mono, SC, Ini, Btn } = window.ATOMS;
const { Home, TripDetail } = window.SCREENS_A;
const { Concierge, BlackBook, Memory, Gatherings } = window.SCREENS_B;
const { CreateFlow } = window.SCREENS_CREATE;
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

function App() {
  const [screen, setScreen] = useState("home");
  const [tripId, setTripId] = useState("riviera");
  const [plan, setPlan] = useState(window.LEDGER.WEEK);
  const [t, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  const pal = PALETTES[t.palette] || PALETTES.midnight;

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
      <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
        {current}
      </div>

      {/* Create-flow overlay */}
      {inCreate && (
        <div style={{ position: "absolute", inset: 0, background: pal.bg, zIndex: 100, animation: "fadeIn 0.3s ease" }}>
          <CreateFlow
            onClose={() => setScreen("home")}
            onLaunched={() => { setTripId("riviera"); setScreen("trip"); }}
          />
        </div>
      )}

      {/* Bottom nav — floating glass strip */}
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

      {/* Tweaks panel */}
      {window.TweaksPanel && (
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
        </window.TweaksPanel>
      )}
    </div>
  );
}

// Mount inside an iPhone frame on a stage
function Stage() {
  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "radial-gradient(ellipse at center, #1A1815 0%, #0A0908 70%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Tagline column */}
        <div style={{ maxWidth: 280, color: C.cream }}>
          <Mono s={32} />
          <p style={{ fontFamily: F.sans, fontSize: 9.5, letterSpacing: 3.5, textTransform: "uppercase", color: C.gold, marginTop: 28, marginBottom: 10 }}>The Ledger · Designed for Chloe</p>
          <h1 style={{ fontFamily: F.display, fontSize: 36, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1 }}>
            A private record<br/>of the art of<br/>gathering
          </h1>
          <p style={{ fontFamily: F.body, fontSize: 16, color: C.creamSoft, marginTop: 18, lineHeight: 1.7, fontWeight: 300 }}>
            For ultra-high-net-worth women who plan beautifully and travel often. Tap through her actual app — eleven days before the Riviera, a podcast in production, and a Pomeranian in the carry-on.
          </p>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Home — what wants Chloe's eyes today",
              "Begin — spark to invitation in seven steps",
              "Trip — itinerary + Biscuit + the four guests",
              "Margaux — her named human concierge",
              "Black Book — people & places worth keeping",
              "Memory — voice notes from each trip",
              "Gather — host her own salons & tables",
            ].map((s, i) => (
              <p key={i} style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontWeight: 300, fontStyle: "italic" }}>· {s}</p>
            ))}
          </div>
        </div>

        {/* Phone */}
        <window.IOSDevice width={390} height={820} dark={true}>
          <App />
        </window.IOSDevice>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Stage />);
