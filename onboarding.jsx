// ─── ONBOARDING v4 — major rework ──────────────────────
// Rome captured by step 4 (so quit-early still gives Margaux something to draft).
// Order: arrival → frame → margaux (+presence) → name → cities → ROME →
// permissions → circle → travelling with (multi) → the desk → the kit →
// tones → places worth keeping → one first word → welcome (graceful)
//
// Reframes: "Founder of your Ledger" not "Member 001 of the company."
// Margaux's address-book copy: a guess, not a found-fact.
// Adds: presence ticker, quiet hours, channels, tier, passport, dietary,
// emergency, black book seeding, multi-companions, audio upload, fallback welcome.

const { C, F, ME, CONCIERGE, CIRCLE, VIBES } = window.LEDGER;
const { Mono, Rule, SC, Tag, Ini, Btn, Imagery, Dot, Divider, PetTag } = window.ATOMS;
const { useState, useEffect, useRef } = React;

// 9 indices: 0 Arrival, 1 Frame, 2..7 counted (6 steps), 8 Welcome
// The rest (permissions, circle, companions, desk, kit, places) live as components
// but are surfaced as LATER PROMPTS on the dashboard, not in this first sitting.
const COUNTED = 6;

const ADDRESS_BOOK = [
  { id: "sophia", name: "Sophia Reyes",      city: "Los Angeles", initial: "S", color: "#8E9E82", signal: "texts you weekly",    suggested: true },
  { id: "aria",   name: "Aria Khan",         city: "Singapore",   initial: "A", color: "#C4A89A", signal: "last call · 2d ago",  suggested: true },
  { id: "noor",   name: "Noor Al-Saud",      city: "Dubai",       initial: "N", color: "#9890AE", signal: "11 voice notes · month", suggested: true },
  { id: "iris",   name: "Iris Bellamy",      city: "London",      initial: "I", color: "#B8A07A", signal: "favourites · pinned", suggested: true },
  { id: "yuki",   name: "Yuki Tanabe",       city: "Tokyo",       initial: "Y", color: "#7A9BA0", signal: "marked ★",            suggested: true },
  { id: "lina",   name: "Lina Castillo",     city: "Mexico City", initial: "L", color: "#C4A89A", signal: "text · last week" },
  { id: "ines",   name: "Inês Vasconcelos",  city: "Lisbon",      initial: "I", color: "#9EB7A0", signal: "calls infrequent" },
  { id: "petra",  name: "Petra Lindqvist",   city: "Stockholm",   initial: "P", color: "#7A9BA0", signal: "calls infrequent" },
];

// The six beats — a SHORT first sitting. Everything else is a later prompt.
const RITUAL = [
  { n: "01", title: "Meet Margaux",     sub: "Your concierge — and what she's done today" },
  { n: "02", title: "Your name",        sub: "Given, family, mother tongue" },
  { n: "03", title: "Your cities",      sub: "Wherever you keep a bag" },
  { n: "04", title: "The year ahead",   sub: "Starting with Rome" },
  { n: "05", title: "Your tones",       sub: "What a good year feels like" },
  { n: "06", title: "One first word",   sub: "A voice note Margaux keeps" },
];

// Components below this comment are NOT in the linear flow —
// they are kept for surfacing as later prompts from the dashboard.
const LATER_PROMPTS = [
  { id: "permissions", title: "Address book + calendar",   when: "When she next plans with friends" },
  { id: "circle",      title: "Your circle",                when: "After Margaux drafts Rome" },
  { id: "companions",  title: "Travelling with",            when: "Before any trip with a pet or guest" },
  { id: "desk",        title: "The desk · quiet hours",     when: "Once Margaux starts to reach out" },
  { id: "kit",         title: "The kit · passport, dietary", when: "When booking the first flight" },
  { id: "places",      title: "Places worth keeping",       when: "Anytime, from the Memory Ledger" },
];

const COMPANION_KINDS = {
  pet:     { label: "Pet",     accent: C.blush, fields: ["breed", "weight", "chip"] },
  partner: { label: "Partner", accent: C.dusk,  fields: ["sub"] },
  child:   { label: "Child",   accent: C.sage,  fields: ["age", "sub"] },
  other:   { label: "Other",   accent: C.sea,   fields: ["sub"] },
};

const DIETARY_TAGS = [
  "Pescatarian", "Vegetarian", "No shellfish", "No pork",
  "Halal", "Kosher", "No alcohol", "Low-gluten",
];

const TIERS = [
  { id: "member",  name: "Member",  line: "08–23 CET · response in hours", desc: "Margaux for everyday." },
  { id: "atelier", name: "Atelier", line: "Eight of her hours, weekly", desc: "Priority. She drafts before you ask." },
];

// ─── micro UI ─────────────────────────────────────────
function Counter({ step }) {
  const display = step - 1; // step 2 → 01
  if (display < 1 || display > COUNTED) return <span />;
  return (
    <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1, whiteSpace: "nowrap" }}>
      {String(display).padStart(2, "0")} <span style={{ color: C.borderLight }}>/</span> {String(COUNTED).padStart(2, "0")}
    </p>
  );
}
function ProgressBar({ step }) {
  const pos = step - 2;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: COUNTED }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: "1.5px",
          background: i < pos ? C.gold : i === pos ? C.goldDeep : C.border,
          transition: "all 0.4s ease",
        }} />
      ))}
    </div>
  );
}
function Field({ label, value, onChange, placeholder, hint, font = F.display, size = 24, italic = true, mono = false, onFocusColor }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <SC color={C.stone} size={8.5} style={{ marginBottom: 8 }}>{label}</SC>
      <input
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "transparent",
          border: "none", borderBottom: `0.5px solid ${C.borderLight}`,
          padding: "6px 0 12px",
          fontFamily: mono ? F.mono : font,
          fontSize: size, color: C.cream,
          fontWeight: 400, fontStyle: italic ? "italic" : "normal",
          outline: "none",
        }}
        onFocus={e => e.target.style.borderBottomColor = onFocusColor || C.gold}
        onBlur={e => e.target.style.borderBottomColor = C.borderLight}
      />
      {hint && <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", marginTop: 6, fontWeight: 300 }}>{hint}</p>}
    </div>
  );
}
function TinyField({ label, value, onChange, placeholder, mono = false, accent = C.gold }) {
  return (
    <div>
      <p style={{ fontFamily: F.sans, fontSize: 8, color: C.stone, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      <input
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "transparent",
          border: "none", borderBottom: `0.5px solid ${C.borderLight}`,
          padding: "4px 0 7px",
          fontFamily: mono ? F.mono : F.body,
          fontSize: mono ? 13 : 14, color: C.cream,
          fontWeight: 300, fontStyle: mono ? "normal" : "italic",
          outline: "none",
        }}
        onFocus={e => e.target.style.borderBottomColor = accent}
        onBlur={e => e.target.style.borderBottomColor = C.borderLight}
      />
    </div>
  );
}
function MargauxAsks({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <Ini letter="M" color={C.blush} s={22} />
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}>
        Margaux asks · {children}
      </p>
    </div>
  );
}
function SectionLead({ children, color = C.gold }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 14px" }}>
      <div style={{ flex: 1, height: "0.5px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <SC color={color} size={8.5}>{children}</SC>
      <div style={{ flex: 1, height: "0.5px", background: `linear-gradient(90deg, transparent, ${color})` }} />
    </div>
  );
}

// ─── 00 · ARRIVAL ─────────────────────────────────────
function Arrival({ next }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => setStage(2), 1500);
    const t3 = setTimeout(() => setStage(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 30px", textAlign: "center", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${C.gold}08 0%, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ opacity: stage >= 0 ? 1 : 0, transition: "opacity 1s ease", marginBottom: 36 }}>
        <Mono s={44} />
      </div>
      <div style={{ opacity: stage >= 1 ? 1 : 0, transform: stage >= 1 ? "translateY(0)" : "translateY(8px)", transition: "all 0.9s ease" }}>
        <Rule w="60px" m="0 auto 22px" />
        <h1 style={{ fontFamily: F.display, fontSize: 40, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.05, letterSpacing: -0.5 }}>
          The Ledger
        </h1>
        <p style={{ fontFamily: F.cn, fontSize: 12, color: C.stone, letterSpacing: 5, marginTop: 14 }}>私 人 帐 录</p>
      </div>
      <div style={{ opacity: stage >= 2 ? 1 : 0, transition: "opacity 0.9s ease 0.2s", marginTop: 48, maxWidth: 280 }}>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.7, fontWeight: 300 }}>
          A private record of the<br/>art of gathering, kept for you.
        </p>
      </div>
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", opacity: stage >= 3 ? 1 : 0, transition: "opacity 0.8s ease" }}>
        <button onClick={next} style={{ background: "none", border: "none", cursor: "pointer", color: C.gold, fontFamily: F.sans, fontSize: 9.5, letterSpacing: 4, textTransform: "uppercase", animation: "pulse 2.4s ease-in-out infinite" }}>
          tap to begin
        </button>
      </div>
    </div>
  );
}

