// ─── TRIP DETAIL ─ open a trip, vote on ideas, place on days ──
// Curated suggestions by destination. Each item moves through
// idea → maybe → yes, and "yes" items can be placed on a day.

const TRIP_DETAIL = (() => {
const { C, F, Mono, SC, Btn, VIBES } = window.MVP;
const { useState, useMemo } = React;

// ─── CURATIONS ──────────────────────────────────────────────
// Seeded ideas for places we know well. Match by keyword in the
// trip title. Otherwise the screen shows a polite waiting state.
const CURATIONS = {
  rome: {
    label: "Rome",
    intro: "What the makers have been gathering for you. Mark them as you read — Margaux will work to whatever's in Yes.",
    sections: [
      {
        id: "tables",
        title: "Tables",
        sub: "The reference points",
        items: [
          { id: "r-roscioli",   title: "Roscioli",                  blurb: "Cacio e pepe and burrata. The corner two-top by the wine wall.",         hint: "Campo de' Fiori · Tue/Sat" },
          { id: "r-pierluigi",  title: "Pierluigi",                 blurb: "Seafood, piazza tables. Margaux can pull the 21:00 hold on a Saturday.", hint: "Piazza dei Ricci" },
          { id: "r-armando",    title: "Armando al Pantheon",       blurb: "The carbonara benchmark. Family-run since 1961.",                        hint: "Piazza della Rotonda" },
          { id: "r-daenzo",     title: "Da Enzo al 29",             blurb: "Trastevere classic. The 19:30 queue is the rule.",                       hint: "Trastevere · no reservations" },
          { id: "r-pennestri",  title: "Pennestri",                 blurb: "Quiet, careful, modern Roman.",                                          hint: "Ostiense · book ahead" },
          { id: "r-glass",      title: "Glass Hostaria",            blurb: "The one celebration dinner. Off-menu tasting for four if Margaux asks.", hint: "Trastevere · 1 Michelin" },
          { id: "r-pianostrada",title: "Pianostrada",               blurb: "Vegetable-forward, the focaccia. Federica holds the courtyard table.",   hint: "Trastevere · garden" },
          { id: "r-bonci",      title: "Bonci Pizzarium",           blurb: "Lunch only. Eat on the curb.",                                           hint: "Prati · al taglio" },
          { id: "r-stravinskij",title: "Stravinskij Bar garden",    blurb: "Negroni at 19:30 in the Hotel de Russie garden. Disappear.",            hint: "Hotel de Russie · aperitivo" },
        ],
      },
      {
        id: "mornings",
        title: "Mornings",
        sub: "Markets, coffee, slow light",
        items: [
          { id: "m-campo",      title: "Campo de' Fiori market",    blurb: "Cherry tomatoes, burrata, fennel with fronds. Shop like a local.",       hint: "Daily · before 11" },
          { id: "m-santeustachio", title: "Sant'Eustachio · three doppios", blurb: "Marco knows. Order at the bar, no questions.",                  hint: "Piazza Sant'Eustachio" },
          { id: "m-aventine",   title: "Aventine at sunrise",       blurb: "Coffee setup brought to the Orange Garden. Empty for one hour.",         hint: "Sunrise · private" },
          { id: "m-salumeria",  title: "Salumeria Roscioli · panino",blurb: "Standing at the counter. Pecorino, mortadella, the salt-cured tomato.", hint: "Via dei Giubbonari" },
        ],
      },
      {
        id: "experiences",
        title: "Experiences",
        sub: "The version of each thing only Margaux can book",
        items: [
          { id: "x-vatican",    title: "Vatican · private entry",   blurb: "Dr. Elena Brignone at 09:00. The map gallery without the crowds.",        hint: "2 hours · before opening" },
          { id: "x-pantheon",   title: "Pantheon at noon",          blurb: "Key-holder visit. Oculus light, quiet historian.",                        hint: "Mid-day · 30 min" },
          { id: "x-borghese",   title: "Galleria Borghese · curator",blurb: "After-hours walkthrough with a curator. Not the public booking.",        hint: "Dusk · private" },
          { id: "x-adriana",    title: "Villa Adriana at opening",  blurb: "Marco drives, breakfast brought. Three hours, no clock.",                 hint: "Tivoli · day trip" },
          { id: "x-goddesses",  title: "The goddess thread",        blurb: "Vesta, Minerva, Magna Mater, Isis. A private pilgrimage stitched through the city.", hint: "Half-day · walking" },
        ],
      },
      {
        id: "artisans",
        title: "Artisans & evenings at home",
        sub: "Doors that don't have signs",
        items: [
          { id: "a-perfume",    title: "Bespoke perfume · near Piazza Navona", blurb: "Two appointments, one composition that's yours.",             hint: "By appointment" },
          { id: "a-leather",    title: "Leather woman · Trastevere",blurb: "One bag a month. Margaux books the fitting.",                            hint: "Private studio" },
          { id: "a-tailor",     title: "Tailor in Monti",           blurb: "Linen suit in 48 hours if you're someone's friend.",                     hint: "Via dei Serpenti" },
          { id: "a-lorenzo",    title: "Chef Lorenzo · at the apartment", blurb: "Eight friends. He brings the porcini. Massimo pours.",             hint: "One evening · 20:00" },
          { id: "a-principessa",title: "Roman principessa's table", blurb: "A 10-seat dinner overlooking the Forum. One night only — arranged.",     hint: "Private · invitation" },
        ],
      },
      {
        id: "care",
        title: "The choreography",
        sub: "Logistics & care, on standby",
        items: [
          { id: "c-marco",      title: "Marco at FCO",              blurb: "Cold San Pellegrino, local SIM already in the phone. Apartment opened.",  hint: "Arrival · day 1" },
          { id: "c-pilates",    title: "Pilates teacher to the apartment", blurb: "Late mornings only.",                                            hint: "By appointment" },
          { id: "c-facialist",  title: "Hotel de Russie facialist", blurb: "Six hours' notice. Margaux's contact.",                                  hint: "Spa · 90 min" },
          { id: "c-acupuncture",title: "Acupuncturist · Piazza del Popolo", blurb: "Treats half of expat Rome.",                                    hint: "By appointment" },
        ],
      },
    ],
  },
};

const matchCuration = (where) => {
  if (!where) return null;
  const w = where.toLowerCase();
  for (const key of Object.keys(CURATIONS)) {
    if (w.includes(key)) return CURATIONS[key];
  }
  return null;
};

// ─── HELPERS ────────────────────────────────────────────────
const fmt = (s) => {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const tripLength = (start, end) => {
  if (!start || !end) return 0;
  const a = new Date(start), b = new Date(end);
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1);
};

const dateForDay = (start, dayIdx) => {
  if (!start) return null;
  const d = new Date(start + "T00:00:00");
  d.setDate(d.getDate() + dayIdx);
  return d;
};

const fmtDay = (d) => d ? d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—";

// ─── STATUS PICKER ──────────────────────────────────────────
const STATUS = [
  { id: "idea",  label: "Idea",  color: C.stoneSoft },
  { id: "maybe", label: "Maybe", color: C.gold },
  { id: "yes",   label: "Yes",   color: C.sage },
];

const StatusPicker = ({ status, onChange }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {STATUS.map(s => {
      const active = status === s.id;
      return (
        <button key={s.id} onClick={() => onChange(s.id)} style={{
          padding: "5px 8px",
          background: active ? `${s.color}1A` : "transparent",
          border: `0.5px solid ${active ? s.color : C.border}`,
          color: active ? s.color : C.stoneSoft,
          fontFamily: F.sans, fontSize: 8, letterSpacing: 1.6, textTransform: "uppercase",
          cursor: "pointer", transition: "all 0.15s",
        }}>
          {s.label}
        </button>
      );
    })}
  </div>
);

// ─── DAY PICKER ─────────────────────────────────────────────
const DayPicker = ({ day, days, onChange, start }) => (
  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
    <SC size={7.5} color={C.stoneSoft}>Day</SC>
    {Array.from({ length: days }).map((_, i) => {
      const active = day === (i + 1);
      return (
        <button key={i} onClick={() => onChange(active ? null : (i + 1))} style={{
          width: 22, height: 22,
          background: active ? C.gold : "transparent",
          border: `0.5px solid ${active ? C.gold : C.border}`,
          color: active ? C.bg : C.creamSoft,
          fontFamily: F.mono, fontSize: 9.5, fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}>{i + 1}</button>
      );
    })}
    {day && start && (
      <span style={{ fontFamily: F.body, fontSize: 12, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, marginLeft: 4 }}>
        · {fmtDay(dateForDay(start, day - 1))}
      </span>
    )}
  </div>
);

// ─── IDEA CARD ──────────────────────────────────────────────
const IdeaCard = ({ item, state, onUpdate, days, start }) => {
  const status = state?.status || "idea";
  const day = state?.day || null;
  const accent = STATUS.find(s => s.id === status)?.color;
  const isYes = status === "yes";

  return (
    <div style={{
      borderTop: `0.5px solid ${C.border}`,
      padding: "14px 0 14px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", fontWeight: 400, color: status === "idea" ? C.creamSoft : C.cream, lineHeight: 1.15 }}>
            {item.title}
          </h4>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, lineHeight: 1.45, marginTop: 4 }}>
            {item.blurb}
          </p>
          {item.hint && (
            <p style={{ fontFamily: F.mono, fontSize: 8.5, color: C.stoneSoft, letterSpacing: 0.5, marginTop: 6, textTransform: "uppercase" }}>
              {item.hint}
            </p>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          <StatusPicker status={status} onChange={(s) => onUpdate({ status: s, day: s === "yes" ? day : null })} />
        </div>
      </div>

      {isYes && (
        <div className="fade" style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px dashed ${C.border}` }}>
          <DayPicker day={day} days={days} onChange={(d) => onUpdate({ status: "yes", day: d })} start={start} />
        </div>
      )}
    </div>
  );
};

// ─── DAY STRIP ──────────────────────────────────────────────
const DayStrip = ({ days, start, itemsByDay, curation }) => {
  const flat = (curation?.sections || []).flatMap(s => s.items);
  const find = (id) => flat.find(i => i.id === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: days }).map((_, i) => {
        const dayNum = i + 1;
        const items = itemsByDay[dayNum] || [];
        const date = dateForDay(start, i);
        return (
          <div key={i} style={{
            padding: "12px 14px",
            border: `0.5px solid ${items.length ? C.borderLight : C.border}`,
            background: items.length ? C.card : C.bgSoft,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <SC size={8.5} color={items.length ? C.gold : C.stone}>Day {String(dayNum).padStart(2, "0")}</SC>
              <span style={{ fontFamily: F.mono, fontSize: 9, color: C.stoneSoft, letterSpacing: 0.5 }}>
                {fmtDay(date)}
              </span>
            </div>
            {items.length === 0 ? (
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stoneSoft, fontStyle: "italic", fontWeight: 300, marginTop: 6 }}>
                Empty — place an idea above.
              </p>
            ) : (
              <ul style={{ listStyle: "none", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map(itemId => {
                  const it = find(itemId);
                  if (!it) return null;
                  return (
                    <li key={itemId} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, marginTop: 6, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontFamily: F.display, fontSize: 14.5, fontStyle: "italic", color: C.cream }}>{it.title}</span>
                        {it.hint && <span style={{ fontFamily: F.mono, fontSize: 8, color: C.stoneSoft, marginLeft: 6, letterSpacing: 0.3, textTransform: "uppercase" }}>{it.hint}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── PACKING LIST PLACEHOLDER ───────────────────────────────
const PackingPlaceholder = ({ voted, onVote }) => (
  <div style={{
    padding: "16px",
    border: `0.5px solid ${voted ? `${C.blush}80` : C.border}`,
    background: voted ? `${C.blush}10` : C.bgSoft,
    display: "flex", gap: 14, alignItems: "flex-start",
    transition: "all 0.2s",
  }}>
    <div style={{ width: 36, height: 36, border: `0.5px solid ${voted ? C.blush : C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F.display, fontSize: 16, fontStyle: "italic", color: C.blush }}>
      P
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h4 style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", fontWeight: 400, color: C.creamSoft }}>Packing list</h4>
        <span style={{ fontFamily: F.sans, fontSize: 7.5, color: C.blush, letterSpacing: 1.6, textTransform: "uppercase", border: `0.5px solid ${C.blush}40`, padding: "2px 6px", flexShrink: 0 }}>Coming</span>
      </div>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontWeight: 300, lineHeight: 1.45, marginTop: 4, marginBottom: 8 }}>
        Per-trip checklist — by climate, dress code, and length. Drafts saved between trips.
      </p>
      <button onClick={onVote} style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        fontFamily: F.sans, fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase",
        color: voted ? C.blush : C.stoneSoft,
        display: "inline-flex", alignItems: "center", gap: 5,
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          border: `0.5px solid ${voted ? C.blush : C.stoneSoft}`,
          background: voted ? C.blush : "transparent",
        }} />
        {voted ? "Want this — noted" : "I'd want this first"}
      </button>
    </div>
  </div>
);

// ─── EMPTY-CURATION STATE ───────────────────────────────────
const NoCurationYet = () => (
  <div style={{ padding: "20px 18px", border: `0.5px dashed ${C.border}`, background: C.bgSoft, textAlign: "left" }}>
    <SC size={8.5} color={C.gold}>The makers are curating</SC>
    <p style={{ fontFamily: F.body, fontSize: 14.5, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.55, marginTop: 8 }}>
      We're putting together notes for this trip — tables, mornings, the choreography. Usually within 48 hours. We'll let you know.
    </p>
    <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5, marginTop: 8 }}>
      In the meantime — forward any bookings to the inbox below and they'll appear on the right day.
    </p>
  </div>
);

