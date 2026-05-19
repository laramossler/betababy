// ─── MVP FLOW — Chloe's first trip ─────────────────────────
// Screens: welcome → you → trip → companions → forward → ready
// The point isn't features — it's the email-forwarding spine.

const MVP = (() => {

const C = {
  bg: "#0A0908", bgSoft: "#111010",
  card: "#151413", cardHover: "#1C1B19",
  cream: "#EDE8DF", creamSoft: "#B8B0A2",
  gold: "#B8A07A", goldDeep: "#9A8460", goldMuted: "#7A6D54",
  stone: "#928679", stoneSoft: "#54504A",
  border: "#252320", borderLight: "#322F2B",
  blush: "#C4A89A", sage: "#8E9E82", sea: "#7A9BA0", dusk: "#9890AE",
};
const F = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Cormorant Garamond', Garamond, serif",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── ATOMS ──────────────────────────────────────────────────
const Mono = ({ s = 26 }) => (
  <div style={{ width: s, height: s, border: `0.5px solid ${C.goldMuted}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: s * 0.42, color: C.gold, letterSpacing: 1.5, flexShrink: 0 }}>L</div>
);

const SC = ({ children, color = C.gold, size = 9, style = {} }) => (
  <span style={{ fontFamily: F.sans, fontSize: size, letterSpacing: 3.2, textTransform: "uppercase", color, fontWeight: 400, ...style }}>{children}</span>
);

const Btn = ({ children, onClick, primary = true, full = false, disabled = false, style = {} }) => (
  <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
    padding: "14px 22px",
    background: primary ? (disabled ? C.borderLight : C.gold) : "transparent",
    border: primary ? "none" : `0.5px solid ${C.borderLight}`,
    fontFamily: F.sans, fontSize: 9.5, letterSpacing: 3, textTransform: "uppercase",
    color: primary ? (disabled ? C.stoneSoft : C.bg) : C.creamSoft,
    cursor: disabled ? "default" : "pointer",
    width: full ? "100%" : "auto",
    transition: "all 0.2s",
    fontWeight: 500,
    opacity: disabled ? 0.6 : 1,
    ...style,
  }}>{children}</button>
);

const Field = ({ label, value, onChange, placeholder, hint, type = "text" }) => (
  <label style={{ display: "block", marginBottom: 22 }}>
    <div style={{ marginBottom: 7 }}><SC size={8.5}>{label}</SC></div>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        fontFamily: F.display, fontSize: 22, fontStyle: "italic", fontWeight: 400,
        color: C.cream, padding: "4px 0 10px",
        borderBottom: `0.5px solid ${C.border}`,
      }}
    />
    {hint && <p style={{ fontFamily: F.sans, fontSize: 10, color: C.stone, marginTop: 6, fontWeight: 300 }}>{hint}</p>}
  </label>
);

// Shell: every step has the same shape — header w/ progress + dismiss, scrolling body, footer with CTA
const Shell = ({ stepIdx, total, onBack, onSkip, children, cta, ctaDisabled, ctaLabel = "Continue", secondary = null }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, color: C.cream }}>
    {/* Header — pushed below iOS status bar */}
    <div style={{ padding: "58px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between", height: 86, flexShrink: 0 }}>
      <button onClick={onBack} disabled={!onBack} style={{ background: "none", border: "none", cursor: onBack ? "pointer" : "default", padding: 0, opacity: onBack ? 1 : 0 }}>
        <SC size={8.5} color={C.stone}>← Back</SC>
      </button>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 14, height: "1.5px",
            background: i <= stepIdx ? C.gold : C.borderLight,
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <button onClick={onSkip} style={{ background: "none", border: "none", cursor: onSkip ? "pointer" : "default", padding: 0, opacity: onSkip ? 1 : 0 }}>
        <SC size={8.5} color={C.stone}>Skip</SC>
      </button>
    </div>

    {/* Body */}
    <div className="rise" key={stepIdx} style={{ flex: 1, overflowY: "auto", padding: "28px 30px 20px" }}>
      {children}
    </div>

    {/* Footer */}
    <div style={{ padding: "16px 30px 30px", flexShrink: 0, background: `linear-gradient(to top, ${C.bg} 70%, transparent)` }}>
      {secondary}
      <Btn full primary onClick={cta} disabled={ctaDisabled}>{ctaLabel}</Btn>
    </div>
  </div>
);

// ─── 1. WELCOME ─────────────────────────────────────────────
const Welcome = ({ next }) => (
  <div style={{ height: "100%", padding: "80px 30px 40px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: `radial-gradient(ellipse at 50% 25%, #1A1815 0%, #0A0908 60%)`, animation: "fadeIn 0.6s ease both" }}>
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 36 }}>
      <Mono s={38} />
    </div>
    <div style={{ textAlign: "center" }}>
      <SC size={9} color={C.gold} style={{ display: "inline-block", marginBottom: 24 }}>The Ledger · for Chloe</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 42, fontWeight: 400, fontStyle: "italic", lineHeight: 1.08, color: C.cream, marginBottom: 20 }}>
        A private record<br/>of where you go,<br/>and who comes with you.
      </h1>
      <p style={{ fontFamily: F.body, fontSize: 17, fontWeight: 300, lineHeight: 1.55, color: C.creamSoft, maxWidth: 280, margin: "0 auto" }}>
        We'll start with one trip. Tell us a little about it — then forward the bookings as they come.
      </p>
    </div>
    <div>
      <Btn full primary onClick={next}>Begin</Btn>
      <p style={{ textAlign: "center", marginTop: 18, fontFamily: F.sans, fontSize: 10, color: C.stone, fontWeight: 300, letterSpacing: 0.3 }}>
        Already with us? <span style={{ color: C.gold, textDecoration: "underline", textUnderlineOffset: 2 }}>Sign in</span>
      </p>
    </div>
  </div>
);

// ─── 2. YOU ─────────────────────────────────────────────────
const YouStep = ({ data, set, next, back, stepIdx, total }) => (
  <Shell stepIdx={stepIdx} total={total} onBack={back}
    cta={next} ctaDisabled={!data.name || !data.email}>
    <SC color={C.gold}>Step one</SC>
    <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.cream, marginTop: 8, marginBottom: 6, lineHeight: 1.1 }}>
      Who are we keeping<br/>this for?
    </h2>
    <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 300, color: C.creamSoft, marginBottom: 36, lineHeight: 1.5 }}>
      Just the essentials. You can change any of this later.
    </p>

    <Field label="Name" value={data.name} onChange={v => set({ ...data, name: v })} placeholder="Chloe" />
    <Field label="Email" type="email" value={data.email} onChange={v => set({ ...data, email: v })} placeholder="chloe@example.com"
      hint="We'll match forwarded confirmations to this address." />
    <Field label="Home base" value={data.city} onChange={v => set({ ...data, city: v })} placeholder="Hong Kong" />
  </Shell>
);