// ─── 01 · FRAME — "your ledger, your founding" ────────
function Frame({ next, back }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 26px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, animation: "rise 0.6s ease", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <SC color={C.gold} size={8.5} style={{ whiteSpace: "nowrap" }}>Founder · Your Ledger</SC>
          <p style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 6, lineHeight: 1 }}>Book № 001</p>
        </div>
        <div style={{ width: 46, height: 46, borderRadius: "50%", border: `0.5px solid ${C.gold}80`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: `radial-gradient(circle at 35% 30%, ${C.gold}30, ${C.gold}10 50%, transparent 70%)` }}>
          <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: `0.5px dashed ${C.gold}40` }} />
          <span style={{ fontFamily: F.display, fontSize: 18, color: C.gold, fontStyle: "italic" }}>L</span>
        </div>
      </div>

      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginTop: 4, marginBottom: 12, animation: "rise 0.7s ease" }}>
        This book is yours.<br/>Margaux is mine to share.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.65, fontWeight: 300, marginBottom: 18, animation: "rise 0.8s ease" }}>
        Six small moves to start. The rest — your circle, the address book, the practical kit — we'll come back to as you live.
      </p>

      <Rule w="44px" m="0 0 14px 0" />

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {RITUAL.map((r, i) => {
          const accent = r.n === "04" ? C.gold : C.goldMuted; // Rome step is highlighted
          return (
            <div key={r.n} style={{
              display: "flex", alignItems: "baseline", gap: 12,
              padding: "8px 0",
              borderBottom: i === RITUAL.length - 1 ? "none" : `0.5px solid ${C.border}`,
              animation: `rise 0.4s ease ${0.04 * i + 0.3}s both`,
            }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, color: accent, letterSpacing: 1, width: 18 }}>{r.n}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F.display, fontSize: 14, color: r.n === "04" ? C.gold : C.cream, fontWeight: 500 }}>{r.title}</p>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", marginTop: 1, fontWeight: 300 }}>{r.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Later prompts — set the expectation that more comes naturally */}
      <div style={{ marginTop: 16, padding: "12px 14px", border: `0.5px solid ${C.border}`, background: C.card, borderLeft: `1.5px solid ${C.blush}`, animation: "rise 0.5s ease 0.6s both" }}>
        <SC color={C.blush} size={7.5} style={{ marginBottom: 10 }}>Later, when it's useful</SC>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {LATER_PROMPTS.map(p => (
            <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <Dot color={C.blush} s={3} />
              <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}>{p.title}</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: F.body, fontSize: 10.5, color: C.stone, fontStyle: "italic", marginTop: 10, fontWeight: 300, lineHeight: 1.45 }}>
          Margaux will ask for each when it actually matters. Nothing is hidden — just patient.
        </p>
      </div>

      <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300, marginTop: 16, textAlign: "center" }}>
        Nothing is shared. Nothing is sold.<br/>The book is bound to you alone.
      </p>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Begin the ritual</Btn>
      <button onClick={back} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer", marginTop: 14, padding: 0 }}>
        not yet
      </button>
    </div>
  );
}

// ─── 02 · MARGAUX (with presence ticker) ──────────────
function MargauxStep({ next }) {
  // Live "what she just did" feed — proves she's real, working, present
  const PRESENCE = [
    { t: "14:08", body: "held the corner at Le Doyenné for a member" },
    { t: "13:47", body: "confirmed Aman Tokyo · suite 3304" },
    { t: "13:30", body: "cleared a Pomeranian's papers for Nice" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 26px 40px" }}>
      <SC color={C.blush}>You should meet someone</SC>

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 110, height: 142, position: "relative", marginBottom: 16, animation: "rise 0.6s ease" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `repeating-linear-gradient(135deg, #1A1815 0 6px, #131210 6px 12px)`,
            border: `0.5px solid ${C.borderLight}`,
          }} />
          <div style={{ position: "absolute", inset: 10, border: `0.5px solid ${C.blush}50`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <span style={{ fontFamily: F.display, fontSize: 36, color: C.blush, fontStyle: "italic", fontWeight: 300 }}>M</span>
            <Rule w="20px" m="6px auto" c={C.blush} />
            <span style={{ fontFamily: F.mono, fontSize: 7, color: C.blush, letterSpacing: 2 }}>PARIS</span>
          </div>
        </div>

        <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15 }}>
          Margaux
        </h1>

        {/* Live presence chip */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8, padding: "3px 10px 3px 8px", border: `0.5px solid ${C.sage}50`, background: `${C.sage}08`, whiteSpace: "nowrap" }}>
          <Dot color={C.sage} s={5} glow />
          <span style={{ fontFamily: F.sans, fontSize: 8, color: C.sage, letterSpacing: 1.8, textTransform: "uppercase" }}>at her desk · 14h22 cet</span>
        </div>

        <div style={{ marginTop: 18, padding: "16px 16px", border: `0.5px solid ${C.border}`, background: `${C.blush}05`, borderLeft: `1.5px solid ${C.blush}`, textAlign: "left", width: "100%" }}>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.cream, fontStyle: "italic", lineHeight: 1.6, fontWeight: 300 }}>
            "Hello. I'm Margaux. I'll be at the desk in Paris while you sleep in Hong Kong, and the other way round.
            <br/><br/>
            Tell me your name, your cities, the trip you most want to take. The rest we shape over time."
          </p>
          <p style={{ fontFamily: F.sans, fontSize: 9, color: C.blush, letterSpacing: 2.4, textTransform: "uppercase", marginTop: 12 }}>— m.</p>
        </div>

        {/* Presence ticker — what she just did, social proof */}
        <div style={{ marginTop: 14, width: "100%", padding: "11px 12px", border: `0.5px solid ${C.border}`, background: C.card, textAlign: "left" }}>
          <SC color={C.stone} size={7.5} style={{ marginBottom: 8 }}>In the last hour, for others</SC>
          {PRESENCE.map((p, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "baseline",
              padding: "5px 0",
              borderTop: i === 0 ? "none" : `0.5px solid ${C.border}`,
            }}>
              <span style={{ fontFamily: F.mono, fontSize: 9, color: C.goldMuted, letterSpacing: 0.5, width: 32 }}>{p.t}</span>
              <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.45, flex: 1 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Pleased to meet her</Btn>
    </div>
  );
}

