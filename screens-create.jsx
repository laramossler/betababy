// ─── CREATE FLOW v2 — collaborative, consensus-first ─────
// spark → circle → her vibes/dream/dates → preview → send →
// live poll (guests respond) → consensus → destination reveal → lock
const { C, F, ME, CIRCLE, VIBES } = window.LEDGER;
const { Mono, Rule, SC, Tag, Ini, Btn, Imagery, Dot, Divider, PetTag } = window.ATOMS;
const { useState, useEffect, useRef } = React;

const SPARKS = [
  { id: "rest", word: "I need to disappear", sub: "A retreat — small, quiet, stunning", tone: C.dusk },
  { id: "milestone", word: "Someone's having a milestone", sub: "Birthday, anniversary, the big number", tone: C.blush },
  { id: "reunion", word: "It's been too long", sub: "The friends I keep meaning to gather", tone: C.gold },
  { id: "celebrate", word: "There's something to celebrate", sub: "A win, a chapter closed, a yes", tone: C.sage },
  { id: "explore", word: "Somewhere new", sub: "A place I've been thinking about", tone: C.sea },
  { id: "blank", word: "Just because", sub: "No reason. The best ones don't need one.", tone: C.cream },
];

const DATE_WINDOWS = [
  { id: "may1", label: "May 9 – 16", sub: "Late spring" },
  { id: "may2", label: "May 23 – 30", sub: "Bridge weekend" },
  { id: "jun1", label: "Jun 6 – 13", sub: "Early summer" },
  { id: "sep1", label: "Sept 12 – 19", sub: "Crowds gone" },
  { id: "sep2", label: "Sept 26 – Oct 3", sub: "Harvest light" },
  { id: "oct1", label: "Oct 10 – 17", sub: "Golden week" },
];

// ─── ROOT FLOW ───────────────────────────────────────────
function CreateFlow({ onClose, onLaunched }) {
  const [step, setStep] = useState(0);
  const [spark, setSpark] = useState(null);
  const [circle, setCircle] = useState([]);
  const [petIncluded, setPetIncluded] = useState(true);
  const [myVibes, setMyVibes] = useState([]);
  const [myDream, setMyDream] = useState("");
  const [myDates, setMyDates] = useState([]);
  const [destination, setDestination] = useState(null);

  const next = () => setStep(s => s + 1);
  const back = () => step > 0 ? setStep(s => s - 1) : onClose();

  const totalSteps = 8;

  // Compute the group consensus once — used by both Consensus + Destination steps
  const consensus = (() => {
    const allVibes = [...myVibes];
    const allDates = [...myDates];
    circle.forEach(id => {
      const s = GUEST_SCRIPTS[id];
      if (s) { allVibes.push(...s.vibes); allDates.push(...s.dates); }
    });
    const vibeTally = {}; allVibes.forEach(v => vibeTally[v] = (vibeTally[v] || 0) + 1);
    const dateTally = {}; allDates.forEach(d => dateTally[d] = (dateTally[d] || 0) + 1);
    const sortedVibes = Object.entries(vibeTally).sort((a, b) => b[1] - a[1]);
    const sortedDates = Object.entries(dateTally).sort((a, b) => b[1] - a[1]);
    return {
      sortedVibes, sortedDates,
      winningDateId: sortedDates[0]?.[0],
      total: circle.length + 1,
    };
  })();

  // Build the trip payload at lock time
  const lockTrip = () => {
    const dest = MATCHED_DESTINATIONS.find(d => d.id === destination);
    const winDate = DATE_WINDOWS.find(d => d.id === consensus.winningDateId);
    const topVibes = consensus.sortedVibes.slice(0, 2).map(([vid]) => VIBES.find(v => v.id === vid)?.word).filter(Boolean);
    const id = `${destination}-${Date.now().toString(36).slice(-4)}`;

    const payload = {
      id,
      title: dest.name,
      sub: dest.sub,
      dates: winDate ? `${winDate.label}, 2026` : "Dates TBC",
      cover: dest.grad.match(/#[A-F0-9]{6}/i)?.[0] || "#3A4A52",
      coverGrad: dest.grad,
      status: "active",
      role: "host",
      guests: ["chloe", ...circle],
      pets: petIncluded ? ["biscuit"] : [],
      note: `${topVibes.join(" & ")}. From the circle's consensus.`,
      progress: { booked: 0, ready: 1, pending: 8, none: 4 },
      // Empty events array — Margaux is drafting
      drafting: true,
      consensus: { vibes: topVibes, dream: "Margaux read the dreams: indulgent evenings, one earned sunrise, somewhere worth a silver dress." },
    };
    onLaunched(payload);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "56px 22px 14px", borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={back} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>
            {step === 0 ? "× Close" : "← Back"}
          </button>
          <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>
            {String(Math.min(step + 1, totalSteps)).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 1.5, background: i <= step ? C.gold : C.border, transition: "background 0.4s" }} />
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 22px 100px" }}>
        {step === 0 && <StepSpark spark={spark} setSpark={setSpark} next={next} />}
        {step === 1 && <StepCircle circle={circle} setCircle={setCircle} petIncluded={petIncluded} setPetIncluded={setPetIncluded} next={next} />}
        {step === 2 && <StepHerVibes myVibes={myVibes} setMyVibes={setMyVibes} myDream={myDream} setMyDream={setMyDream} next={next} />}
        {step === 3 && <StepHerDates myDates={myDates} setMyDates={setMyDates} next={next} />}
        {step === 4 && <StepInvitePreview spark={spark} circle={circle} petIncluded={petIncluded} myVibes={myVibes} next={next} />}
        {step === 5 && <StepLivePoll circle={circle} myVibes={myVibes} myDream={myDream} myDates={myDates} next={next} />}
        {step === 6 && <StepConsensus circle={circle} consensus={consensus} next={next} />}
        {step === 7 && <StepDestination destination={destination} setDestination={setDestination} circle={circle} petIncluded={petIncluded} consensus={consensus} onLock={lockTrip} />}
      </div>
    </div>
  );
}

