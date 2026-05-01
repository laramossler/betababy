// ─── CREATE FLOW — spark → name → circle → vibes → invite → send → live ──
const { C, F, ME, CIRCLE, VIBES } = window.LEDGER;
const { Mono, Rule, SC, Tag, Ini, Btn, Imagery, Dot, Divider, PetTag } = window.ATOMS;
const { useState, useEffect, useRef } = React;

// ── Spark sparks (loose idea entry) ─────────────────────
const SPARKS = [
  { id: "rest", word: "I need to disappear", sub: "A retreat — small, quiet, stunning", tone: C.dusk },
  { id: "milestone", word: "Someone's having a milestone", sub: "Birthday, anniversary, the big number", tone: C.blush },
  { id: "reunion", word: "It's been too long", sub: "The friends I keep meaning to gather", tone: C.gold },
  { id: "celebrate", word: "There's something to celebrate", sub: "A win, a chapter closed, a yes", tone: C.sage },
  { id: "explore", word: "Somewhere new", sub: "A place I've been thinking about", tone: C.sea },
  { id: "blank", word: "Just because", sub: "No reason. The best ones don't need one.", tone: C.cream },
];

// ── Suggested destinations (post-spark) ─────────────────
const DESTINATIONS = [
  { id: "amalfi", name: "The Amalfi Coast", sub: "Italy · Sept – Oct", grad: "linear-gradient(135deg, #1A2A3A 0%, #4A6A8A 60%, #EDE8DF 100%)", note: "Cooled-down crowds. Boat days, terrace dinners.", match: 92 },
  { id: "marrakech", name: "Marrakech", sub: "Morocco · Oct – Nov", grad: "linear-gradient(135deg, #4A2A1A 0%, #B07050 70%, #EDD0A0 100%)", note: "Riad with private rooftop. Desert overnight option.", match: 88 },
  { id: "lisbon", name: "Lisbon & Comporta", sub: "Portugal · May – June", grad: "linear-gradient(135deg, #2A3A2A 0%, #6A8A6A 60%, #E0D8C0 100%)", note: "City + coast. Light, food, your kind of art scene.", match: 85 },
  { id: "kyoto", name: "Kyoto in autumn", sub: "Japan · Nov", grad: "linear-gradient(135deg, #2A1A20 0%, #8A4A4A 60%, #E0C8B8 100%)", note: "Maples turning. Ryokan, tea, the temples at dawn.", match: 81 },
];