// ─── 03 · NAME ────────────────────────────────────────
function NameStep({ next, state, set }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>what shall I call you?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 28 }}>
        The one your<br/>friends use.
      </h1>
      <Field label="Given name" value={state.firstName} onChange={v => set({ firstName: v })} placeholder="Chloe" />
      <Field label="Family name" value={state.lastName} onChange={v => set({ lastName: v })} placeholder="Lam" />
      <Field label="In your mother tongue · optional" value={state.cnName} onChange={v => set({ cnName: v })} placeholder="林晚晴" font={F.cn} italic={false} size={22} />
      <div style={{ flex: 1 }} />
      <Btn full onClick={next} primary={!!state.firstName}>Continue</Btn>
    </div>
  );
}

// ─── 04 · CITIES ──────────────────────────────────────
function CitiesStep({ next, state, set }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>where do you keep a bag?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 28 }}>
        Home is plural<br/>for women like you.
      </h1>
      <Field label="Primary" value={state.city1} onChange={v => set({ city1: v })} placeholder="Hong Kong" size={22} />
      <Field label="And also" value={state.city2} onChange={v => set({ city2: v })} placeholder="London" size={22} hint="A pied-à-terre, the city you fly to without thinking." />
      <div style={{ flex: 1 }} />
      <Btn full onClick={next} primary={!!state.city1}>Continue</Btn>
    </div>
  );
}

// ─── 05 · YEAR AHEAD (THE BIG ONE — captured early) ───
function YearAheadStep({ next, state, set }) {
  const update = (i, patch) => {
    const trips = state.yearAhead.map((t, idx) => idx === i ? { ...t, ...patch } : t);
    set({ yearAhead: trips });
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>let's start with the one you most want.</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 8 }}>
        The year ahead.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 20, fontWeight: 300 }}>
        Rome first. I'll begin scoping the moment you continue. The other months can stay sketchy.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.yearAhead.map((t, i) => {
          const lead = t.lead;
          return (
            <div key={i} style={{
              padding: "14px 14px",
              background: lead ? `${C.gold}08` : C.card,
              border: `0.5px solid ${lead ? C.gold : C.border}`,
              borderLeft: lead ? `1.5px solid ${C.gold}` : `0.5px solid ${C.border}`,
              position: "relative",
            }}>
              {lead && (
                <span style={{
                  position: "absolute", top: -1, right: 12,
                  fontFamily: F.sans, fontSize: 7.5, color: C.bg, letterSpacing: 1.8,
                  background: C.gold, padding: "2px 7px", textTransform: "uppercase", fontWeight: 500,
                }}>Margaux starts here</span>
              )}
              <span style={{ fontFamily: F.mono, fontSize: 10, color: lead ? C.gold : C.goldMuted, letterSpacing: 1.5, textTransform: "uppercase" }}>{t.month}</span>
              <input
                value={t.destination}
                onChange={e => update(i, { destination: e.target.value })}
                placeholder={lead ? "Rome" : "Where (or leave blank)"}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  borderBottom: `0.5px solid ${C.borderLight}`, padding: "2px 0 6px",
                  fontFamily: F.display, fontSize: 18, color: C.cream,
                  fontWeight: 400, fontStyle: "italic", outline: "none", marginTop: 4, marginBottom: 8,
                }}
                onFocus={e => e.target.style.borderBottomColor = lead ? C.gold : C.borderLight}
                onBlur={e => e.target.style.borderBottomColor = C.borderLight}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                <TinyField label="Dates" value={t.dates} onChange={v => update(i, { dates: v })} placeholder="Jun 8 – 14" mono />
                <TinyField label="You're" value={t.role} onChange={v => update(i, { role: v })} placeholder="hosting / guest" />
              </div>
              <textarea
                value={t.why}
                onChange={e => update(i, { why: e.target.value })}
                placeholder={lead ? "A long table somewhere out of season. One day at the Borghese." : "Why this one (optional)"}
                rows={2}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  padding: "4px 0", resize: "none",
                  fontFamily: F.body, fontSize: 12.5, color: C.cream,
                  fontStyle: "italic", fontWeight: 300, lineHeight: 1.55,
                  outline: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      <button onClick={() => set({ yearAhead: [...state.yearAhead, { month: "Later", destination: "", dates: "", role: "", why: "" }] })} style={{
        marginTop: 10, padding: "10px 14px",
        background: "transparent", border: `0.5px dashed ${C.borderLight}`,
        color: C.stone, fontFamily: F.body, fontSize: 13, fontStyle: "italic",
        cursor: "pointer", textAlign: "left", fontWeight: 300,
      }}>
        + Add another month
      </button>

      <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginTop: 14, letterSpacing: 1, textAlign: "center" }}>
        rough is enough · margaux fills the rest
      </p>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Continue</Btn>
    </div>
  );
}

