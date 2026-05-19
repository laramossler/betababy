// ─── WOVEN B · DAY PLANNER + DRAFTED ─────────────────────
// Movement 3: take verdicts + overrides → day-by-day plan with map view.

const { C, F } = window.LEDGER;
const { SC, Btn, Tag, Dot } = window.ATOMS;
const { PICKS } = window.WOVEN_A;
const { RomeMap } = window.WOVEN_SHARED;
const { useState, useMemo } = React;

// ─── Constants ────────────────────────────────────────────
// README: placeholder dates — Jul 13–17.
const DAYS = [
  { idx: 0, weekday: "Mon", date: "Jul 13", color: C.blush },
  { idx: 1, weekday: "Tue", date: "Jul 14", color: C.gold },
  { idx: 2, weekday: "Wed", date: "Jul 15", color: C.sage },
  { idx: 3, weekday: "Thu", date: "Jul 16", color: C.dusk },
  { idx: 4, weekday: "Fri", date: "Jul 17", color: C.sea },
];

const SLOTS = [
  { id: "morning",   label: "Morning",   time: "08:30 – 11:00", glyph: "◐" },
  { id: "lunch",     label: "Lunch",     time: "13:00 – 15:30", glyph: "●" },
  { id: "afternoon", label: "Afternoon", time: "16:00 – 18:30", glyph: "◓" },
  { id: "dinner",    label: "Dinner",    time: "20:30 – 23:00", glyph: "○" },
];

// Notebook suggestions — drawn from Lara's larger Rome list (12 more places,
// grouped by slot type). Coordinates are stylized — placed against the
// abstract RomeMap canvas (320 × 280).
const NOTEBOOK_SUGGESTIONS = {
  morning: [
    { id: "n1", name: "Caffè Sant'Eustachio",     area: "Pantheon",        note: "The granita di caffè with cream — don't skip the cream.", x: 168, y: 132 },
    { id: "n2", name: "Forno Campo de' Fiori",     area: "Campo de' Fiori", note: "Pizza bianca by the slab. Eat it walking.",                x: 142, y: 156 },
    { id: "n3", name: "Marigold",                  area: "Ostiense",        note: "Danish pastry meets Roman patience. Get the cardamom bun.", x: 188, y: 232 },
  ],
  lunch: [
    { id: "n4", name: "Salumeria Roscioli (bar)",  area: "Regola",          note: "The negroni cart at 13:30. Standing only.",                x: 138, y: 152 },
    { id: "n5", name: "Pianostrada",               area: "Trastevere",      note: "Two sisters, one wood oven, the focaccia is the menu.",    x: 122, y: 188 },
    { id: "n6", name: "Da Enzo al 29",             area: "Trastevere",      note: "Twelve tables. Cash. Wait. Order the tonnarelli.",         x: 126, y: 202 },
  ],
  afternoon: [
    { id: "n7", name: "Villa Borghese · gardens",  area: "Pinciano",        note: "Walk it slowly. The Bernini is the point but the trees are the gift.", x: 218, y: 76 },
    { id: "n8", name: "Galleria Doria Pamphilj",   area: "Centro",          note: "Audio guide by the prince himself. The Velázquez is upstairs.",         x: 184, y: 124 },
    { id: "n9", name: "Antica Caciara Trasteverina", area: "Trastevere",    note: "Cheese for tonight. He'll vacuum-pack if you ask.",         x: 114, y: 196 },
  ],
  dinner: [
    { id: "n10", name: "Pierluigi",                area: "Campo de' Fiori", note: "Outside, in summer. The raw bar. Order the lobster pasta.",x: 146, y: 148 },
    { id: "n11", name: "Salumeria Roscioli (cena)", area: "Regola",         note: "Same room, after 20:30. Different menu, deeper wines.",     x: 138, y: 152 },
    { id: "n12", name: "Trattoria da Cesare",      area: "Monteverde",      note: "Off the tourist line. Quiet enough to hear yourself.",     x:  82, y: 218 },
  ],
};