// ─── 3. TRIP BASICS ─────────────────────────────────────────
const VIBES = [
  { id: "restore",   word: "Restore",   sub: "Stillness · white linen mornings",  color: "#D4CFC4" },
  { id: "explore",   word: "Explore",   sub: "Hidden doors · unknown corners",     color: "#C4B898" },
  { id: "indulge",   word: "Indulge",   sub: "Long tables · the right wine",       color: C.gold },
  { id: "escape",    word: "Escape",    sub: "Private coves · no itinerary",       color: C.sea },
  { id: "adventure", word: "Adventure", sub: "Salt on skin · sunrise you earned",  color: C.sage },
  { id: "celebrate", word: "Celebrate", sub: "Terraces · the right dress",          color: C.blush },
];

const VibeChip = ({ vibe, active, onClick }) => (
  <button onClick={onClick} style={{
    textAlign: "left",
    padding: "11px 12px",
    border: `0.5px solid ${active ? vibe.color : C.border}`,
    background: active ? `${vibe.color}12` : "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
    minWidth: 0,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: active ? vibe.color : "transparent",
        border: `0.5px solid ${vibe.color}`,
        display: "inline-block", flexShrink: 0,
      }} />
      <span style={{ fontFamily: F.display, fontSize: 16, fontStyle: "italic", fontWeight: 400, color: active ? C.cream : C.creamSoft }}>{vibe.word}</span>
    </div>
    <span style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", fontWeight: 300, display: "block", paddingLeft: 14, lineHeight: 1.3 }}>{vibe.sub}</span>
  </button>
);