function CreateFlow({ onClose, onLaunched }) {
  const [step, setStep] = useState(0);
  const [spark, setSpark] = useState(null);
  const [dest, setDest] = useState(null);
  const [tripName, setTripName] = useState("");
  const [tripSub, setTripSub] = useState("");
  const [dates, setDates] = useState("");
  const [circle, setCircle] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [petIncluded, setPetIncluded] = useState(true);
  const [note, setNote] = useState("");

  const next = () => setStep(s => s + 1);
  const back = () => step > 0 ? setStep(s => s - 1) : onClose();

  const totalSteps = 7;

  return (
    <div style={{ background: C.bg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top progress bar */}
      <div style={{ padding: "56px 22px 14px", borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button onClick={back} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>
            {step === 0 ? "× Close" : "← Back"}
          </button>
          <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>
            {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 1.5, background: i <= step ? C.gold : C.border, transition: "background 0.4s" }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "32px 22px 100px" }}>
        {/* Step 0 — Spark */}
        {step === 0 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>The Spark</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 28, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What's pulling at you?</h1>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
              No wrong answer. We start with the feeling — destinations, dates, and details follow.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 5 }}>
              {SPARKS.map(s => {
                const on = spark === s.id;
                return (
                  <button key={s.id} onClick={() => { setSpark(s.id); setTimeout(next, 360); }} style={{
                    background: on ? `${s.tone}10` : C.card, border: `0.5px solid ${on ? s.tone : C.border}`,
                    padding: "18px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.25s", display: "flex", alignItems: "center", gap: 14,
                  }}>
                    <div style={{ width: 4, height: 36, background: s.tone, opacity: on ? 1 : 0.4, transition: "opacity 0.3s" }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.display, fontSize: 17, color: C.cream, fontWeight: 400, fontStyle: "italic" }}>"{s.word}"</p>
                      <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontWeight: 300, marginTop: 3 }}>{s.sub}</p>
                    </div>
                    {on && <Dot color={s.tone} s={6} glow />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1 — Destination suggestions */}
        {step === 1 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>Margaux's suggestions</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>Four places<br/>that fit the feeling</h1>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
              Pick one, or write in your own. You can always change it later.
            </p>

            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8 }}>
              {DESTINATIONS.map(d => {
                const on = dest === d.id;
                return (
                  <button key={d.id} onClick={() => setDest(d.id)} style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
                    outline: on ? `0.5px solid ${C.gold}` : `0.5px solid ${C.border}`,
                    transition: "outline 0.25s",
                  }}>
                    <div style={{ height: 100, background: d.grad, position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,9,8,0.85) 100%)" }} />
                      <div style={{ position: "absolute", top: 10, right: 10 }}>
                        <Tag color={C.cream} size={8}>{d.match}% match</Tag>
                      </div>
                      <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
                        <p style={{ fontFamily: F.display, fontSize: 18, color: C.cream, fontWeight: 400, fontStyle: "italic" }}>{d.name}</p>
                        <p style={{ fontFamily: F.mono, fontSize: 9, color: C.cream, opacity: 0.85, marginTop: 2 }}>{d.sub}</p>
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px 12px", background: on ? `${C.gold}06` : C.card }}>
                      <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5 }}>{d.note}</p>
                    </div>
                  </button>
                );
              })}

              {/* Custom write-in */}
              <div style={{ marginTop: 4, padding: "14px 14px", border: `0.5px dashed ${C.border}`, background: C.bgSoft }}>
                <SC color={C.stone} size={8.5} style={{ marginBottom: 6 }}>Or write your own</SC>
                <input value={tripName} onChange={e => setTripName(e.target.value)} placeholder="Somewhere you've been thinking about..."
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `0.5px solid ${C.border}`, padding: "8px 0", fontFamily: F.body, fontSize: 14, color: C.cream, outline: "none", fontWeight: 300, fontStyle: "italic" }} />
              </div>
            </div>

            {(dest || tripName.length > 2) && (
              <Btn onClick={() => {
                if (dest) {
                  const d = DESTINATIONS.find(x => x.id === dest);
                  setTripName(d.name); setTripSub(d.sub);
                }
                next();
              }} full style={{ marginTop: 22 }}>Continue</Btn>
            )}
          </div>
        )}

        {/* Step 2 — Naming + dates */}
        {step === 2 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>The Title</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>Name it. Date it.</h1>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
              Editorial titles only. Your guests will see this.
            </p>

            <div style={{ marginTop: 26 }}>
              <SC size={8.5} color={C.stone} style={{ marginBottom: 8 }}>Title</SC>
              <input value={tripName} onChange={e => setTripName(e.target.value)} placeholder="The Amalfi Coast"
                style={{ width: "100%", background: C.card, border: `0.5px solid ${C.border}`, padding: "14px 16px", fontFamily: F.display, fontSize: 18, color: C.cream, outline: "none", fontStyle: "italic", fontWeight: 400 }} />
            </div>
            <div style={{ marginTop: 14 }}>
              <SC size={8.5} color={C.stone} style={{ marginBottom: 8 }}>Subtitle</SC>
              <input value={tripSub} onChange={e => setTripSub(e.target.value)} placeholder="Praiano · Sept 2026"
                style={{ width: "100%", background: C.card, border: `0.5px solid ${C.border}`, padding: "12px 16px", fontFamily: F.body, fontSize: 14, color: C.cream, outline: "none", fontWeight: 300 }} />
            </div>
            <div style={{ marginTop: 14 }}>
              <SC size={8.5} color={C.stone} style={{ marginBottom: 8 }}>Window</SC>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {["Sept 12–18", "Sept 15–21", "Sept 18–24", "I'm flexible"].map(d => (
                  <button key={d} onClick={() => setDates(d)} style={{
                    padding: "12px 12px", background: dates === d ? `${C.gold}10` : C.card,
                    border: `0.5px solid ${dates === d ? C.gold + "60" : C.border}`,
                    fontFamily: F.body, fontSize: 13, color: C.cream, fontWeight: 300, cursor: "pointer", transition: "all 0.2s",
                  }}>{d}</button>
                ))}
              </div>
            </div>

            {tripName.length > 2 && dates && (
              <Btn onClick={next} full style={{ marginTop: 24 }}>Continue</Btn>
            )}
          </div>
        )}

        {/* Step 3 — Circle */}
        {step === 3 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>The Circle</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>Who comes?</h1>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
              From your circle. Tap to add. {circle.length > 0 && <span style={{ color: C.gold }}>{circle.length} chosen.</span>}
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
                    {on ? <Dot color={C.gold} s={7} glow /> : <span style={{ color: C.stone, fontSize: 18, fontFamily: F.body, fontWeight: 300 }}>+</span>}
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
                <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontWeight: 300, fontStyle: "italic", marginTop: 2 }}>We'll handle papers, transit, and a vetted sitter.</p>
              </div>
              <button onClick={() => setPetIncluded(p => !p)} style={{
                width: 42, height: 24, borderRadius: 12, border: `0.5px solid ${petIncluded ? C.gold : C.border}`,
                background: petIncluded ? `${C.gold}30` : "transparent", position: "relative", cursor: "pointer", padding: 0, transition: "all 0.25s",
              }}>
                <div style={{ position: "absolute", top: 2, left: petIncluded ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: petIncluded ? C.gold : C.stone, transition: "all 0.25s" }} />
              </button>
            </div>

            {circle.length > 0 && (
              <Btn onClick={next} full style={{ marginTop: 22 }}>Continue with {circle.length}</Btn>
            )}
          </div>
        )}

        {/* Step 4 — Host's vibes */}
        {step === 4 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>Your Vibes</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What are you<br/>drawn to?</h1>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
              Up to three. We'll show your guests the same — then surface the consensus to you.
            </p>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 5 }}>
              {VIBES.map(v => {
                const on = vibes.includes(v.id);
                return (
                  <button key={v.id} onClick={() => setVibes(p => on ? p.filter(x => x !== v.id) : p.length < 3 ? [...p, v.id] : p)} style={{
                    background: on ? `${v.color}0D` : C.card, border: `0.5px solid ${on ? v.color + "60" : C.border}`,
                    padding: "16px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", display: "flex", alignItems: "baseline", gap: 14,
                  }}>
                    <span style={{ fontFamily: F.display, fontSize: 18, color: on ? v.color : C.cream, fontStyle: "italic", fontWeight: 400, minWidth: 86, transition: "color 0.2s" }}>{v.word}</span>
                    <span style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontWeight: 300, lineHeight: 1.4, flex: 1 }}>{v.sub}</span>
                    {on && <Dot color={v.color} s={5} />}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 18 }}>
              <SC size={8.5} color={C.stone} style={{ marginBottom: 8 }}>Anything you've been dreaming about? <span style={{ color: C.stone, textTransform: "none", letterSpacing: 0 }}>(optional)</span></SC>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="A hidden cove. The wine. That restaurant someone whispered about..."
                style={{ width: "100%", background: C.card, border: `0.5px solid ${C.border}`, padding: "12px 14px", fontFamily: F.body, fontSize: 13.5, color: C.cream, outline: "none", fontWeight: 300, lineHeight: 1.5, resize: "none", height: 80, fontStyle: "italic" }} />
            </div>

            {vibes.length > 0 && <Btn onClick={next} full style={{ marginTop: 20 }}>Continue</Btn>}
          </div>
        )}

        {/* Step 5 — Invitation preview */}
        {step === 5 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>The Invitation</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>What they'll receive</h1>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, marginTop: 10, lineHeight: 1.6 }}>
              Each guest gets a unique link via WhatsApp. Their name appears when they tap.
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
              <SC style={{ marginTop: 16 }}>You are invited</SC>
              <h2 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 12, lineHeight: 1.15 }}>{tripName || "Your trip"}</h2>
              <p style={{ fontFamily: F.body, fontSize: 13, color: C.creamSoft, marginTop: 6, fontWeight: 300 }}>{tripSub || dates}</p>
              <Rule w="40px" m="18px auto" />
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontWeight: 300, lineHeight: 1.7, fontStyle: "italic", padding: "0 8px" }}>
                Chloe is gathering {circle.length === 1 ? "one of her" : `${circle.length} of her`} favourite {circle.length === 1 ? "friend" : "people"} for {dates ? dates.toLowerCase().includes("flexible") ? "a few days" : "a week"  : "a few days"}.
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
                <span style={{ fontFamily: F.sans, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: C.bg }}>Begin</span>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                "No app download",
                "No login",
                "90 seconds to respond",
                "Beautiful in WhatsApp",
              ].map(f => (
                <span key={f} style={{ padding: "6px 10px", border: `0.5px solid ${C.border}`, fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.3, textTransform: "uppercase" }}>· {f}</span>
              ))}
            </div>

            <Btn onClick={next} full style={{ marginTop: 22 }}>Looks right — review send</Btn>
          </div>
        )}

        {/* Step 6 — Review & send */}
        {step === 6 && (
          <div style={{ animation: "rise 0.6s ease" }}>
            <SC>Final Review</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.2 }}>Send it?</h1>

            <div style={{ marginTop: 22, padding: "16px 16px", background: C.card, border: `0.5px solid ${C.border}` }}>
              <SC size={8.5} color={C.stone}>Trip</SC>
              <p style={{ fontFamily: F.display, fontSize: 18, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 4 }}>{tripName}</p>
              <p style={{ fontFamily: F.mono, fontSize: 10, color: C.stone, marginTop: 4 }}>{tripSub} · {dates}</p>
              <Divider />
              <SC size={8.5} color={C.stone}>Guests</SC>
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {circle.map(id => {
                  const g = CIRCLE.find(c => c.id === id);
                  return g ? <Tag key={id} color={C.creamSoft} size={9}>{g.name}</Tag> : null;
                })}
                {petIncluded && <Tag color={C.blush} size={9}>+ Biscuit</Tag>}
              </div>
              <Divider />
              <SC size={8.5} color={C.stone}>Your vibes</SC>
              <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {vibes.map(v => {
                  const vb = VIBES.find(x => x.id === v);
                  return vb ? <Tag key={v} color={vb.color} size={9}>{vb.word}</Tag> : null;
                })}
              </div>
              {note && <>
                <Divider />
                <SC size={8.5} color={C.stone}>Your dream</SC>
                <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", marginTop: 6, fontWeight: 300, lineHeight: 1.5 }}>"{note}"</p>
              </>}
            </div>

            <div style={{ marginTop: 14, padding: "12px 14px", border: `0.5px solid ${C.border}`, background: `${C.blush}05`, borderLeft: `1.5px solid ${C.blush}` }}>
              <SC size={8.5} color={C.blush}>Margaux</SC>
              <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", marginTop: 6, lineHeight: 1.55, fontWeight: 300 }}>
                "I'll start scoping villas the moment they reply. Biscuit's papers begin tomorrow."
              </p>
            </div>

            <Btn onClick={next} full style={{ marginTop: 20 }}>Send to {circle.length} via WhatsApp</Btn>
            <Btn onClick={back} primary={false} full style={{ marginTop: 8 }}>Edit</Btn>
          </div>
        )}
      </div>

      {/* Final step — sending animation + live tracker */}
      {step === 7 && (
        <SendAndTrack tripName={tripName} tripSub={tripSub} circle={circle} petIncluded={petIncluded} onLaunched={onLaunched} />
      )}
    </div>
  );
}