// Default x/y for picks (so map has positions). Approximate by area.
const PICK_POSITIONS = {
  p1: { x: 138, y: 152 }, // Regola
  p2: { x: 168, y: 132 }, // Pantheon
  p3: { x: 232, y: 168 }, // above Colosseum
  p4: { x:  84, y: 100 }, // Prati
  p5: { x: 158, y: 168 }, // Jewish Ghetto
  p6: { x: 118, y: 198 }, // Trastevere
};

// ─── Plan computation ─────────────────────────────────────
// Round-robin keeps + mores onto their defaultMeal across days.
// Empty slots filled from NOTEBOOK_SUGGESTIONS round-robin.
function planFromVerdicts(verdicts) {
  const buckets = { morning: [], lunch: [], afternoon: [], dinner: [] };
  for (const pick of PICKS) {
    const v = verdicts[pick.id];
    if (v === "keep" || v === "more") {
      buckets[pick.defaultMeal].push({
        kind: "pick", pickId: pick.id, id: pick.id,
        name: pick.name, area: pick.area, type: pick.type, accent: pick.accent,
        verdict: v, x: PICK_POSITIONS[pick.id]?.x || 160, y: PICK_POSITIONS[pick.id]?.y || 140,
      });
    }
  }
  // Auto-place onto days
  const plan = {};
  for (const slot of SLOTS) {
    const arr = buckets[slot.id];
    let suggIdx = 0;
    const sugg = NOTEBOOK_SUGGESTIONS[slot.id] || [];
    for (let d = 0; d < DAYS.length; d++) {
      const key = `${d}-${slot.id}`;
      const pick = arr[d];
      if (pick) {
        plan[key] = pick;
      } else if (sugg.length) {
        const s = sugg[suggIdx % sugg.length];
        suggIdx += 1;
        plan[key] = {
          kind: "suggestion", suggId: s.id, id: s.id,
          name: s.name, area: s.area, note: s.note, accent: C.stone,
          x: s.x, y: s.y,
        };
      } else {
        plan[key] = null;
      }
    }
  }
  return plan;
}

// Pick a different suggestion for a slot (cycle through pool)
function nextSuggestion(slotId, currentSuggId) {
  const pool = NOTEBOOK_SUGGESTIONS[slotId] || [];
  if (!pool.length) return null;
  const idx = pool.findIndex(s => s.id === currentSuggId);
  const next = pool[(idx + 1) % pool.length];
  return { kind: "suggestion", suggId: next.id, id: next.id, name: next.name, area: next.area, note: next.note, accent: C.stone, x: next.x, y: next.y };
}