const TripStep = ({ data, set, next, back, stepIdx, total }) => {
  const ready = data.where && data.start && data.end;
  const vibes = data.vibes || [];
  const toggleVibe = (id) => {
    const has = vibes.includes(id);
    set({ ...data, vibes: has ? vibes.filter(v => v !== id) : [...vibes, id] });
  };
  return (
    <Shell stepIdx={stepIdx} total={total} onBack={back} cta={next} ctaDisabled={!ready}>
      <SC color={C.gold}>Step two</SC>
      <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.cream, marginTop: 8, marginBottom: 6, lineHeight: 1.1 }}>
        Tell us about<br/>the trip.
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 300, color: C.creamSoft, marginBottom: 36, lineHeight: 1.5 }}>
        A working title and the dates. Everything else can arrive by forward.
      </p>

      <Field label="Where" value={data.where} onChange={v => set({ ...data, where: v })} placeholder="The South of France" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 30 }}>
        <div>
          <div style={{ marginBottom: 7 }}><SC size={8.5}>Arrive</SC></div>
          <input type="date" value={data.start} onChange={e => set({ ...data, start: e.target.value })}
            style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", color: data.start ? C.cream : C.stoneSoft, padding: "4px 0 10px", borderBottom: `0.5px solid ${C.border}`, colorScheme: "dark" }} />
        </div>
        <div>
          <div style={{ marginBottom: 7 }}><SC size={8.5}>Depart</SC></div>
          <input type="date" value={data.end} onChange={e => set({ ...data, end: e.target.value })}
            style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", color: data.end ? C.cream : C.stoneSoft, padding: "4px 0 10px", borderBottom: `0.5px solid ${C.border}`, colorScheme: "dark" }} />
        </div>
      </div>

      {/* Vibes — what's pulling at you */}
      <div style={{ marginBottom: 26 }}>
        <SC size={8.5}>What's pulling at you</SC>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 5, marginBottom: 12, lineHeight: 1.4 }}>
          Pick any that feel right. We'll shape suggestions around it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {VIBES.map(v => (
            <VibeChip key={v.id} vibe={v} active={vibes.includes(v.id)} onClick={() => toggleVibe(v.id)} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ marginBottom: 7 }}><SC size={8.5}>The shape of it (optional)</SC></div>
        <textarea rows={3} value={data.note} onChange={e => set({ ...data, note: e.target.value })}
          placeholder="A villa with three friends. Slow mornings, long dinners."
          style={{ fontFamily: F.body, fontSize: 16, color: C.cream, padding: "4px 0 10px", borderBottom: `0.5px solid ${C.border}`, lineHeight: 1.5, resize: "none", fontWeight: 300 }} />
      </div>
    </Shell>
  );
};