// ─── 06 · PERMISSIONS (contacts + calendar) ───────────
function PermissionsStep({ next, state, set }) {
  const [phase, setPhase] = useState(state.contactsImported ? "done" : "ask"); // ask | scanning | done
  const grant = () => {
    setPhase("scanning");
    setTimeout(() => {
      set({ contactsImported: true, calendarImported: true });
      setPhase("done");
    }, 1800);
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>may I read two things — quietly?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 10 }}>
        Your address book<br/>and your calendar.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", lineHeight: 1.6, fontWeight: 300, marginBottom: 20 }}>
        Names so I know which Aria you mean. Calendar so I never book over your sister's wedding.
      </p>

      <div style={{
        padding: "20px 18px",
        border: `0.5px solid ${phase === "done" ? C.gold : C.borderLight}`,
        background: phase !== "ask" ? `${C.gold}06` : C.card,
        position: "relative", transition: "all 0.4s ease",
      }}>
        {[
          { t: 8, l: 8, bt: 1, bl: 1 }, { t: 8, r: 8, bt: 1, br: 1 },
          { b: 8, l: 8, bb: 1, bl: 1 }, { b: 8, r: 8, bb: 1, br: 1 },
        ].map((p, i) => (
          <div key={i} style={{
            position: "absolute", width: 10, height: 10,
            ...(p.t !== undefined && { top: p.t }), ...(p.b !== undefined && { bottom: p.b }),
            ...(p.l !== undefined && { left: p.l }), ...(p.r !== undefined && { right: p.r }),
            borderTop: p.bt ? `0.5px solid ${phase === "done" ? C.gold : C.goldMuted}` : "none",
            borderBottom: p.bb ? `0.5px solid ${phase === "done" ? C.gold : C.goldMuted}` : "none",
            borderLeft: p.bl ? `0.5px solid ${phase === "done" ? C.gold : C.goldMuted}` : "none",
            borderRight: p.br ? `0.5px solid ${phase === "done" ? C.gold : C.goldMuted}` : "none",
            opacity: 0.7,
          }} />
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SC color={phase === "done" ? C.gold : C.goldMuted} size={8}>Permission · read-only</SC>
          <span style={{ fontFamily: F.mono, fontSize: 8.5, color: C.stone, letterSpacing: 1 }}>REVOCABLE</span>
        </div>
        <Rule w="32px" m="12px 0" c={phase === "done" ? C.gold : C.goldMuted} />

        {phase === "ask" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { k: "Contacts", v: "Names, cities, call frequency. Not messages. Not photos." },
                { k: "Calendar",  v: "Busy/free only. Titles stay yours." },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingTop: i === 0 ? 0 : 8, borderTop: i === 0 ? "none" : `0.5px solid ${C.border}` }}>
                  <Dot color={C.goldMuted} s={4} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: F.display, fontSize: 13, color: C.cream, fontWeight: 500 }}>{row.k}</p>
                    <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontStyle: "italic", marginTop: 2, fontWeight: 300, lineHeight: 1.5 }}>{row.v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "scanning" && (
          <div>
            <div style={{ position: "relative", height: 56, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(135deg, #1A1815 0 6px, #131210 6px 12px)`, opacity: 0.6 }} />
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "1px",
                background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
                animation: "scan 1.6s ease-in-out infinite",
              }} />
              <style>{`@keyframes scan { 0%{top:0} 50%{top:54px} 100%{top:0} }`}</style>
            </div>
            <p style={{ fontFamily: F.mono, fontSize: 9.5, color: C.gold, letterSpacing: 2, marginTop: 10, textAlign: "center", animation: "pulse 1.4s ease infinite" }}>
              READING · CONTACTS + CAL
            </p>
          </div>
        )}

        {phase === "done" && (
          <div>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", lineHeight: 1.55, fontWeight: 300 }}>
              Read. I've a guess at five names you'd put in your circle — you'll confirm them on the next screen. The calendar's marked May–Oct so I won't book over what's there.
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Tag filled color={C.gold} size={8}>428 contacts · 5 guessed</Tag>
              <Tag color={C.stone} size={8}>6 mo. of calendar</Tag>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontStyle: "italic", marginTop: 14, fontWeight: 300, textAlign: "center", lineHeight: 1.6 }}>
        Revoke from Settings · she keeps only what you confirm
      </p>

      <div style={{ flex: 1 }} />
      {phase !== "done" ? (
        <Btn full onClick={grant} primary={phase !== "scanning"} style={{ opacity: phase === "scanning" ? 0.6 : 1 }}>
          {phase === "scanning" ? "Reading…" : "Yes, she may"}
        </Btn>
      ) : (
        <Btn full onClick={next}>See who she found</Btn>
      )}
      {phase === "ask" && (
        <button onClick={next} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer", marginTop: 14, padding: 0 }}>
          I'll add names by hand
        </button>
      )}
    </div>
  );
}

// ─── 07 · CIRCLE (honest "guess" copy) ────────────────
function CircleStep({ next, state, set }) {
  const toggle = (id) => {
    const has = state.circle.includes(id);
    set({ circle: has ? state.circle.filter(x => x !== id) : [...state.circle, id] });
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>who do you actually call?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 6 }}>
        Your circle.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 18, fontWeight: 300 }}>
        {state.contactsImported
          ? "A first guess — based on who you ★, call, and text. Tell me if I'm wrong."
          : "Tap the ones you'd travel with. Add more by hand."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {ADDRESS_BOOK.map(p => {
          const on = state.circle.includes(p.id);
          const isGuess = state.contactsImported && p.suggested;
          return (
            <button key={p.id} onClick={() => toggle(p.id)} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "11px 14px",
              background: on ? `${p.color}10` : C.card,
              border: `0.5px solid ${on ? p.color + "80" : C.border}`,
              cursor: "pointer", textAlign: "left",
              transition: "all 0.2s", position: "relative",
            }}>
              {isGuess && (
                <span style={{
                  position: "absolute", top: -1, right: 14,
                  fontFamily: F.mono, fontSize: 7.5, color: C.gold, letterSpacing: 1.5,
                  background: C.bg, padding: "1px 5px", border: `0.5px solid ${C.goldMuted}`,
                }}>guess</span>
              )}
              <Ini letter={p.initial} s={28} color={p.color} filled={on} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: F.display, fontSize: 14, color: C.cream, fontWeight: 500 }}>{p.name}</p>
                <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 1 }}>{p.city}</p>
                {state.contactsImported && (
                  <p style={{ fontFamily: F.mono, fontSize: 7.5, color: C.goldMuted, letterSpacing: 0.8, marginTop: 3, textTransform: "uppercase" }}>{p.signal}</p>
                )}
              </div>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: `0.5px solid ${on ? p.color : C.stone + "40"}`,
                background: on ? p.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <span style={{ color: C.bg, fontSize: 9, fontFamily: F.sans, fontWeight: 500 }}>✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      <button style={{
        marginTop: 8, padding: "10px 14px",
        background: "transparent", border: `0.5px dashed ${C.borderLight}`,
        color: C.stone, fontFamily: F.body, fontSize: 13, fontStyle: "italic",
        cursor: "pointer", textAlign: "left", fontWeight: 300,
      }}>
        + Add someone by hand
      </button>

      <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginTop: 14, letterSpacing: 1, textAlign: "center" }}>
        {state.circle.length} selected · notes on each one later
      </p>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Continue</Btn>
    </div>
  );
}

