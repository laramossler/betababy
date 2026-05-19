// ─── WOVEN A · CALL + LETTER + SHORTLIST ─────────────────
// Movements 1 + 2 of the first sitting:
//   00 Cover  ·  10 Incoming  ·  11–14 CallBeat  ·  15 CallSignoff
//   20 LetterIntro  ·  21 Shortlist

const { C, F, ME } = window.LEDGER;
const { SC, Mono, Rule, Btn, Tag, Ini, Dot } = window.ATOMS;
const { MargauxAvatar, LaraAvatar, Waveform, useTypewriter, usePressHoldMic } = window.WOVEN_SHARED;
const { useState, useEffect, useRef } = React;

// ─── Call beats — concierge confirming an imminent trip ───
// Today is May 19; Rome is May 26–30. Lara has been planning for weeks,
// Margaux is locking the last unknowns before tonight.
const CALL_BEATS = [
  {
    id: "rome_when",
    line: "Chloe — Margaux. Rome's a week away. I've held the de Russie Tuesday through Saturday. Confirm the dates, or are we moving?",
    chips: ["tuesday–saturday is right", "shift by a day", "add a night", "let me check"],
    multi: false,
  },
  {
    id: "rome_who",
    line: "And who's in the room. Still you and Aria, or has Sophia confirmed?",
    chips: ["me and aria", "the four of us", "just me", "still moving"],
    multi: false,
  },
  {
    id: "rome_why",
    line: "One thing that has to happen — Roscioli at the counter, Aroma at sunset, a Borghese morning. Pick one so I don't lose it in the noise.",
    chips: ["roscioli, the counter", "aroma, sunset", "borghese, early", "you tell me"],
    multi: false,
  },
  {
    id: "year_tones",
    line: "Last. Three words for the trip itself. Don't think.",
    chips: ["still", "well-fed", "long lunches", "alone in galleries", "no schedule", "out of season"],
    multi: true,
    max: 3,
  },
];

// ─── The six picks (verbatim from README + invented Lara quotes) ─
const PICKS = [
  { id: "p1", name: "Roscioli Salumeria con Cucina", area: "Regola",                type: "Lunch · the headline",   defaultMeal: "lunch",     accent: C.gold,
    quote: "The carbonara everyone thinks they know. Sit at the counter and let them feed you. Lunch only — don't be polite about the time.",
    duration: "0:42" },
  { id: "p2", name: "Armando al Pantheon",           area: "Pantheon",              type: "Trattoria · Michelin",   defaultMeal: "dinner",    accent: C.blush,
    quote: "Three generations of one family in a room you have to book six weeks out. Order the cacio e pepe. Argue with the waiter about wine.",
    duration: "0:51" },
  { id: "p3", name: "Aroma — Palazzo Manfredi",       area: "Above the Colosseum",   type: "Fine dining · the photograph", defaultMeal: "dinner", accent: C.dusk,
    quote: "The terrace looks straight into the Colosseum. Wear something. Go for sunset. The risotto with sea urchin is what I always go back for.",
    duration: "0:38" },
  { id: "p4", name: "Pizzarium Bonci",                area: "Prati · near the Vatican", type: "Pizza al taglio · icon", defaultMeal: "lunch",   accent: C.sage,
    quote: "Bonci is what pizza was supposed to be. Slices by the gram. Eat standing up. Then walk to Castel Sant'Angelo and don't tell anyone.",
    duration: "0:29" },
  { id: "p5", name: "Pasticceria Boccione",           area: "Jewish Ghetto",         type: "Pasticceria · since 1815", defaultMeal: "morning", accent: C.goldDeep,
    quote: "No sign. No menu. They sell four things — buy the ricotta-and-cherry tart. The line moves. Don't dawdle.",
    duration: "0:24" },
  { id: "p6", name: "Otaleg",                         area: "Trastevere",            type: "Gelateria · artisan",    defaultMeal: "afternoon", accent: C.sea,
    quote: "The name is gelato spelled backwards. Tell them you want the three best flavours of the day — trust them. Eat by the river.",
    duration: "0:31" },
];

// ─── 00 · COVER ───────────────────────────────────────────
function Cover({ next }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1300);
    const t3 = setTimeout(() => setStage(3), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 30px 80px", textAlign: "center", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${C.gold}10 0%, transparent 60%)`, pointerEvents: "none" }} />
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
      <div style={{ opacity: stage >= 2 ? 1 : 0, transition: "opacity 0.9s ease 0.2s", marginTop: 40, maxWidth: 280 }}>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.7, fontWeight: 300 }}>
          Rome is in a week.<br/>Margaux is calling to lock the last things.
        </p>
      </div>
      <div style={{ position: "absolute", bottom: 80, left: 28, right: 28, opacity: stage >= 3 ? 1 : 0, transition: "opacity 0.8s ease" }}>
        <Btn full onClick={next}>I'm ready</Btn>
      </div>
    </div>
  );
}