// ── Step 0: Spark ───────────────────────────────────────
function StepSpark({ spark, setSpark, next }) {
  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>The Spark</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 28, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What's pulling at you?</h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
        Just the feeling. Destination, dates, and details come later — together.
      </p>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 5 }}>
        {SPARKS.map(s => {
          const on = spark === s.id;
          return (
            <button key={s.id} onClick={() => { setSpark(s.id); setTimeout(next, 360); }} style={{
              background: on ? `${s.tone}10` : C.card, border: `0.5px solid ${on ? s.tone : C.border}`,
              padding: "18px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ width: 4, height: 36, background: s.tone, opacity: on ? 1 : 0.4 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F.display, fontSize: 17, color: C.cream, fontStyle: "italic" }}>"{s.word}"</p>
                <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontWeight: 300, marginTop: 3 }}>{s.sub}</p>
              </div>
              {on && <Dot color={s.tone} s={6} glow />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 1: Circle ──────────────────────────────────────
function StepCircle({ circle, setCircle, petIncluded, setPetIncluded, next }) {
  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>The Circle</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>Who's coming?</h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
        Pick your people. They'll weigh in on vibe, dates, and what they're dreaming about — before anything is locked. {circle.length > 0 && <span style={{ color: C.gold }}>{circle.length} chosen.</span>}
      </p>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 5 }}>
        {CIRCLE.filter(g => !g.you).map(g => {
          const on = circle.includes(g.id);
          return (
            <button key={g.id} onClick={() => setCircle(c => on ? c.filter(x => x !== g.id) : [...c, g.id])} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
              background: on ? `${C.gold}10` : C.card, border: `0.5px solid ${on ? C.gold + "60" : C.border}`,
              cursor: "pointer", textAlign: "left", transition: "all 0.2s",
            }}>
              <Ini letter={g.initial} s={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: F.display, fontSize: 15, color: C.cream, fontWeight: 500 }}>{g.name}</p>
                <p style={{ fontFamily: F.sans, fontSize: 9.5, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>
                  {g.city}{g.role ? ` · ${g.role}` : ""}
                </p>
              </div>
              {on ? <Dot color={C.gold} s={7} glow /> : <span style={{ color: C.stone, fontSize: 18, fontWeight: 300 }}>+</span>}
            </button>
          );
        })}
        <button style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: `0.5px dashed ${C.border}`, background: "transparent", cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `0.5px dashed ${C.stone}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.stone, fontSize: 18 }}>+</div>
          <div>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.cream, fontStyle: "italic", fontWeight: 300 }}>Invite someone new</p>
            <p style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>WhatsApp · Contacts</p>
          </div>
        </button>
      </div>

      <div style={{ marginTop: 18, padding: "14px 14px", border: `0.5px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", gap: 12 }}>
        <PetTag s={32} />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: F.display, fontSize: 14, color: C.cream, fontWeight: 500 }}>Biscuit comes too?</p>
          <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontWeight: 300, fontStyle: "italic", marginTop: 2 }}>We'll filter destinations to pet-friendly ones.</p>
        </div>
        <button onClick={() => setPetIncluded(p => !p)} style={{
          width: 42, height: 24, borderRadius: 12, border: `0.5px solid ${petIncluded ? C.gold : C.border}`,
          background: petIncluded ? `${C.gold}30` : "transparent", position: "relative", cursor: "pointer", padding: 0,
        }}>
          <div style={{ position: "absolute", top: 2, left: petIncluded ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: petIncluded ? C.gold : C.stone, transition: "all 0.25s" }} />
        </button>
      </div>

      {circle.length > 0 && <Btn onClick={next} full style={{ marginTop: 22 }}>Continue with {circle.length}</Btn>}
    </div>
  );
}