// ─── 08 · TRAVELLING WITH (multi, +add another) ───────
function CompanionsStep({ next, state, set }) {
  const update = (id, patch) => {
    set({ companions: state.companions.map(c => c.id === id ? { ...c, ...patch, fields: { ...(c.fields || {}), ...(patch.fields || {}) } } : c) });
  };
  const remove = (id) => set({ companions: state.companions.filter(c => c.id !== id) });
  const add = (kind) => {
    const id = `c${Date.now().toString(36).slice(-4)}`;
    set({ companions: [...state.companions, { id, kind, name: "", fields: {} }] });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>who else boards with you?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 6 }}>
        Travelling with.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 18, fontWeight: 300 }}>
        Add as many as you actually travel with. Two dogs is fine.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {state.companions.map(c => {
          const def = COMPANION_KINDS[c.kind] || COMPANION_KINDS.other;
          const accent = def.accent;
          return (
            <div key={c.id} style={{ padding: "14px 14px", background: `${accent}08`, border: `0.5px solid ${accent}60`, borderLeft: `1.5px solid ${accent}`, position: "relative" }}>
              <button onClick={() => remove(c.id)} style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "transparent", border: `0.5px solid ${C.border}`, color: C.stone, fontFamily: F.sans, fontSize: 10, cursor: "pointer", lineHeight: 1 }}>×</button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Tag color={accent} size={8}>{def.label}</Tag>
              </div>
              <input
                value={c.name}
                onChange={e => update(c.id, { name: e.target.value })}
                placeholder={c.kind === "pet" ? "Biscuit" : c.kind === "partner" ? "Their name" : c.kind === "child" ? "Their name" : "Name / role"}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  borderBottom: `0.5px solid ${C.borderLight}`, padding: "2px 0 7px",
                  fontFamily: F.display, fontSize: 17, color: C.cream,
                  fontWeight: 400, fontStyle: "italic", outline: "none",
                }}
                onFocus={e => e.target.style.borderBottomColor = accent}
                onBlur={e => e.target.style.borderBottomColor = C.borderLight}
              />

              {/* Kind-specific fields */}
              {c.kind === "pet" && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                    <TinyField label="Breed" value={c.fields?.breed} onChange={v => update(c.id, { fields: { breed: v } })} placeholder="Pomeranian" accent={accent} />
                    <TinyField label="Weight" value={c.fields?.weight} onChange={v => update(c.id, { fields: { weight: v } })} placeholder="3.2 kg" mono accent={accent} />
                  </div>
                  <TinyField label="Microchip · ISO" value={c.fields?.chip} onChange={v => update(c.id, { fields: { chip: v } })} placeholder="991 00012 4458" mono accent={accent} />
                  <button onClick={() => update(c.id, { fields: { cabin: !c.fields?.cabin } })} style={{
                    display: "flex", alignItems: "center", gap: 10, marginTop: 12,
                    background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
                  }}>
                    <div style={{
                      width: 28, height: 16, borderRadius: 8, position: "relative",
                      background: c.fields?.cabin ? accent : C.border,
                      transition: "background 0.2s",
                    }}>
                      <div style={{ position: "absolute", top: 2, left: c.fields?.cabin ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: C.cream, transition: "left 0.2s" }} />
                    </div>
                    <span style={{ fontFamily: F.body, fontSize: 12, color: C.creamSoft, fontStyle: "italic", fontWeight: 300 }}>Cabin-eligible</span>
                  </button>
                </div>
              )}
              {(c.kind === "partner" || c.kind === "child" || c.kind === "other") && (
                <div style={{ marginTop: 10 }}>
                  <TinyField label={c.kind === "child" ? "Age" : "How they travel with you"} value={c.fields?.sub} onChange={v => update(c.id, { fields: { sub: v } })} placeholder={c.kind === "partner" ? "Most trips · same airlines" : c.kind === "child" ? "8" : "Stylist / assistant / mother"} accent={accent} />
                </div>
              )}

              <p style={{ fontFamily: F.mono, fontSize: 8, color: C.goldMuted, marginTop: 12, letterSpacing: 1, lineHeight: 1.5 }}>
                {c.kind === "pet" ? "Rabies records · health certificates · vet history — add from the pet desk" : "Full preferences, ID, contacts — add from their profile"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Add buttons */}
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {Object.entries(COMPANION_KINDS).map(([key, def]) => (
          <button key={key} onClick={() => add(key)} style={{
            padding: "9px 12px", background: "transparent",
            border: `0.5px dashed ${def.accent}50`,
            color: def.accent, fontFamily: F.sans, fontSize: 9, letterSpacing: 2,
            textTransform: "uppercase", cursor: "pointer", textAlign: "left",
          }}>
            + {def.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Continue</Btn>
    </div>
  );
}

// ─── 09 · THE DESK (quiet hours, channels, tier) ──────
function DeskStep({ next, state, set }) {
  const setDesk = (patch) => set({ desk: { ...state.desk, ...patch } });
  const toggleChannel = (id) => {
    const has = state.desk.channels.includes(id);
    setDesk({ channels: has ? state.desk.channels.filter(x => x !== id) : [...state.desk.channels, id] });
  };
  const CHANNELS = [
    { id: "whatsapp", label: "WhatsApp" },
    { id: "sms",      label: "SMS" },
    { id: "voice",    label: "Voice call" },
    { id: "signal",   label: "Signal" },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>when and how should I reach you?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 6 }}>
        The desk.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 20, fontWeight: 300 }}>
        Where to find you, when not to.
      </p>

      <SectionLead>Quiet hours</SectionLead>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 }}>
        <TinyField label="No messages from" value={state.desk.quietFrom} onChange={v => setDesk({ quietFrom: v })} placeholder="22:00" mono />
        <TinyField label="Until"             value={state.desk.quietTo}   onChange={v => setDesk({ quietTo: v })}   placeholder="08:00" mono />
      </div>
      <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", marginBottom: 22, fontWeight: 300 }}>
        Your local time. Emergencies still come through.
      </p>

      <SectionLead>Reach me on</SectionLead>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 22 }}>
        {CHANNELS.map(ch => {
          const on = state.desk.channels.includes(ch.id);
          return (
            <button key={ch.id} onClick={() => toggleChannel(ch.id)} style={{
              padding: "11px 12px", background: on ? `${C.gold}12` : C.card,
              border: `0.5px solid ${on ? C.gold : C.border}`,
              color: on ? C.gold : C.creamSoft,
              fontFamily: F.display, fontSize: 13, fontStyle: "italic",
              cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                border: `0.5px solid ${on ? C.gold : C.stone}50`,
                background: on ? C.gold : "transparent",
              }} />
              {ch.label}
            </button>
          );
        })}
      </div>

      <SectionLead>Membership</SectionLead>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {TIERS.map(tier => {
          const on = state.desk.tier === tier.id;
          return (
            <button key={tier.id} onClick={() => setDesk({ tier: tier.id })} style={{
              padding: "13px 14px", background: on ? `${C.gold}10` : C.card,
              border: `0.5px solid ${on ? C.gold : C.border}`,
              borderLeft: on ? `1.5px solid ${C.gold}` : `0.5px solid ${C.border}`,
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p style={{ fontFamily: F.display, fontSize: 16, color: on ? C.gold : C.cream, fontWeight: 500 }}>{tier.name}</p>
                {on && <Tag filled color={C.gold} size={7.5}>chosen</Tag>}
              </div>
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.creamSoft, fontStyle: "italic", marginTop: 3, fontWeight: 300 }}>{tier.line}</p>
              <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontStyle: "italic", marginTop: 2, fontWeight: 300 }}>{tier.desc}</p>
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: F.body, fontSize: 11, color: C.goldMuted, fontStyle: "italic", marginTop: 12, fontWeight: 300, textAlign: "center" }}>
        Change the tier anytime · founder access is on us, for now.
      </p>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Continue</Btn>
    </div>
  );
}