// ─── 10 · INCOMING (iOS-style call screen) ────────────────
function Incoming({ accept, decline }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 28px 50px", position: "relative", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 40 }}>
        <Dot color={C.sage} s={6} glow />
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.sage, letterSpacing: 2.4, textTransform: "uppercase" }}>incoming call</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
        <div style={{ animation: "rise 0.6s ease" }}>
          <MargauxAvatar s={120} speaking={true} />
        </div>
        <h1 style={{ fontFamily: F.display, fontSize: 36, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 22 }}>
          Margaux
        </h1>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 4 }}>
          Paris desk · concierge
        </p>
        <p style={{ fontFamily: F.mono, fontSize: 10, color: C.stone, letterSpacing: 2, textTransform: "uppercase", marginTop: 16, animation: "pulse 1.8s ease-in-out infinite" }}>
          ringing…
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 30, gap: 32 }}>
        <button onClick={decline} style={{
          width: 64, height: 64, borderRadius: "50%", background: C.red, border: "none",
          color: C.cream, fontSize: 22, fontFamily: F.sans, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: "rotate(135deg)", lineHeight: 1, padding: 0,
        }}>
          ✕
        </button>
        <button onClick={accept} style={{
          width: 64, height: 64, borderRadius: "50%", background: C.sage, border: "none",
          color: C.bg, fontSize: 28, fontFamily: F.sans, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1, padding: 0,
          boxShadow: `0 0 0 6px ${C.sage}22, 0 0 0 14px ${C.sage}10`,
        }}>
          ✓
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10, gap: 32 }}>
        <span style={{ flex: 1, fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>decline</span>
        <span style={{ flex: 1, fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>accept</span>
      </div>
    </div>
  );
}

// ─── 10b · DECLINED ───────────────────────────────────────
function Declined({ retry }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 30px", textAlign: "center" }}>
      <MargauxAvatar s={80} />
      <p style={{ fontFamily: F.body, fontSize: 14, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 18 }}>
        She'll try again tomorrow morning.
      </p>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 8, lineHeight: 1.65, maxWidth: 280 }}>
        Or call her back now — five minutes, then she has what she needs.
      </p>
      <div style={{ marginTop: 28 }}>
        <Btn onClick={retry}>Answer now</Btn>
      </div>
    </div>
  );
}