// ── Step 2: Her vibes + dream ───────────────────────────
function StepHerVibes({ myVibes, setMyVibes, myDream, setMyDream, next }) {
  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>You first</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What are you<br/>drawn to?</h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
        Up to three. The girls answer the same questions — then we'll show you the overlap.
      </p>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 5 }}>
        {VIBES.map(v => {
          const on = myVibes.includes(v.id);
          return (
            <button key={v.id} onClick={() => setMyVibes(p => on ? p.filter(x => x !== v.id) : p.length < 3 ? [...p, v.id] : p)} style={{
              background: on ? `${v.color}0D` : C.card, border: `0.5px solid ${on ? v.color + "60" : C.border}`,
              padding: "16px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "baseline", gap: 14,
            }}>
              <span style={{ fontFamily: F.display, fontSize: 18, color: on ? v.color : C.cream, fontStyle: "italic", minWidth: 86 }}>{v.word}</span>
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontWeight: 300, lineHeight: 1.4, flex: 1 }}>{v.sub}</span>
              {on && <Dot color={v.color} s={5} />}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <SC size={8.5} color={C.stone} style={{ marginBottom: 8 }}>Your one wish for this trip <span style={{ color: C.stone, textTransform: "none", letterSpacing: 0 }}>(optional)</span></SC>
        <textarea value={myDream} onChange={e => setMyDream(e.target.value)} placeholder="One sunrise on the water. Or — a vineyard where the rosé tastes like the place. Or — somewhere I can wear the silver dress."
          style={{ width: "100%", background: C.card, border: `0.5px solid ${C.border}`, padding: "12px 14px", fontFamily: F.body, fontSize: 13.5, color: C.cream, outline: "none", fontWeight: 300, lineHeight: 1.5, resize: "none", height: 90, fontStyle: "italic" }} />
      </div>

      {myVibes.length > 0 && <Btn onClick={next} full style={{ marginTop: 20 }}>Continue</Btn>}
    </div>
  );
}