// ─── 10 · THE KIT (passport, dietary, emergency) ──────
function KitStep({ next, state, set }) {
  const setKit = (patch) => set({ kit: { ...state.kit, ...patch } });
  const toggleDiet = (tag) => {
    const has = state.kit.dietary.includes(tag);
    setKit({ dietary: has ? state.kit.dietary.filter(x => x !== tag) : [...state.kit.dietary, tag] });
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>the small practical kit.</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 8 }}>
        The kit.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 20, fontWeight: 300 }}>
        The things I'd ask a hotel for you. Skip anything you'd rather add later.
      </p>

      <SectionLead>Travel papers</SectionLead>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
        <TinyField label="Passport from" value={state.kit.passport?.country} onChange={v => setKit({ passport: { ...state.kit.passport, country: v } })} placeholder="Hong Kong SAR" />
        <TinyField label="Expires" value={state.kit.passport?.expires} onChange={v => setKit({ passport: { ...state.kit.passport, expires: v } })} placeholder="2029-08" mono />
      </div>
      <div style={{ marginBottom: 24 }}>
        <TinyField label="Known Traveler / GE · optional" value={state.kit.ktn} onChange={v => setKit({ ktn: v })} placeholder="153482210" mono />
      </div>

      <SectionLead>How you eat</SectionLead>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
        {DIETARY_TAGS.map(tag => {
          const on = state.kit.dietary.includes(tag);
          return (
            <button key={tag} onClick={() => toggleDiet(tag)} style={{
              padding: "5px 11px",
              background: on ? `${C.sage}15` : "transparent",
              border: `0.5px solid ${on ? C.sage : C.border}`,
              color: on ? C.sage : C.creamSoft,
              fontFamily: F.sans, fontSize: 10, letterSpacing: 1.2,
              textTransform: "uppercase", cursor: "pointer",
            }}>
              {tag}
            </button>
          );
        })}
      </div>
      <div style={{ marginBottom: 24 }}>
        <TinyField label="Allergies / specific notes" value={state.kit.allergies} onChange={v => setKit({ allergies: v })} placeholder="Severe — peanuts. Always EpiPen in carry-on." />
      </div>

      <SectionLead color={C.red}>Emergency · one person</SectionLead>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 10 }}>
        <TinyField label="Name" value={state.kit.emergency?.name} onChange={v => setKit({ emergency: { ...state.kit.emergency, name: v } })} placeholder="Ming Lam" accent={C.red} />
        <TinyField label="Relation" value={state.kit.emergency?.relation} onChange={v => setKit({ emergency: { ...state.kit.emergency, relation: v } })} placeholder="brother" accent={C.red} />
      </div>
      <TinyField label="Phone" value={state.kit.emergency?.phone} onChange={v => setKit({ emergency: { ...state.kit.emergency, phone: v } })} placeholder="+852 6890 0021" mono accent={C.red} />

      <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", marginTop: 14, fontWeight: 300, textAlign: "center" }}>
        Encrypted · only Margaux and your on-call concierge see this.
      </p>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Continue</Btn>
      <button onClick={next} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer", marginTop: 14, padding: 0 }}>
        I'll fill the rest later
      </button>
    </div>
  );
}

// ─── 11 · TONES ───────────────────────────────────────
function TonesStep({ next, state, set }) {
  const toggle = (id) => {
    const has = state.tones.includes(id);
    if (has) set({ tones: state.tones.filter(x => x !== id) });
    else if (state.tones.length < 3) set({ tones: [...state.tones, id] });
  };
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>what does a good year feel like?</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 6 }}>
        Your tones.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 20, fontWeight: 300 }}>
        Up to three. The shape of every trip flows from here.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {VIBES.map(v => {
          const on = state.tones.includes(v.id);
          return (
            <button key={v.id} onClick={() => toggle(v.id)} style={{
              padding: "16px 14px",
              background: on ? `${v.color}12` : C.card,
              border: `0.5px solid ${on ? v.color : C.border}`,
              cursor: "pointer", textAlign: "left",
              minHeight: 110,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              transition: "all 0.2s",
            }}>
              <p style={{ fontFamily: F.display, fontSize: 18, color: on ? v.color : C.cream, fontWeight: 400, fontStyle: "italic" }}>{v.word}</p>
              <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", lineHeight: 1.45, fontWeight: 300, marginTop: 8 }}>{v.sub}</p>
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginTop: 14, letterSpacing: 1, textAlign: "center" }}>
        {state.tones.length} / 3 chosen
      </p>
      <div style={{ flex: 1 }} />
      <Btn full onClick={next} primary={state.tones.length > 0}>Continue</Btn>
    </div>
  );
}

// ─── 12 · PLACES WORTH KEEPING (Black Book + Memory) ──
function PlacesStep({ next, state, set }) {
  const updateBB = (i, patch) => set({ blackBook: state.blackBook.map((b, idx) => idx === i ? { ...b, ...patch } : b) });
  const updatePT = (i, patch) => set({ pastTrips: state.pastTrips.map((t, idx) => idx === i ? { ...t, ...patch } : t) });
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>the places that already mattered.</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 6 }}>
        Places worth keeping.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginBottom: 18, fontWeight: 300 }}>
        Sketches now — voice notes and photos later.
      </p>

      <SectionLead>Black Book · three you'd send a friend</SectionLead>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {state.blackBook.map((b, i) => {
          const has = b.name || b.note;
          const placeholders = [
            { name: "Le Doyenné", city: "Saint-Vrain", note: "Ask James for the kitchen-garden room." },
            { name: "Aman Tokyo · 3304", city: "Tokyo", note: "The bath at dusk." },
            { name: "Madame Florence", city: "Paris", note: "Reads dress codes like scripture." },
          ];
          return (
            <div key={i} style={{
              padding: "12px 12px",
              background: has ? `${C.sage}08` : C.card,
              border: `0.5px solid ${has ? C.sage + "60" : C.border}`,
              borderLeft: has ? `1.5px solid ${C.sage}` : `0.5px solid ${C.border}`,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 10, marginBottom: 6 }}>
                <input value={b.name} onChange={e => updateBB(i, { name: e.target.value })} placeholder={placeholders[i]?.name || "Place"} style={inlineInputStyle(F.display, 14, true)} />
                <input value={b.city} onChange={e => updateBB(i, { city: e.target.value })} placeholder={placeholders[i]?.city || "City"} style={inlineInputStyle(F.mono, 11, false)} />
              </div>
              <input value={b.note} onChange={e => updateBB(i, { note: e.target.value })} placeholder={placeholders[i]?.note || "One line — why"} style={inlineInputStyle(F.body, 12.5, true)} />
            </div>
          );
        })}
      </div>

      <div style={{ height: 22 }} />

      <SectionLead color={C.dusk}>Memory Ledger · three trips still playing in your head</SectionLead>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {state.pastTrips.map((t, i) => {
          const has = t.place || t.note;
          const placeholders = [
            { place: "A trip you keep returning to", when: "Year · month" },
            { place: "Somewhere you still talk about", when: "Year · month" },
            { place: "A small one that stuck", when: "Year · month" },
          ];
          return (
            <div key={i} style={{
              padding: "12px 12px",
              background: has ? `${C.dusk}08` : C.card,
              border: `0.5px solid ${has ? C.dusk + "60" : C.border}`,
              borderLeft: has ? `1.5px solid ${C.dusk}` : `0.5px solid ${C.border}`,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 10, marginBottom: 6 }}>
                <input value={t.place} onChange={e => updatePT(i, { place: e.target.value })} placeholder={placeholders[i]?.place} style={inlineInputStyle(F.display, 14, true)} />
                <input value={t.when} onChange={e => updatePT(i, { when: e.target.value })} placeholder={placeholders[i]?.when} style={inlineInputStyle(F.mono, 11, false)} />
              </div>
              <input value={t.note} onChange={e => updatePT(i, { note: e.target.value })} placeholder="One line about it" style={inlineInputStyle(F.body, 12.5, true)} />
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginTop: 14, letterSpacing: 1, textAlign: "center" }}>
        photos · voice notes · richer detail — add anytime
      </p>

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Continue</Btn>
      <button onClick={next} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer", marginTop: 14, padding: 0 }}>
        skip — add later
      </button>
    </div>
  );
}
function inlineInputStyle(font, size, italic) {
  return {
    width: "100%", background: "transparent", border: "none",
    borderBottom: `0.5px solid ${C.borderLight}`, padding: "3px 0 6px",
    fontFamily: font, fontSize: size, color: C.cream,
    fontWeight: italic ? 300 : 400, fontStyle: italic ? "italic" : "normal",
    outline: "none",
  };
}