// ─── 4. COMPANIONS ──────────────────────────────────────────
const CompanionsStep = ({ data, set, next, back, stepIdx, total }) => {
  const [name, setName] = React.useState("");
  const add = () => {
    if (!name.trim()) return;
    set({ ...data, companions: [...data.companions, name.trim()] });
    setName("");
  };
  const remove = i => set({ ...data, companions: data.companions.filter((_, idx) => idx !== i) });

  return (
    <Shell stepIdx={stepIdx} total={total} onBack={back}
      onSkip={next}
      cta={next} ctaLabel={data.companions.length ? "Continue" : "Continue alone"}>
      <SC color={C.gold}>Step three</SC>
      <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.cream, marginTop: 8, marginBottom: 6, lineHeight: 1.1 }}>
        Who's coming?
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 300, color: C.creamSoft, marginBottom: 32, lineHeight: 1.5 }}>
        Add their first names. You can invite them properly later.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="A first name"
            style={{ fontFamily: F.display, fontSize: 20, fontStyle: "italic", color: C.cream, padding: "4px 0 10px", borderBottom: `0.5px solid ${C.border}` }} />
        </div>
        <button onClick={add} style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `0.5px solid ${C.goldMuted}`, background: "transparent",
          color: C.gold, fontSize: 18, cursor: "pointer", fontFamily: F.display, paddingBottom: 2,
        }}>+</button>
      </div>

      {data.companions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: C.border }}>
          {data.companions.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 4px", background: C.bg }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `0.5px solid ${C.goldMuted}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontSize: 11, color: C.gold }}>
                {c[0].toUpperCase()}
              </div>
              <span style={{ flex: 1, fontFamily: F.body, fontSize: 18, color: C.cream, fontWeight: 300 }}>{c}</span>
              <button onClick={() => remove(i)} style={{ background: "none", border: "none", color: C.stone, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {data.companions.length === 0 && (
        <p style={{ fontFamily: F.body, fontStyle: "italic", fontSize: 14, color: C.stoneSoft, fontWeight: 300, marginTop: 8 }}>
          — or skip and keep this one to yourself.
        </p>
      )}
    </Shell>
  );
};

// ─── 5. FORWARD ─ THE LOAD-BEARING SCREEN ───────────────────
const ForwardStep = ({ data, next, back, stepIdx, total, address }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Shell stepIdx={stepIdx} total={total} onBack={back} cta={next} ctaLabel="I'll do this later — finish">
      <SC color={C.gold}>Step four · the important one</SC>
      <h2 style={{ fontFamily: F.display, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.cream, marginTop: 8, marginBottom: 6, lineHeight: 1.1 }}>
        Forward your<br/>bookings here.
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 300, color: C.creamSoft, marginBottom: 28, lineHeight: 1.55 }}>
        The ledger fills itself. When a hotel confirms, a flight clears, a restaurant replies — forward it to this address. We'll read it and place it on the right day.
      </p>

      {/* The address card */}
      <div style={{
        position: "relative",
        border: `0.5px solid ${C.goldMuted}`, padding: "22px 20px 20px",
        background: `linear-gradient(180deg, #15130F 0%, #0F0E0C 100%)`,
        marginBottom: 22,
      }}>
        <div style={{ position: "absolute", top: -7, left: 16, padding: "0 8px", background: C.bg }}>
          <SC size={8} color={C.gold}>Your private inbox</SC>
        </div>
        <p style={{ fontFamily: F.mono, fontSize: 14, color: C.cream, letterSpacing: 0.3, marginTop: 4, marginBottom: 14, wordBreak: "break-all", lineHeight: 1.4 }}>
          {address}
        </p>
        <button onClick={copy} style={{
          width: "100%", padding: "10px",
          border: `0.5px solid ${copied ? C.sage : C.borderLight}`, background: "transparent",
          fontFamily: F.sans, fontSize: 9, letterSpacing: 3, textTransform: "uppercase",
          color: copied ? C.sage : C.creamSoft, cursor: "pointer",
          transition: "all 0.2s",
        }}>{copied ? "✓ Copied" : "Copy address"}</button>
      </div>

      {/* What we'll do with it */}
      <div style={{ marginBottom: 8 }}>
        <SC size={8.5} color={C.stone}>What we read</SC>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { tag: "Hotels", body: "Check-in date, suite, address. Goes to Day 1." },
            { tag: "Flights", body: "Times, terminal, seat. Slotted at arrival." },
            { tag: "Restaurants", body: "Time, party size. We'll ask which night." },
            { tag: "Cars & transfers", body: "Pickup, driver, plate. Linked to the leg before." },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
              <div style={{ width: 76, flexShrink: 0 }}>
                <SC size={8.5} color={C.gold}>{row.tag}</SC>
              </div>
              <p style={{ flex: 1, fontFamily: F.body, fontSize: 14.5, color: C.creamSoft, fontWeight: 300, lineHeight: 1.45 }}>{row.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22, padding: "14px 16px", background: C.bgSoft, border: `0.5px solid ${C.border}` }}>
        <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, fontStyle: "italic", lineHeight: 1.5 }}>
          Send anything to test — even an old confirmation from your inbox. We'll show you what we found before adding it.
        </p>
      </div>

      <div style={{ marginTop: 28, textAlign: "center" }}>
        <Btn primary={false} onClick={next} style={{ padding: "12px 20px" }}>Send a test email →</Btn>
      </div>
    </Shell>
  );
};