// ── Step 3: Her dates ───────────────────────────────────
function StepHerDates({ myDates, setMyDates, next }) {
  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>Your windows</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>When could you<br/>get away?</h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
        Pick every window that works. We'll cross-reference with the others. {myDates.length > 0 && <span style={{ color: C.gold }}>{myDates.length} selected.</span>}
      </p>
      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 5 }}>
        {DATE_WINDOWS.map(w => {
          const on = myDates.includes(w.id);
          return (
            <button key={w.id} onClick={() => setMyDates(d => on ? d.filter(x => x !== w.id) : [...d, w.id])} style={{
              background: on ? `${C.gold}10` : C.card, border: `0.5px solid ${on ? C.gold + "60" : C.border}`,
              padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14, transition: "all 0.2s",
            }}>
              <div style={{ width: 4, height: 28, background: on ? C.gold : C.border }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F.display, fontSize: 16, color: C.cream, fontStyle: "italic" }}>{w.label}</p>
                <p style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>{w.sub}</p>
              </div>
              {on && <Dot color={C.gold} s={6} glow />}
            </button>
          );
        })}
      </div>

      {myDates.length > 0 && <Btn onClick={next} full style={{ marginTop: 22 }}>Continue</Btn>}
    </div>
  );
}

// ── Step 4: Invitation preview ──────────────────────────
function StepInvitePreview({ spark, circle, petIncluded, myVibes, next }) {
  const sparkObj = SPARKS.find(s => s.id === spark);
  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>The Invitation</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What they receive</h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
        A poll, not a plan. Each girl picks her vibe, dream, and date windows — same as you just did.
      </p>

      {/* Editorial preview card */}
      <div style={{ marginTop: 22, border: `0.5px solid ${C.goldMuted}`, position: "relative", padding: "32px 22px", background: `linear-gradient(180deg, ${C.bgSoft} 0%, ${C.bg} 100%)`, textAlign: "center" }}>
        {[
          { t: 10, l: 10, bt: 1, bl: 1 }, { t: 10, r: 10, bt: 1, br: 1 },
          { b: 10, l: 10, bb: 1, bl: 1 }, { b: 10, r: 10, bb: 1, br: 1 },
        ].map((p, i) => (
          <div key={i} style={{
            position: "absolute", width: 16, height: 16,
            ...(p.t !== undefined && { top: p.t }), ...(p.b !== undefined && { bottom: p.b }),
            ...(p.l !== undefined && { left: p.l }), ...(p.r !== undefined && { right: p.r }),
            borderTop: p.bt ? `0.5px solid ${C.goldMuted}` : "none",
            borderBottom: p.bb ? `0.5px solid ${C.goldMuted}` : "none",
            borderLeft: p.bl ? `0.5px solid ${C.goldMuted}` : "none",
            borderRight: p.br ? `0.5px solid ${C.goldMuted}` : "none",
          }} />
        ))}
        <div style={{ display: "flex", justifyContent: "center" }}><Mono s={28} /></div>
        <SC style={{ marginTop: 16 }}>From Chloe</SC>
        <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 12, lineHeight: 1.2 }}>
          {sparkObj ? `"${sparkObj.word}"` : "A trip is forming."}
        </h2>
        <Rule w="40px" m="18px auto" />
        <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontWeight: 300, lineHeight: 1.7, fontStyle: "italic", padding: "0 8px" }}>
          Chloe's gathering {circle.length === 1 ? "one of her" : `${circle.length} of her`} favourite people. Nothing's locked. <br/>Tell her what you're craving — vibe, dream, the dates that work.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 16 }}>
          <Ini letter="C" s={20} />
          {circle.map(id => {
            const g = CIRCLE.find(c => c.id === id);
            return g ? <Ini key={id} letter={g.initial} s={20} /> : null;
          })}
          {petIncluded && <PetTag s={20} />}
        </div>
        <div style={{ marginTop: 22, display: "inline-block", padding: "10px 26px", background: C.gold }}>
          <span style={{ fontFamily: F.sans, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: C.bg }}>Tell her your craving</span>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, marginTop: 12, fontStyle: "italic" }}>90 seconds. No app. No login.</p>
      </div>

      <Btn onClick={next} full style={{ marginTop: 22 }}>Send to {circle.length} via WhatsApp</Btn>
    </div>
  );
}