// ─── PARSED INBOX ITEMS ─────────────────────────────────────
const KIND_META = {
  hotel:      { color: C.gold,  glyph: "▣" },
  flight:     { color: C.sea,   glyph: "→" },
  restaurant: { color: C.blush, glyph: "●" },
  transfer:   { color: C.sage,  glyph: "↳" },
  event:      { color: C.dusk,  glyph: "✦" },
  other:      { color: C.stone, glyph: "·" },
};

const fmtWhen = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

const ForwardedItem = ({ item, onDelete }) => {
  const meta = KIND_META[item.kind] || KIND_META.other;
  const when = fmtWhen(item.when);
  return (
    <div style={{ padding: "12px 12px", border: `0.5px solid ${meta.color}40`, background: `${meta.color}08`, borderLeft: `1.5px solid ${meta.color}`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, color: meta.color }}>{meta.glyph}</span>
          <span style={{ fontFamily: F.mono, fontSize: 8.5, color: meta.color, letterSpacing: 1.4, textTransform: "uppercase" }}>{item.kind}</span>
        </div>
        {onDelete && (
          <button onClick={() => onDelete(item.id)} style={{ background: "none", border: "none", color: C.stoneSoft, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>
      <p style={{ fontFamily: F.display, fontSize: 16, fontStyle: "italic", color: C.cream, marginTop: 4, lineHeight: 1.2 }}>{item.title}</p>
      {when && <p style={{ fontFamily: F.mono, fontSize: 9.5, color: C.creamSoft, marginTop: 4, letterSpacing: 0.4 }}>{when}{item.where ? ` · ${item.where}` : ""}</p>}
      {!when && item.where && <p style={{ fontFamily: F.mono, fontSize: 9.5, color: C.stone, marginTop: 4 }}>{item.where}</p>}
      {item.details && <p style={{ fontFamily: F.body, fontSize: 13, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.45, marginTop: 6 }}>{item.details}</p>}
    </div>
  );
};

const PasteEmail = ({ tripId, onParsed }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  const send = async () => {
    if (!text.trim() || !window.LEDGER_API) return;
    setStatus("sending"); setError("");
    try {
      const result = await window.LEDGER_API.pasteEmail({ tripId, text });
      setStatus("ok");
      setText("");
      onParsed && onParsed(result.items || []);
      setTimeout(() => { setStatus(null); setOpen(false); }, 1500);
    } catch (e) {
      setStatus("err");
      setError(String(e.message || e));
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: "100%", padding: "10px 12px", textAlign: "left",
        background: "transparent", border: `0.5px dashed ${C.borderLight}`,
        color: C.stone, cursor: "pointer",
        fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
      }}>+ Paste an email to test the parser</button>
    );
  }

  return (
    <div style={{ padding: "14px 14px", border: `0.5px solid ${C.borderLight}`, background: C.bgSoft }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <SC size={8.5} color={C.gold}>Paste & parse</SC>
        <button onClick={() => { setOpen(false); setStatus(null); setText(""); }} style={{ background: "none", border: "none", color: C.stone, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
      </div>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, lineHeight: 1.4, marginBottom: 10 }}>
        Paste any confirmation body. The parser reads it the same way it would if forwarded.
      </p>
      <textarea rows={6} value={text} onChange={e => setText(e.target.value)}
        placeholder="From: hotel@aman.com\nSubject: Reservation confirmation\n\nDear Ms Lam, your reservation..."
        style={{ fontFamily: F.mono, fontSize: 12, color: C.cream, padding: "10px 12px", background: C.card, border: `0.5px solid ${C.border}`, lineHeight: 1.5, resize: "vertical", minHeight: 120 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button onClick={send} disabled={status === "sending" || !text.trim()} style={{
          padding: "8px 14px", background: status === "sending" ? C.borderLight : C.gold,
          color: C.bg, border: "none",
          fontFamily: F.sans, fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase",
          cursor: status === "sending" || !text.trim() ? "default" : "pointer",
          opacity: !text.trim() ? 0.5 : 1,
        }}>{status === "sending" ? "Parsing..." : "Parse"}</button>
        {status === "ok" && <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.sage, letterSpacing: 1 }}>✓ Parsed</span>}
        {status === "err" && <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.blush, letterSpacing: 0.5, flex: 1, wordBreak: "break-word" }}>{error}</span>}
      </div>
    </div>
  );
};

// ─── MAIN ───────────────────────────────────────────────────
const TripDetail = ({ trip, tripNumber, back, updateItem }) => {
  const [packingVoted, setPackingVoted] = useState(false);
  const [forwarded, setForwarded] = useState([]);

  const curation = matchCuration(trip.where);
  const days = tripLength(trip.start, trip.end);
  const itemStates = trip.items || {};

  // Pull forwarded items from the worker. Refresh on mount + when the tab
  // regains focus (she just sent an email and switched back).
  const refresh = React.useCallback(async () => {
    if (!window.LEDGER_API) return;
    const items = await window.LEDGER_API.getItems(trip.id);
    setForwarded(items);
  }, [trip.id]);

  React.useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const deleteForwarded = async (itemId) => {
    if (!window.LEDGER_API) return;
    await window.LEDGER_API.deleteItem(trip.id, itemId);
    refresh();
  };

  // Bucket forwarded items onto trip days by `when` date
  const forwardedByDay = useMemo(() => {
    if (!trip.start) return { buckets: {}, unscheduled: forwarded };
    const startDate = new Date(trip.start + "T00:00:00");
    const buckets = {};
    const unscheduled = [];
    for (const item of forwarded) {
      if (!item.when) { unscheduled.push(item); continue; }
      const w = new Date(item.when);
      if (Number.isNaN(w.getTime())) { unscheduled.push(item); continue; }
      const dayNum = Math.floor((w - startDate) / (1000 * 60 * 60 * 24)) + 1;
      if (dayNum < 1 || dayNum > days) { unscheduled.push(item); continue; }
      buckets[dayNum] = buckets[dayNum] || [];
      buckets[dayNum].push(item);
    }
    Object.keys(buckets).forEach(d => buckets[d].sort((a, b) => (a.when || "").localeCompare(b.when || "")));
    return { buckets, unscheduled };
  }, [forwarded, trip.start, days]);

  // group "yes" items by day
  const itemsByDay = useMemo(() => {
    const byDay = {};
    Object.entries(itemStates).forEach(([itemId, state]) => {
      if (state?.status === "yes" && state.day) {
        byDay[state.day] = byDay[state.day] || [];
        byDay[state.day].push(itemId);
      }
    });
    return byDay;
  }, [itemStates]);

  // section summary counts
  const counts = useMemo(() => {
    if (!curation) return {};
    const out = {};
    curation.sections.forEach(s => {
      out[s.id] = { idea: 0, maybe: 0, yes: 0 };
      s.items.forEach(it => {
        const st = itemStates[it.id]?.status || "idea";
        out[s.id][st]++;
      });
    });
    return out;
  }, [curation, itemStates]);

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, color: C.cream }}>
      {/* Header — clears iOS status bar */}
      <div style={{ padding: "58px 22px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `0.5px solid ${C.border}` }}>
        <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <SC size={8.5} color={C.stone}>← Trips</SC>
        </button>
        <SC size={8.5} color={C.gold}>Trip {String(tripNumber).padStart(2, "0")}</SC>
      </div>

      {/* Title block */}
      <div style={{ padding: "26px 22px 18px" }}>
        <h1 style={{ fontFamily: F.display, fontSize: 30, fontStyle: "italic", fontWeight: 400, color: C.cream, lineHeight: 1.08 }}>
          {trip.where || "Untitled trip"}
        </h1>
        <p style={{ fontFamily: F.sans, fontSize: 9.5, color: C.stone, letterSpacing: 2.4, textTransform: "uppercase", marginTop: 8 }}>
          {trip.start && trip.end ? `${fmt(trip.start)} — ${fmt(trip.end)} · ${days} days` : "Dates pending"}
        </p>
        {trip.vibes && trip.vibes.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {trip.vibes.map(vid => {
              const v = (VIBES || []).find(x => x.id === vid);
              if (!v) return null;
              return (
                <span key={vid} style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
                  border: `0.5px solid ${v.color}55`,
                  fontFamily: F.sans, fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase",
                  color: C.creamSoft,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: v.color }} />
                  {v.word}
                </span>
              );
            })}
          </div>
        )}
        {trip.note && (
          <p style={{ fontFamily: F.body, fontSize: 15, color: C.creamSoft, fontWeight: 300, fontStyle: "italic", lineHeight: 1.55, marginTop: 16, paddingLeft: 12, borderLeft: `0.5px solid ${C.goldMuted}` }}>
            {trip.note}
          </p>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "10px 22px 100px", display: "flex", flexDirection: "column", gap: 30 }}>
        {/* From the makers — curation */}
        {curation ? (
          <section>
            <div style={{ marginBottom: 16, padding: "14px 16px", borderLeft: `0.5px solid ${C.goldMuted}`, background: "#13110F" }}>
              <SC size={8.5} color={C.gold}>Sent ahead — for {curation.label}</SC>
              <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontStyle: "italic", fontWeight: 300, lineHeight: 1.55, marginTop: 8 }}>
                {curation.intro}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {curation.sections.map(section => (
                <div key={section.id}>
                  <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontFamily: F.display, fontSize: 19, fontStyle: "italic", fontWeight: 400, color: C.cream }}>
                      {section.title}
                    </h3>
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 0.5 }}>
                      {counts[section.id]?.yes || 0} yes · {counts[section.id]?.maybe || 0} maybe
                    </span>
                  </div>
                  <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, marginBottom: 8 }}>
                    {section.sub}
                  </p>
                  <div>
                    {section.items.map(item => (
                      <IdeaCard key={item.id} item={item} state={itemStates[item.id]}
                        onUpdate={(s) => updateItem(item.id, s)}
                        days={days} start={trip.start} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <NoCurationYet />
          </section>
        )}

        {/* Forwarded — what the inbox parser has captured */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <h2 style={{ fontFamily: F.display, fontSize: 19, fontStyle: "italic", fontWeight: 400, color: C.cream }}>Forwarded</h2>
            <SC size={8} color={C.stone}>{forwarded.length} {forwarded.length === 1 ? "item" : "items"}</SC>
          </div>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, marginBottom: 12, lineHeight: 1.5 }}>
            Anything sent to <span style={{ color: C.creamSoft, fontFamily: F.mono, fontSize: 11 }}>{trip.address}</span> appears here, placed on the right day.
          </p>

          {forwarded.length === 0 ? (
            <div style={{ padding: "16px 16px", border: `0.5px dashed ${C.borderLight}`, background: `${C.card}80`, marginBottom: 10 }}>
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, lineHeight: 1.5, fontStyle: "italic" }}>
                Nothing forwarded yet. Forward a confirmation to the inbox above — or test the parser by pasting one below.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Array.from({ length: days }).map((_, i) => {
                const dayNum = i + 1;
                const items = forwardedByDay.buckets?.[dayNum] || [];
                if (items.length === 0) return null;
                const date = dateForDay(trip.start, i);
                return (
                  <div key={dayNum}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                      <SC size={8.5} color={C.gold}>Day {String(dayNum).padStart(2, "0")}</SC>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: C.stoneSoft }}>{fmtDay(date)}</span>
                    </div>
                    {items.map(it => <ForwardedItem key={it.id} item={it} onDelete={deleteForwarded} />)}
                  </div>
                );
              })}
              {forwardedByDay.unscheduled?.length > 0 && (
                <div>
                  <SC size={8.5} color={C.stone} style={{ marginBottom: 6, display: "inline-block" }}>Date pending</SC>
                  {forwardedByDay.unscheduled.map(it => <ForwardedItem key={it.id} item={it} onDelete={deleteForwarded} />)}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <PasteEmail tripId={trip.id} onParsed={refresh} />
          </div>
        </section>

        {/* The day strip — items she's marked Yes from the curation */}
        {days > 0 && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h2 style={{ fontFamily: F.display, fontSize: 19, fontStyle: "italic", fontWeight: 400, color: C.cream }}>The shape so far</h2>
              <SC size={8} color={C.stone}>{Object.keys(itemsByDay).length}/{days} days touched</SC>
            </div>
            <DayStrip days={days} start={trip.start} itemsByDay={itemsByDay} curation={curation} />
          </section>
        )}

        {/* Packing list — placeholder */}
        <section>
          <h2 style={{ fontFamily: F.display, fontSize: 19, fontStyle: "italic", fontWeight: 400, color: C.cream, marginBottom: 4 }}>The rest</h2>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, marginBottom: 12 }}>
            What we want to bring to this view next.
          </p>
          <PackingPlaceholder voted={packingVoted} onVote={() => setPackingVoted(v => !v)} />
        </section>

        {/* Forward inbox */}
        <section style={{ padding: "14px 16px", border: `0.5px solid ${C.border}`, background: C.bgSoft }}>
          <SC size={8} color={C.stoneSoft}>This trip's inbox</SC>
          <p style={{ fontFamily: F.mono, fontSize: 11, color: C.cream, marginTop: 6, letterSpacing: 0.2, wordBreak: "break-all" }}>
            {trip.address}
          </p>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 8, lineHeight: 1.5 }}>
            Forward any confirmation here — we'll place it on the right day.
          </p>
        </section>
      </div>
    </div>
  );
};

return { TripDetail, CURATIONS };
})();

window.TRIP_DETAIL = TRIP_DETAIL;