// ─── 6. READY ───────────────────────────────────────────────
const ReadyStep = ({ data, tripNumber = 1, next }) => {
  const fmt = (s) => {
    if (!s) return "—";
    const d = new Date(s + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const range = data.start && data.end ? `${fmt(data.start)} — ${fmt(data.end)}` : "Dates pending";
  return (
    <div className="fade" style={{ height: "100%", padding: "90px 30px 30px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.bg }}>
      <div style={{ textAlign: "center" }}>
        <Mono s={30} />
      </div>
      <div style={{ textAlign: "center" }}>
        <SC color={C.gold} style={{ display: "inline-block", marginBottom: 22 }}>The first page</SC>
        <h2 style={{ fontFamily: F.display, fontSize: 34, fontWeight: 400, fontStyle: "italic", color: C.cream, marginBottom: 18, lineHeight: 1.08 }}>
          Your ledger<br/>has begun.
        </h2>
        <div style={{ margin: "32px auto 0", maxWidth: 280, padding: "26px 22px", border: `0.5px solid ${C.borderLight}`, background: C.card }}>
          <SC size={8} color={C.gold}>Trip {String(tripNumber).padStart(2, "0")}</SC>
          <p style={{ fontFamily: F.display, fontSize: 22, fontStyle: "italic", color: C.cream, marginTop: 8, lineHeight: 1.15 }}>
            {data.where || "Your first trip"}
          </p>
          <p style={{ fontFamily: F.sans, fontSize: 10, color: C.stone, letterSpacing: 2, textTransform: "uppercase", marginTop: 8 }}>{range}</p>
          {data.vibes && data.vibes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginTop: 14 }}>
              {data.vibes.map(vid => {
                const v = (VIBES || []).find(x => x.id === vid);
                if (!v) return null;
                return (
                  <span key={vid} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 9px",
                    border: `0.5px solid ${v.color}55`,
                    fontFamily: F.sans, fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase",
                    color: C.creamSoft,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, display: "inline-block" }} />
                    {v.word}
                  </span>
                );
              })}
            </div>
          )}
          {data.companions.length > 0 && (
            <p style={{ fontFamily: F.body, fontStyle: "italic", fontSize: 14, color: C.creamSoft, marginTop: 14, fontWeight: 300 }}>
              with {data.companions.join(", ")}
            </p>
          )}
        </div>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.stone, fontWeight: 300, fontStyle: "italic", marginTop: 28, lineHeight: 1.5, maxWidth: 280, margin: "28px auto 0" }}>
          Forward your first booking when it arrives. We'll take it from there.
        </p>
      </div>
      <Btn full primary onClick={next}>Open the ledger</Btn>
    </div>
  );
};

return { C, F, Mono, SC, Btn, Field, Shell, Welcome, YouStep, TripStep, CompanionsStep, ForwardStep, ReadyStep, VIBES };
})();

window.MVP = MVP;