// ── Step 5: Live poll (guests respond in real time) ────
const GUEST_SCRIPTS = {
  sophia: { vibes: ["indulge", "celebrate"], dates: ["sep1", "sep2"], dream: "Long candlelit dinners. The kind of night nobody photographs." },
  aria: { vibes: ["restore", "indulge"], dates: ["sep1", "may2"], dream: "Linen mornings. A vineyard where time goes liquid." },
  noor: { vibes: ["adventure", "explore"], dates: ["sep1", "oct1"], dream: "Open water. One sunrise we earned." },
  iris: { vibes: ["indulge", "celebrate"], dates: ["sep1", "sep2", "may2"], dream: "Somewhere I can wear the silver dress." },
  yuki: { vibes: ["restore", "explore"], dates: ["oct1", "may2"], dream: "Hidden corners. Light through old shutters." },
};

function StepLivePoll({ circle, myVibes, myDream, myDates, next }) {
  const guests = circle.map(id => CIRCLE.find(c => c.id === id)).filter(Boolean);
  const [phase, setPhase] = useState("sending"); // sending → live
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("live"), 1800);
    const stagger = [3200, 5400, 7800, 10200, 12500];
    const timers = guests.map((g, i) =>
      setTimeout(() => {
        setResponses(prev => ({ ...prev, [g.id]: { ...GUEST_SCRIPTS[g.id], received: true } }));
      }, stagger[i % stagger.length])
    );
    return () => { clearTimeout(t1); timers.forEach(clearTimeout); };
  }, []);

  const responded = Object.keys(responses).length;
  const allIn = responded === guests.length;

  if (phase === "sending") {
    return (
      <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
        <div style={{ position: "relative", width: 70, height: 70 }}>
          <Mono s={48} />
          <div style={{ position: "absolute", inset: -8, border: `0.5px solid ${C.gold}`, borderRadius: "50%", animation: "pulse 1.4s ease infinite" }} />
        </div>
        <SC style={{ marginTop: 28 }}>Polling the circle</SC>
        <p style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontStyle: "italic", marginTop: 10 }}>{guests.length} on WhatsApp</p>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.5s ease" }}>
      <SC>Live · The circle weighs in</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.15 }}>Watching it<br/>come together</h1>

      {/* Counter strip */}
      <div style={{ marginTop: 18, padding: "14px 14px", background: C.card, border: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontFamily: F.display, fontSize: 22, color: C.cream }}>
          {responded + 1}<span style={{ color: C.stone }}> / {guests.length + 1}</span> <span style={{ fontStyle: "italic", color: C.gold, fontSize: 16 }}>responded</span>
        </p>
        <div style={{ width: 56, height: 4, background: C.border }}>
          <div style={{ height: "100%", width: `${((responded + 1) / (guests.length + 1)) * 100}%`, background: C.gold, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
        </div>
      </div>

      {/* Chloe's own row first */}
      <div style={{ marginTop: 18 }}>
        <ResponseRow name="Chloe (you)" letter="C" vibes={myVibes} dream={myDream} dates={myDates} you />
        {guests.map(g => {
          const r = responses[g.id];
          return <ResponseRow key={g.id} name={g.name} letter={g.initial} city={g.city} vibes={r?.vibes} dream={r?.dream} dates={r?.dates} pending={!r} />;
        })}
      </div>

      {allIn && (
        <div style={{ animation: "rise 0.6s ease", marginTop: 14 }}>
          <Btn onClick={next} full>See the consensus</Btn>
        </div>
      )}
    </div>
  );
}