// ─── Day strip ────────────────────────────────────────────
function DayStrip({ active, setActive, getEntries }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 4px", overflowX: "auto" }}>
      {DAYS.map(d => {
        const entries = getEntries(d.idx);
        const filled = SLOTS.map(s => entries[`${d.idx}-${s.id}`]?.kind === "pick");
        const on = active === d.idx;
        return (
          <button key={d.idx} onClick={() => setActive(d.idx)} style={{
            flex: "0 0 auto",
            width: 64, padding: "10px 8px",
            background: on ? `${d.color}10` : C.card,
            border: `0.5px solid ${on ? d.color : C.border}`,
            borderLeft: on ? `1.5px solid ${d.color}` : `0.5px solid ${C.border}`,
            cursor: "pointer", textAlign: "left",
          }}>
            <p style={{ fontFamily: F.mono, fontSize: 9, color: on ? d.color : C.stone, letterSpacing: 1.2, textTransform: "uppercase" }}>{d.weekday}</p>
            <p style={{ fontFamily: F.display, fontSize: 15, color: on ? C.cream : C.creamSoft, fontStyle: "italic", fontWeight: 400, marginTop: 2 }}>{d.date}</p>
            <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
              {filled.map((f, i) => (
                <span key={i} style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: f ? d.color : "transparent",
                  border: `0.5px solid ${f ? d.color : C.stone}80`,
                }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Slot card ────────────────────────────────────────────
function SlotCard({ slot, entry, onOpen, dayColor }) {
  if (!entry) {
    return (
      <button onClick={() => onOpen({ free: true })} style={{
        width: "100%", textAlign: "left", padding: "12px 14px",
        background: "transparent", border: `0.5px dashed ${C.borderLight}`,
        cursor: "pointer", color: C.stone,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: C.stone, letterSpacing: 1 }}>{slot.glyph}</span>
          <SC color={C.stone} size={8.5}>{slot.label} · free</SC>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 6, paddingLeft: 21 }}>
          Kept free — nothing yet.
        </p>
      </button>
    );
  }

  const isPick = entry.kind === "pick";
  return (
    <button onClick={onOpen} style={{
      width: "100%", textAlign: "left", padding: "12px 14px",
      background: isPick ? `${entry.accent}10` : C.card,
      border: isPick ? `0.5px solid ${entry.accent}80` : `0.5px dashed ${C.borderLight}`,
      borderLeft: isPick ? `1.5px solid ${entry.accent}` : `0.5px dashed ${C.borderLight}`,
      cursor: "pointer", position: "relative",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: isPick ? entry.accent : C.stone, letterSpacing: 1 }}>{slot.glyph}</span>
        <SC color={isPick ? entry.accent : C.stone} size={8.5}>
          {slot.label} · {slot.time}
        </SC>
        <span style={{ flex: 1 }} />
        <Tag color={isPick ? entry.accent : C.stone} size={7.5}>{isPick ? "YOURS" : "Margaux suggests"}</Tag>
      </div>
      <p style={{ fontFamily: F.display, fontSize: 16, color: C.cream, fontStyle: "italic", fontWeight: 500, marginTop: 6, paddingLeft: 21 }}>{entry.name}</p>
      <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1, textTransform: "uppercase", marginTop: 2, paddingLeft: 21 }}>{entry.area}</p>
      {!isPick && entry.note && (
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 6, paddingLeft: 21, lineHeight: 1.5 }}>
          "{entry.note}"
        </p>
      )}
      {isPick && (
        <p style={{ fontFamily: F.mono, fontSize: 9, color: dayColor, letterSpacing: 1, textTransform: "uppercase", marginTop: 6, paddingLeft: 21 }}>
          Margaux holding · midnight Rome time tonight
        </p>
      )}
    </button>
  );
}

// ─── Slot bottom sheet ────────────────────────────────────
function SlotSheet({ open, slot, entry, dayIdx, onClose, onSwap, onRemove, onKeep, onPromote }) {
  if (!open) return null;
  const pick = entry && entry.kind === "pick" ? PICKS.find(p => p.id === entry.pickId) : null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 150, animation: "fadeIn 0.25s ease" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        background: C.bgSoft, borderTop: `0.5px solid ${C.border}`,
        padding: "18px 22px 30px", maxHeight: "75%", overflowY: "auto",
        animation: "rise 0.35s ease",
      }}>
        <div style={{ width: 32, height: 3, background: C.border, margin: "0 auto 14px", borderRadius: 2 }} />

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <SC color={entry?.accent || C.stone} size={8.5}>
            {slot.label} · {slot.time}
          </SC>
          <span style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>{DAYS[dayIdx]?.date}</span>
        </div>

        {!entry ? (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.6 }}>
              This slot is free. Margaux can suggest something from Lara's notebook, or leave it open for you.
            </p>
            <div style={{ marginTop: 16 }}>
              <Btn full onClick={onSwap}>Suggest something</Btn>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontStyle: "italic", fontWeight: 500 }}>{entry.name}</p>
            <p style={{ fontFamily: F.mono, fontSize: 10, color: C.stone, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{entry.area}</p>

            {pick && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: C.card, border: `0.5px solid ${C.border}`, borderLeft: `1.5px solid ${pick.accent}` }}>
                <SC color={pick.accent} size={8}>From Lara</SC>
                <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 6, lineHeight: 1.55 }}>
                  "{pick.quote}"
                </p>
                <p style={{ fontFamily: F.mono, fontSize: 8.5, color: C.stone, letterSpacing: 1, marginTop: 6 }}>L. · {pick.duration}</p>
              </div>
            )}

            {!pick && entry.note && (
              <div style={{ marginTop: 14, padding: "12px 14px", background: C.card, border: `0.5px solid ${C.border}` }}>
                <SC color={C.stone} size={8}>From the notebook</SC>
                <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 6, lineHeight: 1.55 }}>
                  "{entry.note}"
                </p>
              </div>
            )}

            <div style={{ marginTop: 16, padding: "12px 14px", background: C.card, border: `0.5px solid ${C.border}` }}>
              <SC color={C.gold} size={8}>Margaux is handling</SC>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
                {[
                  ["Reservation", "holding tonight"],
                  ["From villa", "12 min walk"],
                  ["Closed",     "Mondays"],
                  ["Dress",      "smart casual"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontFamily: F.mono, fontSize: 8, color: C.stone, letterSpacing: 1, textTransform: "uppercase" }}>{k}</p>
                    <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream, fontStyle: "italic", fontWeight: 300, marginTop: 2 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
              <Btn primary={false} onClick={onSwap} style={{ flex: 1 }}>Swap from notebook</Btn>
              {pick
                ? <Btn primary={false} onClick={onRemove} style={{ flex: 1, color: C.red, borderColor: C.red + "70" }}>Remove · keep free</Btn>
                : <Btn onClick={onPromote} style={{ flex: 1 }}>Keep this</Btn>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DAY PLANNER ──────────────────────────────────────────
function DayPlanner({ verdicts, planOverrides, setOverride, onFinalise }) {
  const [active, setActive] = useState(0);
  const [view, setView] = useState("list");
  const [sheet, setSheet] = useState(null); // { dayIdx, slotId }

  const autoplan = useMemo(() => planFromVerdicts(verdicts), [verdicts]);
  const getEntry = (dayIdx, slotId) => {
    const key = `${dayIdx}-${slotId}`;
    if (key in planOverrides) return planOverrides[key]; // null = free, object = override
    return autoplan[key];
  };
  const getEntries = (dayIdx) => {
    const m = {};
    for (const s of SLOTS) m[`${dayIdx}-${s.id}`] = getEntry(dayIdx, s.id);
    return m;
  };

  const pinsByDay = useMemo(() => DAYS.map(d => {
    const entries = SLOTS.map((s, i) => {
      const e = getEntry(d.idx, s.id);
      if (!e) return null;
      return { ...e, n: i + 1 };
    }).filter(Boolean);
    return { day: d.idx, color: d.color, pins: entries };
  }), [verdicts, planOverrides]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "62px 0 30px", position: "relative" }}>
      <div style={{ padding: "0 22px 14px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <SC color={C.gold} size={9}>Rome · five days</SC>
          <h1 style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 4, lineHeight: 1.15 }}>
            Margaux's draft.
          </h1>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "list", l: "Days" }, { id: "map", l: "Map" }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              padding: "5px 10px",
              background: view === t.id ? `${C.sea}18` : "transparent",
              border: `0.5px solid ${view === t.id ? C.sea : C.border}`,
              color: view === t.id ? C.sea : C.stone,
              fontFamily: F.sans, fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase",
              cursor: "pointer",
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 18px 14px" }}>
        <DayStrip active={active} setActive={setActive} getEntries={getEntries} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 22px 18px" }}>
        {view === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SLOTS.map(s => (
              <SlotCard
                key={s.id}
                slot={s}
                entry={getEntry(active, s.id)}
                dayColor={DAYS[active].color}
                onOpen={() => setSheet({ dayIdx: active, slotId: s.id })}
              />
            ))}
          </div>
        )}
        {view === "map" && (
          <div>
            <RomeMap pinsByDay={pinsByDay} activeDay={active} height={260} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {DAYS.map(d => (
                <button key={d.idx} onClick={() => setActive(d.idx)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 9px",
                  background: active === d.idx ? `${d.color}18` : "transparent",
                  border: `0.5px solid ${active === d.idx ? d.color : C.border}`,
                  color: active === d.idx ? d.color : C.stone,
                  fontFamily: F.mono, fontSize: 9, letterSpacing: 1, textTransform: "uppercase",
                  cursor: "pointer",
                }}>
                  <Dot color={d.color} s={5} /> {d.date}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "0 22px" }}>
        <Btn full onClick={onFinalise}>Margaux · finalise Rome</Btn>
        <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", fontWeight: 300, textAlign: "center", marginTop: 8 }}>
          She'll handle reservations · addresses · openings · timing.
        </p>
      </div>

      {sheet && (() => {
        const slot = SLOTS.find(s => s.id === sheet.slotId);
        const entry = getEntry(sheet.dayIdx, sheet.slotId);
        const key = `${sheet.dayIdx}-${sheet.slotId}`;
        return (
          <SlotSheet
            open={true}
            slot={slot}
            entry={entry}
            dayIdx={sheet.dayIdx}
            onClose={() => setSheet(null)}
            onSwap={() => {
              const next = nextSuggestion(slot.id, entry?.suggId);
              setOverride(key, next);
            }}
            onRemove={() => setOverride(key, null)}
            onPromote={() => {
              if (entry) setOverride(key, { ...entry, accent: C.gold, kind: "pick", pickId: undefined, verdict: "more" });
              setSheet(null);
            }}
          />
        );
      })()}
    </div>
  );
}