// ─── 13 · ONE FIRST WORD (record OR upload) ───────────
function FirstWordStep({ next, state, set }) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [mode, setMode] = useState("record"); // record | upload | write
  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px 26px 40px" }}>
      <MargauxAsks>one last thing.</MargauxAsks>
      <h1 style={{ fontFamily: F.display, fontSize: 23, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15 }}>
        Tell me one thing<br/>that would make this<br/>year unforgettable.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginTop: 8, fontWeight: 300 }}>
        Record, upload, or write. I'll keep it.
      </p>

      {/* Mode switcher */}
      <div style={{ display: "flex", gap: 5, marginTop: 16, marginBottom: 12 }}>
        {[{ id: "record", l: "Record" }, { id: "upload", l: "Upload" }, { id: "write", l: "Write" }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex: 1, padding: "8px 10px",
            background: mode === m.id ? `${C.gold}12` : "transparent",
            border: `0.5px solid ${mode === m.id ? C.gold : C.border}`,
            color: mode === m.id ? C.gold : C.stone,
            fontFamily: F.sans, fontSize: 9.5, letterSpacing: 2,
            textTransform: "uppercase", cursor: "pointer",
          }}>{m.l}</button>
        ))}
      </div>

      {mode === "record" && (
        <div style={{ padding: "20px 18px 18px", border: `0.5px solid ${recording ? C.gold : C.border}`, background: recording ? `${C.gold}06` : C.card }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: 48, marginBottom: 12 }}>
            {Array.from({ length: 27 }).map((_, i) => {
              const base = Math.abs(Math.sin((i + 1) * 1.7)) * 24 + 6;
              return <div key={i} style={{
                width: 2, height: recording ? base + Math.random() * 12 : base * 0.5,
                background: recording ? C.gold : C.borderLight,
                transition: "all 0.3s",
                animation: recording ? `pulse ${1 + (i % 5) * 0.2}s ease-in-out infinite` : "none",
                animationDelay: `${i * 0.05}s`,
              }} />;
            })}
          </div>
          <div style={{ textAlign: "center" }}>
            <button onClick={() => setRecording(r => !r)} style={{
              width: 54, height: 54, borderRadius: "50%", border: `0.5px solid ${C.gold}`,
              background: recording ? C.gold : "transparent", cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: recording ? 14 : 22, height: recording ? 14 : 22, borderRadius: recording ? 2 : "50%", background: recording ? C.bg : C.gold, transition: "all 0.2s" }} />
            </button>
            <p style={{ fontFamily: F.mono, fontSize: 10, color: recording ? C.gold : C.stone, marginTop: 10, letterSpacing: 1.5 }}>
              {recording ? `RECORDING · ${String(Math.floor(secs/60)).padStart(2,"0")}:${String(secs%60).padStart(2,"0")}` : "PRESS TO RECORD"}
            </p>
          </div>
        </div>
      )}

      {mode === "upload" && (
        <div style={{ padding: "26px 18px", border: `0.5px dashed ${C.goldMuted}`, background: C.card, textAlign: "center" }}>
          <p style={{ fontFamily: F.display, fontSize: 16, color: C.cream, fontStyle: "italic", marginBottom: 6 }}>Drop a voice memo</p>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", fontWeight: 300, marginBottom: 14 }}>
            .m4a, .mp3, .wav — anything you've already recorded. Maybe one of the unaired podcast notes.
          </p>
          <button style={{
            padding: "8px 14px", background: "transparent",
            border: `0.5px solid ${C.gold}`, color: C.gold,
            fontFamily: F.sans, fontSize: 9.5, letterSpacing: 2.4,
            textTransform: "uppercase", cursor: "pointer",
          }}>
            Choose file
          </button>
        </div>
      )}

      {mode === "write" && (
        <textarea
          value={state.firstWord}
          onChange={e => set({ firstWord: e.target.value })}
          placeholder="A long table in Provence, with all of them around it."
          rows={5}
          style={{
            width: "100%", padding: "14px 14px",
            background: C.card, border: `0.5px solid ${C.border}`,
            fontFamily: F.body, fontSize: 14, color: C.cream, fontStyle: "italic", fontWeight: 300,
            outline: "none", resize: "none", lineHeight: 1.6,
          }}
        />
      )}

      <div style={{ flex: 1 }} />
      <Btn full onClick={next}>Send to Margaux</Btn>
      <button onClick={next} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer", marginTop: 14, padding: 0 }}>
        skip for now
      </button>
    </div>
  );
}