function ResponseRow({ name, letter, city, vibes, dream, dates, pending = false, you = false }) {
  return (
    <div style={{
      padding: "14px 14px", border: `0.5px solid ${pending ? C.border : C.gold + "30"}`,
      background: pending ? C.card : `${C.gold}05`, marginBottom: 6,
      transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      animation: pending ? "none" : "rise 0.6s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Ini letter={letter} s={32} color={pending ? C.stone : C.gold} />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: F.display, fontSize: 14, color: C.cream, fontWeight: 500 }}>{name}</p>
          <p style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.3, textTransform: "uppercase", marginTop: 2 }}>
            {you ? "You · went first" : (city || "")}
          </p>
        </div>
        {pending ? (
          <span style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic" }}>typing…</span>
        ) : (
          <Tag filled color={C.sage} size={8}>In</Tag>
        )}
      </div>
      {!pending && vibes && vibes.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
          <SC size={8} color={C.stone} style={{ marginBottom: 6 }}>Vibes</SC>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {vibes.map(vid => {
              const v = VIBES.find(x => x.id === vid);
              return v ? <Tag key={vid} color={v.color} size={8}>{v.word}</Tag> : null;
            })}
          </div>
          {dates && dates.length > 0 && (<>
            <SC size={8} color={C.stone} style={{ marginBottom: 6 }}>Available</SC>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {dates.map(did => {
                const d = DATE_WINDOWS.find(x => x.id === did);
                return d ? <Tag key={did} color={C.creamSoft} size={8}>{d.label}</Tag> : null;
              })}
            </div>
          </>)}
          {dream && (
            <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.cream, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300, marginTop: 4 }}>"{dream}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step 6: Consensus ───────────────────────────────────
function StepConsensus({ circle, consensus, next }) {
  const [phase, setPhase] = useState("computing");
  useEffect(() => {
    const t = setTimeout(() => setPhase("ready"), 1600);
    return () => clearTimeout(t);
  }, []);

  const { sortedVibes, sortedDates, total } = consensus;
  const winningDate = sortedDates[0];

  if (phase === "computing") {
    return (
      <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
        <div style={{ position: "relative", width: 70, height: 70 }}>
          <Mono s={48} />
          <div style={{ position: "absolute", inset: -8, border: `0.5px solid ${C.gold}`, borderRadius: "50%", animation: "pulse 1.4s ease infinite" }} />
        </div>
        <SC style={{ marginTop: 28 }}>Margaux is reading the room</SC>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", marginTop: 10, fontWeight: 300, padding: "0 30px" }}>
          Crossing every vibe, dream, and window for the overlap.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>Consensus</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What you all<br/>want, together</h1>

      {/* Shared vibes — bar chart */}
      <div style={{ marginTop: 22, padding: "16px 16px", background: C.card, border: `0.5px solid ${C.border}` }}>
        <SC size={8.5} color={C.stone} style={{ marginBottom: 14 }}>The shared mood</SC>
        {sortedVibes.slice(0, 5).map(([vid, count]) => {
          const v = VIBES.find(x => x.id === vid);
          if (!v) return null;
          const pct = (count / total) * 100;
          return (
            <div key={vid} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <p style={{ fontFamily: F.display, fontSize: 15, color: count >= total / 2 ? v.color : C.creamSoft, fontStyle: "italic" }}>{v.word}</p>
                <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>{count} of {total}</p>
              </div>
              <div style={{ height: 3, background: C.border, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: v.color, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared dates */}
      <div style={{ marginTop: 12, padding: "16px 16px", background: C.card, border: `0.5px solid ${C.border}` }}>
        <SC size={8.5} color={C.stone} style={{ marginBottom: 14 }}>Everyone's free</SC>
        {sortedDates.slice(0, 4).map(([did, count]) => {
          const d = DATE_WINDOWS.find(x => x.id === did);
          if (!d) return null;
          const winner = did === winningDate[0];
          return (
            <div key={did} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${C.border}` }}>
              <div>
                <p style={{ fontFamily: F.display, fontSize: 15, color: winner ? C.gold : C.creamSoft, fontStyle: "italic" }}>{d.label}</p>
                <p style={{ fontFamily: F.sans, fontSize: 8.5, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>{d.sub}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ fontFamily: F.mono, fontSize: 10, color: C.stone }}>{count}/{total}</p>
                {winner && <Tag filled color={C.gold} size={8}>Winner</Tag>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dream synthesis */}
      <div style={{ marginTop: 12, padding: "16px 16px", border: `0.5px solid ${C.gold}40`, background: `${C.gold}06`, borderLeft: `1.5px solid ${C.gold}` }}>
        <SC size={8.5} color={C.gold} style={{ marginBottom: 8 }}>Margaux read the dreams</SC>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.cream, fontStyle: "italic", lineHeight: 1.55, fontWeight: 300 }}>
          "Five women want indulgent evenings, one earned sunrise, and somewhere worth a silver dress. That's a coast in soft season — wine, water, long tables."
        </p>
      </div>

      <Btn onClick={next} full style={{ marginTop: 20 }}>Show me where this fits</Btn>
    </div>
  );
}

// ── Step 7: Destination reveal (matched to consensus) ──
const MATCHED_DESTINATIONS = [
  { id: "amalfi", name: "The Amalfi Coast", sub: "Praiano · Italy", grad: "linear-gradient(135deg, #1A2A3A 0%, #4A6A8A 60%, #EDE8DF 100%)", match: 96, why: "The terraces, the lemon light, the long evenings. Pet-friendly villa available. Sunrise sail bookable.", flags: ["Coast", "Wine", "Pet-cleared"] },
  { id: "menorca", name: "Menorca", sub: "Spain", grad: "linear-gradient(135deg, #2A3A52 0%, #6A8AA0 60%, #E8E0D0 100%)", match: 91, why: "Quieter than the rest. Hidden coves, white-stone fincas, a sunrise hike that earns the breakfast.", flags: ["Coast", "Quiet", "Pet-cleared"] },
  { id: "douro", name: "The Douro Valley", sub: "Portugal", grad: "linear-gradient(135deg, #2A2520 0%, #6A4F3A 50%, #C4A89A 100%)", match: 87, why: "Vineyard mornings, candlelit terraces. The river. Worth-the-dress dinners. Rare for crowds.", flags: ["Wine", "Quiet"] },
];

function StepDestination({ destination, setDestination, circle, petIncluded, consensus, onLock }) {
  const winDate = DATE_WINDOWS.find(d => d.id === consensus.winningDateId);
  const topVibes = consensus.sortedVibes.slice(0, 2).map(([vid]) => VIBES.find(v => v.id === vid)?.word).filter(Boolean);

  return (
    <div style={{ animation: "rise 0.6s ease" }}>
      <SC>Margaux's three</SC>
      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>Three places<br/>that fit you all</h1>
      <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
        Matched to <span style={{ color: C.gold }}>{topVibes.join(" + ")}</span>{winDate && <>, the window <span style={{ color: C.gold }}>{winDate.label}</span></>}{petIncluded ? ", and Biscuit" : ""}.
      </p>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8 }}>
        {MATCHED_DESTINATIONS.map(d => {
          const on = destination === d.id;
          return (
            <button key={d.id} onClick={() => setDestination(d.id)} style={{
              background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
              outline: on ? `0.5px solid ${C.gold}` : `0.5px solid ${C.border}`, transition: "outline 0.25s",
            }}>
              <div style={{ height: 110, background: d.grad, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,9,8,0.85) 100%)" }} />
                <div style={{ position: "absolute", top: 10, right: 10 }}>
                  <Tag filled color={C.gold} size={8}>{d.match}% match</Tag>
                </div>
                <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
                  <p style={{ fontFamily: F.display, fontSize: 18, color: C.cream, fontStyle: "italic" }}>{d.name}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 9, color: C.cream, opacity: 0.85, marginTop: 2 }}>{d.sub}</p>
                </div>
              </div>
              <div style={{ padding: "12px 12px 14px", background: on ? `${C.gold}06` : C.card }}>
                <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}>{d.why}</p>
                <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {d.flags.map(f => <Tag key={f} color={C.creamSoft} size={8}>{f}</Tag>)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {destination && (
        <div style={{ animation: "rise 0.5s ease", marginTop: 18 }}>
          <Btn onClick={onLock} full>Lock {MATCHED_DESTINATIONS.find(d => d.id === destination).name} · Begin</Btn>
          <Btn onClick={() => {}} primary={false} full style={{ marginTop: 8 }}>Send all three back for a vote</Btn>
        </div>
      )}
    </div>
  );
}

window.SCREENS_CREATE = { CreateFlow };