// ─── 11–14 · CALL BEAT ────────────────────────────────────
function CallBeat({ beatIdx, beat, capture, onComplete }) {
  const [picked, setPicked] = useState(capture?.chips || []);
  const [voice, setVoice] = useState(capture?.voice || null);
  const [advancing, setAdvancing] = useState(false);
  const { out, done } = useTypewriter(beat.line, 22);
  const { start, stop, recording, heldMs, unavailable } = usePressHoldMic({
    minHoldMs: 400,
    onCapture: ({ durationMs }) => setVoice((durationMs / 1000).toFixed(1)),
  });

  const advance = (chips) => {
    if (advancing) return;
    setAdvancing(true);
    onComplete({ chips: chips || picked, voice });
  };

  const tapChip = (c) => {
    if (!done || advancing) return;
    if (beat.multi) {
      const has = picked.includes(c);
      if (has) setPicked(picked.filter(x => x !== c));
      else if (picked.length < (beat.max || 3)) setPicked([...picked, c]);
    } else {
      setPicked([c]);
      setAdvancing(true); // lock immediately to prevent double-tap
      setTimeout(() => advance([c]), 600);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 26px 40px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Dot color={C.sage} s={5} glow />
        <span style={{ fontFamily: F.mono, fontSize: 9, color: C.sage, letterSpacing: 2, textTransform: "uppercase" }}>connected</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>
          {String(beatIdx + 1).padStart(2, "0")} / 04
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <MargauxAvatar s={44} speaking={!done} />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: F.display, fontSize: 13, color: C.blush, fontStyle: "italic" }}>Margaux</p>
          <p style={{ fontFamily: F.mono, fontSize: 8.5, color: C.stone, letterSpacing: 1.4, marginTop: 2 }}>
            {done ? "QUIET" : "SPEAKING"}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Waveform active={!done} color={C.blush} h={28} />
      </div>

      <div style={{ minHeight: 110, padding: "16px 16px", border: `0.5px solid ${C.border}`, background: `${C.blush}05`, borderLeft: `1.5px solid ${C.blush}`, animation: "rise 0.5s ease" }}>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.cream, fontStyle: "italic", lineHeight: 1.55, fontWeight: 300 }}>
          {out}{!done && <span style={{ animation: "pulse 0.8s ease infinite", color: C.blush }}>▍</span>}
        </p>
      </div>

      {done && (
        <div style={{ marginTop: 20, animation: "fadeIn 0.5s ease" }}>
          <SC color={C.stone} size={8} style={{ marginBottom: 10 }}>
            {beat.multi ? `Tap up to ${beat.max || 3} — or hold the mic` : "Tap a reply — or hold the mic"}
          </SC>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {beat.chips.map(c => {
              const on = picked.includes(c);
              return (
                <button key={c} onClick={() => tapChip(c)} style={{
                  padding: "8px 13px",
                  background: on ? `${C.gold}18` : "transparent",
                  border: `0.5px solid ${on ? C.gold : C.borderLight}`,
                  color: on ? C.gold : C.creamSoft,
                  fontFamily: F.body, fontSize: 14, fontStyle: "italic", fontWeight: 300,
                  cursor: "pointer",
                }}>{c}</button>
              );
            })}
          </div>

          {/* Mic + counter */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
            <button
              onMouseDown={start} onMouseUp={stop} onMouseLeave={recording ? stop : undefined}
              onTouchStart={(e) => { e.preventDefault(); start(); }}
              onTouchEnd={(e) => { e.preventDefault(); stop(); }}
              style={{
                width: 54, height: 54, borderRadius: "50%",
                background: recording ? C.gold : "transparent",
                border: `0.5px solid ${C.gold}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, padding: 0,
                boxShadow: recording ? `0 0 0 8px ${C.gold}22, 0 0 0 16px ${C.gold}11, 0 0 0 28px ${C.gold}08` : "none",
                transition: "box-shadow 0.2s",
              }}
            >
              <span style={{ color: recording ? C.bg : C.gold, fontFamily: F.mono, fontSize: 16 }}>●</span>
            </button>
            <div style={{ flex: 1 }}>
              {recording ? (
                <p style={{ fontFamily: F.mono, fontSize: 11.5, color: C.gold, letterSpacing: 1.4 }}>
                  REC · {(heldMs / 1000).toFixed(2)}s
                </p>
              ) : voice ? (
                <p style={{ fontFamily: F.mono, fontSize: 10, color: C.creamSoft, letterSpacing: 1.2 }}>
                  CAPTURED · {voice}s
                </p>
              ) : (
                <p style={{ fontFamily: F.mono, fontSize: 9.5, color: C.stone, letterSpacing: 1.2 }}>
                  {unavailable ? "MIC UNAVAILABLE · TAP A CHIP" : "HOLD TO REPLY IN VOICE"}
                </p>
              )}
            </div>
            {beat.multi && (
              <Btn primary={picked.length > 0} onClick={() => advance()} style={{ opacity: picked.length > 0 ? 1 : 0.45 }}>
                Continue
              </Btn>
            )}
            {!beat.multi && voice && (
              <Btn onClick={() => advance()}>Continue</Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 15 · CALL SIGNOFF ────────────────────────────────────
function CallSignoff({ onLetter }) {
  const [stage, setStage] = useState(0);
  const { out, done } = useTypewriter("Good. That's what I needed. Lara wants a last word before I lock — let me bring her in.", 22);
  useEffect(() => {
    if (!done) return;
    const a = setTimeout(() => setStage(1), 700);
    return () => clearTimeout(a);
  }, [done]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 26px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Dot color={done ? C.stone : C.sage} s={5} glow={!done} />
        <span style={{ fontFamily: F.mono, fontSize: 9, color: done ? C.stone : C.sage, letterSpacing: 2, textTransform: "uppercase" }}>
          {done ? "call ended" : "wrapping up"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <MargauxAvatar s={44} speaking={!done} />
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: F.display, fontSize: 13, color: C.blush, fontStyle: "italic" }}>Margaux</p>
        </div>
      </div>

      <Waveform active={!done} color={C.blush} h={28} />

      <div style={{ marginTop: 16, padding: "16px 16px", border: `0.5px solid ${C.border}`, background: `${C.blush}05`, borderLeft: `1.5px solid ${C.blush}` }}>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.cream, fontStyle: "italic", lineHeight: 1.55, fontWeight: 300 }}>
          {out}{!done && <span style={{ animation: "pulse 0.8s ease infinite", color: C.blush }}>▍</span>}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      {stage >= 1 && (
        <div style={{ animation: "rise 0.6s ease", padding: "14px 14px", background: C.card, border: `0.5px solid ${C.gold}`, borderLeft: `1.5px solid ${C.gold}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <LaraAvatar s={32} />
            <div>
              <SC color={C.gold} size={8}>Lara · via Margaux</SC>
              <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 2 }}>
                A last look at the six. Confirm before Margaux locks.
              </p>
            </div>
          </div>
          <Btn full onClick={onLetter}>Read her letter</Btn>
        </div>
      )}
    </div>
  );
}