// ─── 14 · WELCOME (graceful fallback) ─────────────────
function Welcome({ done, state }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStage(1), 500);
    const b = setTimeout(() => setStage(2), 1300);
    const c = setTimeout(() => setStage(3), 2100);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, []);
  const name = state.firstName || "Chloe";
  const cnName = state.cnName;
  const lead = state.yearAhead.find(t => t.lead && t.destination) || state.yearAhead.find(t => t.destination);
  const pets = state.companions.filter(c => c.kind === "pet" && c.name);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 26px 40px", textAlign: "center", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${C.gold}10 0%, transparent 65%)`, pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: stage >= 1 ? 110 : 6, height: "0.5px", background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, transition: "width 0.9s ease", marginBottom: 22 }} />
        <Mono s={36} />

        <div style={{ marginTop: 24, opacity: stage >= 1 ? 1 : 0, transition: "opacity 0.8s ease" }}>
          <SC color={C.goldMuted} size={9}>Founder · Book № 001</SC>
          <h1 style={{ fontFamily: F.display, fontSize: 36, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 12, lineHeight: 1.05 }}>
            {name}.
          </h1>
          {cnName && <p style={{ fontFamily: F.cn, fontSize: 14, color: C.gold, letterSpacing: 4, marginTop: 8 }}>{cnName}</p>}
        </div>

        <div style={{ width: stage >= 2 ? 110 : 6, height: "0.5px", background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, transition: "width 0.9s ease", marginTop: 22 }} />

        <p style={{ opacity: stage >= 2 ? 1 : 0, transition: "opacity 0.8s ease", fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontStyle: "italic", marginTop: 22, lineHeight: 1.65, fontWeight: 300, maxWidth: 280 }}>
          The ledger is open.<br/>
          Margaux has your {state.circle.length || 0} names{pets.length ? `, ${pets.map(p => p.name).join(" & ")}'s papers` : ""},<br/>
          and {state.tones.length || "your"} tones to work with.
        </p>

        {/* Rome OR graceful fallback */}
        <div style={{ opacity: stage >= 2 ? 1 : 0, transition: "opacity 0.8s ease 0.2s", marginTop: 18, padding: "14px 14px", border: `0.5px solid ${C.gold}`, background: `linear-gradient(180deg, ${C.gold}10, ${C.bg})`, width: "100%", maxWidth: 300, textAlign: "left", position: "relative" }}>
          <span style={{
            position: "absolute", top: -1, right: 10,
            fontFamily: F.sans, fontSize: 7.5, color: C.bg, letterSpacing: 1.8,
            background: C.gold, padding: "2px 7px", textTransform: "uppercase", fontWeight: 500,
          }}>{lead ? "Drafting now" : "Margaux's reply"}</span>

          {lead ? (
            <div>
              <SC color={C.gold} size={8.5}>First trip · {lead.month}</SC>
              <h2 style={{ fontFamily: F.display, fontSize: 21, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 4, lineHeight: 1.1 }}>{lead.destination}</h2>
              {lead.dates && <p style={{ fontFamily: F.mono, fontSize: 10, color: C.creamSoft, marginTop: 3 }}>{lead.dates}</p>}
              <Rule w="22px" m="10px 0" />
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300 }}>
                "First pass in 48 hours — villas, the table, the chef."
              </p>
              <p style={{ fontFamily: F.sans, fontSize: 8.5, color: C.blush, letterSpacing: 2, textTransform: "uppercase", marginTop: 8 }}>— m.</p>
            </div>
          ) : (
            <div>
              <SC color={C.gold} size={8.5}>A letter, waiting</SC>
              <h2 style={{ fontFamily: F.display, fontSize: 19, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 4, lineHeight: 1.1 }}>I'll write Friday.</h2>
              <Rule w="22px" m="10px 0" />
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300 }}>
                "I've enough to start. Three places I think you'd love based on the tones. Reply if any pull at you."
              </p>
              <p style={{ fontFamily: F.sans, fontSize: 8.5, color: C.blush, letterSpacing: 2, textTransform: "uppercase", marginTop: 8 }}>— m.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ opacity: stage >= 3 ? 1 : 0, transition: "opacity 0.8s ease" }}>
        <Btn full onClick={done}>{lead ? `Open the ledger · ${lead.destination} is waiting` : "Open the ledger"}</Btn>
        <p style={{ fontFamily: F.sans, fontSize: 8.5, letterSpacing: 3, textTransform: "uppercase", color: C.stone, marginTop: 14 }}>est. mmxxvi · founder</p>
      </div>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState({
    firstName: "Chloe",
    lastName: "Lam",
    cnName: "林晚晴",
    city1: "Hong Kong",
    city2: "London",
    yearAhead: [
      { month: "Jun",  destination: "Rome",   dates: "Jun 8 – 14",  role: "hosting", why: "", lead: true },
      { month: "Jul",  destination: "",       dates: "",            role: "",        why: "" },
      { month: "Sep",  destination: "Amalfi", dates: "Sep 15 – 21", role: "guest",   why: "Iris's 40th — she's hosting." },
      { month: "Oct",  destination: "",       dates: "",            role: "",        why: "" },
    ],
    contactsImported: false,
    calendarImported: false,
    circle: ["sophia", "aria", "noor", "iris", "yuki"],
    companions: [
      { id: "c1", kind: "pet", name: "Biscuit", fields: { breed: "Pomeranian", weight: "3.2 kg", chip: "", cabin: true } },
    ],
    desk: {
      quietFrom: "22:00",
      quietTo: "08:00",
      channels: ["whatsapp", "voice"],
      tier: "atelier",
    },
    kit: {
      passport: { country: "Hong Kong SAR", expires: "" },
      ktn: "",
      dietary: ["No shellfish"],
      allergies: "",
      emergency: { name: "", relation: "", phone: "" },
    },
    tones: ["indulge", "restore"],
    blackBook: [
      { name: "", city: "", note: "" },
      { name: "", city: "", note: "" },
      { name: "", city: "", note: "" },
    ],
    pastTrips: [
      { place: "", when: "", note: "" },
      { place: "", when: "", note: "" },
      { place: "", when: "", note: "" },
    ],
    firstWord: "",
  });
  const set = (patch) => setState(s => ({ ...s, ...patch }));
  const TOTAL = 9; // 0..8
  const next = () => step < TOTAL - 1 ? setStep(s => s + 1) : onDone(state);
  const back = () => step > 0 ? setStep(s => s - 1) : null;

  const showBar = step >= 2 && step <= 7;

  return (
    <div key={step} style={{ height: "100%", background: C.bg, display: "flex", flexDirection: "column", color: C.cream, animation: "fadeIn 0.5s ease" }}>
      {showBar && (
        <div style={{ padding: "56px 22px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button onClick={back} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>
              ← back
            </button>
            <Mono s={20} />
            <Counter step={step} />
          </div>
          <ProgressBar step={step} />
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", animation: "rise 0.5s ease" }}>
        {step === 0  && <Arrival next={next} />}
        {step === 1  && <Frame next={next} back={back} />}
        {step === 2  && <MargauxStep next={next} />}
        {step === 3  && <NameStep next={next} state={state} set={set} />}
        {step === 4  && <CitiesStep next={next} state={state} set={set} />}
        {step === 5  && <YearAheadStep next={next} state={state} set={set} />}
        {step === 6  && <TonesStep next={next} state={state} set={set} />}
        {step === 7  && <FirstWordStep next={next} state={state} set={set} />}
        {step === 8  && <Welcome done={() => onDone(state)} state={state} />}
      </div>
    </div>
  );
}

window.ONBOARDING = { Onboarding };