// ─── DRAFTED · summary card after finalise tap ────────────
function Drafted({ verdicts, planOverrides, captures, onEnterLedger }) {
  const autoplan = useMemo(() => planFromVerdicts(verdicts), [verdicts]);
  const getEntry = (dayIdx, slotId) => {
    const key = `${dayIdx}-${slotId}`;
    if (key in planOverrides) return planOverrides[key];
    return autoplan[key];
  };
  const tones = captures?.year_tones?.chips || [];
  const totalKept = Object.values(verdicts).filter(v => v === "keep" || v === "more").length;
  const totalPlaces = DAYS.reduce((acc, d) => acc + SLOTS.filter(s => !!getEntry(d.idx, s.id)).length, 0);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "60px 26px 30px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, ${C.gold}10 0%, transparent 60%)`, pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <SC color={C.gold} size={9}>Drafted</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 30, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 10, lineHeight: 1.1 }}>
          Rome · Jul 13–17
        </h1>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 14, lineHeight: 1.6, maxWidth: 290, marginLeft: "auto", marginRight: "auto" }}>
          {totalKept} kept from Lara's six.<br/>
          {totalPlaces} places across five days.<br/>
          Margaux is calling Roscioli at midnight Rome time.
        </p>

        {!!tones.length && (
          <div style={{ marginTop: 22, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
            {tones.map(t => (
              <span key={t} style={{ padding: "4px 10px", border: `0.5px solid ${C.gold}80`, color: C.gold, fontFamily: F.body, fontSize: 12.5, fontStyle: "italic", fontWeight: 300 }}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 28, padding: "14px 14px", background: C.card, border: `0.5px solid ${C.border}`, borderLeft: `1.5px solid ${C.blush}`, textAlign: "left", maxWidth: 320, width: "100%", marginLeft: "auto", marginRight: "auto" }}>
          <SC color={C.blush} size={8}>Margaux</SC>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 6, lineHeight: 1.55 }}>
            "I'll have reservations and a courier-confirmed address book to you by Friday. You'll see them appear in the ledger as I clear them."
          </p>
        </div>
      </div>

      <Btn full onClick={onEnterLedger}>Open the ledger</Btn>
    </div>
  );
}

window.WOVEN_B = { DayPlanner, Drafted, DAYS, SLOTS, NOTEBOOK_SUGGESTIONS, planFromVerdicts };