// ─── 20 · LETTER INTRO ────────────────────────────────────
function LetterIntro({ onShortlist }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 28px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <LaraAvatar s={40} />
        <div>
          <p style={{ fontFamily: F.display, fontSize: 15, color: C.gold, fontStyle: "italic" }}>Lara</p>
          <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 2 }}>
            founder
          </p>
        </div>
      </div>

      <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, marginBottom: 18 }}>
        Chloe —
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F.body, fontSize: 15.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.7 }}>
        <p>You've seen these. I want them on paper before Margaux locks tonight.</p>
        <p>Six places from the notebook. Tables held since last week. Tell her what stays — flip anything that lost its pull.</p>
        <p>And if any of them feel wrong now, we cut without ceremony.</p>
      </div>

      <p style={{ fontFamily: F.display, fontSize: 22, color: C.gold, fontStyle: "italic", marginTop: 24 }}>
        — L.
      </p>

      <div style={{ flex: 1 }} />

      <Btn full onClick={onShortlist}>Confirm the six</Btn>
    </div>
  );
}

// ─── 21 · SHORTLIST ───────────────────────────────────────
function Shortlist({ verdicts, setVerdicts, onPlanner }) {
  const reviewed = PICKS.filter(p => verdicts[p.id]).length;
  const setOne = (id, v) => setVerdicts({ ...verdicts, [id]: verdicts[id] === v ? undefined : v });
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "70px 22px 30px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <SC color={C.gold} size={9}>Lara's six · held</SC>
        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.stone, letterSpacing: 1 }}>
          {String(reviewed).padStart(2, "0")} / 06
        </span>
      </div>
      <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.15, marginBottom: 18 }}>
        Confirm. Flip what changed.
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PICKS.map((p) => {
          const v = verdicts[p.id];
          const dim = v === "skip";
          return (
            <div key={p.id} style={{
              padding: "14px 14px",
              background: v === "keep" ? `${p.accent}10` : v === "more" ? `${C.gold}08` : C.card,
              border: `0.5px solid ${v === "keep" ? p.accent : v === "more" ? C.gold : C.border}`,
              borderLeft: v === "skip" ? `0.5px solid ${C.border}` : `1.5px solid ${v === "more" ? C.gold : p.accent}`,
              opacity: dim ? 0.5 : 1,
              transition: "all 0.2s ease",
              position: "relative",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: F.mono, fontSize: 9, color: p.accent, letterSpacing: 1.2, textTransform: "uppercase" }}>{p.type}</span>
                <span style={{ fontFamily: F.mono, fontSize: 8.5, color: C.stone, letterSpacing: 1 }}>{p.area}</span>
              </div>
              <p style={{ fontFamily: F.display, fontSize: 17, color: C.cream, fontWeight: 500, fontStyle: "italic", marginBottom: 8 }}>{p.name}</p>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: `${C.bg}80`, border: `0.5px solid ${C.border}`, marginBottom: 10 }}>
                <span style={{ fontFamily: F.mono, fontSize: 12, color: p.accent, lineHeight: 1, marginTop: 1 }}>▶</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300 }}>{p.quote}</p>
                  <p style={{ fontFamily: F.mono, fontSize: 8.5, color: C.stone, letterSpacing: 0.8, marginTop: 4 }}>L. · {p.duration}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                {[
                  { id: "keep", label: "Keep",  color: p.accent },
                  { id: "more", label: "More like it", color: C.gold },
                  { id: "skip", label: "Skip",  color: C.stone },
                ].map(b => {
                  const on = v === b.id;
                  return (
                    <button key={b.id} onClick={() => setOne(p.id, b.id)} style={{
                      padding: "7px 4px",
                      background: on ? `${b.color}20` : "transparent",
                      border: `0.5px solid ${on ? b.color : C.border}`,
                      color: on ? b.color : C.creamSoft,
                      fontFamily: F.sans, fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase",
                      cursor: "pointer",
                    }}>
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 22 }}>
        <Btn full onClick={onPlanner}>
          Lock the six · review the days
        </Btn>
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 10, textAlign: "center" }}>
          All six are kept by default. Flip any to skip — Margaux moves around it.
        </p>
      </div>
    </div>
  );
}

window.WOVEN_A = { Cover, Incoming, Declined, CallBeat, CallSignoff, LetterIntro, Shortlist, PICKS, CALL_BEATS };