// ─── SEND ANIMATION + LIVE RESPONSE TRACKER ─────────────
function SendAndTrack({ tripName, tripSub, circle, petIncluded, onLaunched }) {
  const guests = circle.map(id => CIRCLE.find(c => c.id === id)).filter(Boolean);
  const [phase, setPhase] = useState("sending"); // sending → sent → live
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("sent"), 1800);
    const t2 = setTimeout(() => setPhase("live"), 3400);

    // Stream responses in over time
    const stagger = [4500, 6500, 9500, 12000];
    const rsvps = guests.map((g, i) => ({
      id: g.id,
      vibes: [["Indulge", "Celebrate"], ["Restore", "Adventure"], ["Indulge", "Explore"], ["Celebrate", "Escape"]][i % 4],
      wild: [
        "Sunrise from the water with just us four.",
        "A vineyard where the rosé tastes like the place.",
        "Somewhere I can wear the silver dress.",
        "I want one night nobody photographs.",
      ][i % 4],
      delay: stagger[i % 4],
    }));

    const timers = rsvps.map(r =>
      setTimeout(() => setResponses(prev => ({ ...prev, [r.id]: r })), r.delay)
    );
    return () => { clearTimeout(t1); clearTimeout(t2); timers.forEach(clearTimeout); };
  }, []);

  const responded = Object.keys(responses).length;
  const allIn = responded === guests.length;

  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, padding: "56px 22px 40px", display: "flex", flexDirection: "column" }}>
      {/* SENDING */}
      {phase === "sending" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ position: "relative", width: 70, height: 70 }}>
            <Mono s={48} />
            <div style={{ position: "absolute", inset: -8, border: `0.5px solid ${C.gold}`, borderRadius: "50%", animation: "pulse 1.4s ease infinite" }} />
          </div>
          <SC style={{ marginTop: 28 }}>Sending</SC>
          <p style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontStyle: "italic", marginTop: 10 }}>To {guests.length} on WhatsApp</p>
        </div>
      )}

      {/* SENT */}
      {phase === "sent" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: `0.5px solid ${C.sage}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: C.sage, fontSize: 24, fontFamily: F.body }}>✓</span>
          </div>
          <p style={{ fontFamily: F.display, fontSize: 26, color: C.cream, fontStyle: "italic", marginTop: 18 }}>Sent</p>
          <Rule w="40px" m="14px auto" />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {guests.map((g, i) => (
              <div key={g.id} style={{ animation: `fadeIn 0.4s ease ${i * 0.18}s both` }}>
                <Ini letter={g.initial} s={28} color={C.sage} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE */}
      {phase === "live" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "fadeIn 0.5s ease" }}>
          <SC>Live</SC>
          <h1 style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 8, lineHeight: 1.15 }}>{tripName}</h1>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontWeight: 300, marginTop: 6 }}>Watching responses arrive</p>

          <div style={{ marginTop: 18, padding: "14px 14px", background: C.card, border: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400 }}>
              {responded}<span style={{ color: C.stone }}> / {guests.length}</span> <span style={{ fontStyle: "italic", color: C.gold, fontSize: 16 }}>responded</span>
            </p>
            <div style={{ width: 56, height: 4, background: C.border, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, width: `${(responded / guests.length) * 100}%`, background: C.gold, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
            </div>
          </div>

          <div style={{ marginTop: 18, flex: 1, overflowY: "auto" }}>
            {guests.map(g => {
              const r = responses[g.id];
              return (
                <div key={g.id} style={{
                  padding: "14px 14px", border: `0.5px solid ${r ? C.gold + "30" : C.border}`,
                  background: r ? `${C.gold}05` : C.card, marginBottom: 6,
                  transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
                  animation: r ? "rise 0.6s ease" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Ini letter={g.initial} s={32} color={r ? C.gold : C.stone} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.display, fontSize: 14, color: C.cream, fontWeight: 500 }}>{g.name}</p>
                      <p style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.3, textTransform: "uppercase", marginTop: 2 }}>{g.city}</p>
                    </div>
                    {r ? (
                      <Tag filled color={C.sage} size={8}>In</Tag>
                    ) : (
                      <span style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic" }}>typing…</span>
                    )}
                  </div>
                  {r && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.border}` }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                        {r.vibes.map(v => <Tag key={v} color={C.gold} size={8}>{v}</Tag>)}
                      </div>
                      <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300 }}>"{r.wild}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allIn && (
            <div style={{ animation: "rise 0.6s ease", marginTop: 12 }}>
              <div style={{ padding: "14px 14px", border: `0.5px solid ${C.gold}40`, background: `${C.gold}08`, marginBottom: 12 }}>
                <SC>Consensus</SC>
                <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.cream, fontStyle: "italic", lineHeight: 1.6, marginTop: 6, fontWeight: 300 }}>
                  Everyone's in. Indulgent evenings, slow mornings, one big adventure on the water. Margaux is drafting the shape of the week.
                </p>
              </div>
              <Btn onClick={onLaunched} full>Open the Trip</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.SCREENS_CREATE = { CreateFlow };
