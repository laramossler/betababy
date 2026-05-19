// ─── MVP HOME ─ live trips list + placeholders ─────────────
// Sorts trips into Upcoming and Past. Each trip has its own inbox.

const HOME = (() => {
const { C, F, Mono, SC, Btn, VIBES } = window.MVP;
const VIBES_BY_ID = Object.fromEntries((VIBES || []).map(v => [v.id, v]));

const fmt = (s) => {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const fmtYear = (s) => {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric" });
};

const daysOut = (start) => {
  if (!start) return null;
  const a = new Date(start + "T00:00:00");
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((a - now) / (1000 * 60 * 60 * 24));
};

const tripLength = (start, end) => {
  if (!start || !end) return null;
  const a = new Date(start), b = new Date(end);
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
};

// Empty inbox row — used inside live trip card before any forwards
const EmptyInbox = () => (
  <div style={{ padding: "16px 16px", border: `0.5px dashed ${C.borderLight}`, background: `${C.card}80`, textAlign: "left" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, animation: "pulse 2s infinite" }} />
      <SC size={8} color={C.gold}>Waiting on your inbox</SC>
    </div>
    <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, lineHeight: 1.5, fontStyle: "italic" }}>
      Nothing forwarded yet. Send your first confirmation and we'll place it on the right day.
    </p>
  </div>
);

// ── TRIP CARD ────────────────────────────────────────────────
const TripCard = ({ trip, number, isPast = false, onOpen }) => {
  const len = tripLength(trip.start, trip.end);
  const out = daysOut(trip.start);
  const numLabel = String(number).padStart(2, "0");

  // status pill text
  const status = (() => {
    if (isPast) return "Past";
    if (out === null) return "Drafting";
    if (out === 0) return "Today";
    if (out > 0 && out <= 14) return `${out}d out`;
    if (out > 14) return `${Math.round(out / 7)}w out`;
    return "Past";
  })();

  return (
    <div style={{
      border: `0.5px solid ${isPast ? C.border : C.borderLight}`,
      background: isPast
        ? C.bgSoft
        : `linear-gradient(180deg, ${C.card} 0%, ${C.bgSoft} 100%)`,
      padding: "20px 18px 18px",
      position: "relative",
      opacity: isPast ? 0.78 : 1,
    }}>
      {/* gold corner tick — only on upcoming */}
      {!isPast && <>
        <div style={{ position: "absolute", top: 0, left: 0, width: 14, height: "1px", background: C.gold }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "1px", height: 14, background: C.gold }} />
      </>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <SC size={8.5} color={isPast ? C.stone : C.gold}>Trip {numLabel}</SC>
        <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.stone, letterSpacing: 1 }}>{status}</span>
      </div>

      <h3 style={{ fontFamily: F.display, fontSize: 22, fontStyle: "italic", fontWeight: 400, color: isPast ? C.creamSoft : C.cream, lineHeight: 1.1, marginBottom: 4 }}>
        {trip.where || "Untitled trip"}
      </h3>
      <p style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 2.4, textTransform: "uppercase", marginBottom: 14 }}>
        {trip.start && trip.end ? `${fmt(trip.start)} — ${fmt(trip.end)} · ${fmtYear(trip.start)}` : "Dates pending"}{len ? ` · ${len}${len === 1 ? "d" : "d"}` : ""}
      </p>

      {trip.vibes && trip.vibes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {trip.vibes.map(vid => {
            const v = VIBES_BY_ID[vid];
            if (!v) return null;
            return (
              <span key={vid} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 9px",
                border: `0.5px solid ${v.color}55`,
                fontFamily: F.sans, fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase",
                color: isPast ? C.stone : C.creamSoft,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: v.color, display: "inline-block" }} />
                {v.word}
              </span>
            );
          })}
        </div>
      )}

      {trip.note && !isPast && (
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontWeight: 300, fontStyle: "italic", lineHeight: 1.5, marginBottom: 14, paddingLeft: 10, borderLeft: `0.5px solid ${C.goldMuted}` }}>
          {trip.note}
        </p>
      )}

      {trip.companions && trip.companions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex" }}>
            {trip.companions.slice(0, 5).map((c, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: "50%",
                border: `0.5px solid ${C.goldMuted}`, background: C.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F.sans, fontSize: 9.5, color: C.gold,
                marginLeft: i === 0 ? 0 : -6,
              }}>{c[0].toUpperCase()}</div>
            ))}
            {trip.companions.length > 5 && (
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.bg, border: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontSize: 9, color: C.stone, marginLeft: -6 }}>
                +{trip.companions.length - 5}
              </div>
            )}
          </div>
          <span style={{ marginLeft: 10, fontFamily: F.body, fontSize: 13, fontStyle: "italic", color: C.creamSoft, fontWeight: 300 }}>
            with {trip.companions.slice(0, 3).join(", ")}{trip.companions.length > 3 ? ` +${trip.companions.length - 3}` : ""}
          </span>
        </div>
      )}

      {!isPast && <EmptyInbox />}

      <div style={{ marginTop: isPast ? 0 : 14, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `0.5px solid ${C.border}`, paddingTop: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <SC size={7.5} color={C.stoneSoft}>Inbox</SC>
          <p style={{ fontFamily: F.mono, fontSize: 9.5, color: C.creamSoft, marginTop: 3, letterSpacing: 0.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trip.address}</p>
        </div>
        <button onClick={onOpen} style={{
          padding: "7px 12px", background: "transparent", marginLeft: 10, flexShrink: 0,
          border: `0.5px solid ${isPast ? C.borderLight : C.goldMuted}`, color: isPast ? C.creamSoft : C.gold,
          fontFamily: F.sans, fontSize: 8.5, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer",
        }}>Open →</button>
      </div>
    </div>
  );
};

// ── EMPTY STATE (no trips yet — shouldn't happen but safe) ──
const NoTrips = ({ onNew }) => (
  <div style={{ padding: "32px 22px", border: `0.5px dashed ${C.border}`, textAlign: "center" }}>
    <SC size={8} color={C.gold}>No trips yet</SC>
    <p style={{ fontFamily: F.body, fontSize: 14.5, color: C.stone, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5, marginTop: 10, marginBottom: 18 }}>
      Add one and start forwarding.
    </p>
    <Btn primary onClick={onNew}>Plan a trip</Btn>
  </div>
);

// ── PLACEHOLDER CARD ───────────────────────────────────────
const Placeholder = ({ id, mark, name, blurb, when, accent = C.stone, voted, onVote }) => (
  <div style={{
    border: `0.5px solid ${voted ? `${accent}80` : C.border}`,
    background: voted ? `${accent}0F` : C.bgSoft,
    padding: "14px 14px 14px",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    transition: "all 0.2s",
  }}>
    <div style={{ width: 30, height: 30, border: `0.5px solid ${voted ? accent : C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: accent }}>
      {mark}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ fontFamily: F.display, fontSize: 16, fontWeight: 400, color: C.creamSoft, fontStyle: "italic" }}>{name}</h4>
        <span style={{ fontFamily: F.sans, fontSize: 7.5, color: accent, letterSpacing: 1.6, textTransform: "uppercase", flexShrink: 0, border: `0.5px solid ${accent}40`, padding: "2px 6px" }}>{when}</span>
      </div>
      <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontWeight: 300, lineHeight: 1.45, marginTop: 4, marginBottom: 8 }}>{blurb}</p>
      <button onClick={() => onVote(id)} style={{
        background: "transparent", border: "none", padding: 0,
        cursor: "pointer",
        fontFamily: F.sans, fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase",
        color: voted ? accent : C.stoneSoft,
        display: "inline-flex", alignItems: "center", gap: 5,
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: "50%",
          border: `0.5px solid ${voted ? accent : C.stoneSoft}`,
          background: voted ? accent : "transparent",
          display: "inline-block",
        }} />
        {voted ? "Want this — noted" : "I'd want this first"}
      </button>
    </div>
  </div>
);

// ── HOME ────────────────────────────────────────────────────
const Home = ({ user, trips, onNew, onOpen, onRestart }) => {
  const { useState } = React;
  const [wants, setWants] = useState(new Set());
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const toggleWant = (id) => {
    setWants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Sort trips: upcoming first (closest first), past after (most recent first)
  const today = new Date(); today.setHours(0,0,0,0);
  const sorted = [...trips].map(t => ({ ...t, _start: t.start ? new Date(t.start + "T00:00:00") : null }));
  const upcoming = sorted
    .filter(t => !t._start || t._start >= today)
    .sort((a, b) => {
      if (!a._start) return 1;
      if (!b._start) return -1;
      return a._start - b._start;
    });
  const past = sorted
    .filter(t => t._start && t._start < today)
    .sort((a, b) => b._start - a._start);

  // Number trips in creation order (using their position in `trips`)
  const numberFor = (id) => trips.findIndex(t => t.id === id) + 1;

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, color: C.cream }}>
      {/* Header — clears iOS status bar */}
      <div style={{ padding: "58px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Mono s={22} />
          <div>
            <p style={{ fontFamily: F.display, fontSize: 13, fontStyle: "italic", color: C.cream, lineHeight: 1 }}>
              Good evening, {user.name ? user.name.split(" ")[0] : "you"}.
            </p>
            <p style={{ fontFamily: F.sans, fontSize: 8, color: C.stone, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
              {user.city || "—"}
            </p>
          </div>
        </div>
        <button onClick={onRestart} title="Reset prototype" style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `0.5px solid ${C.goldMuted}`, background: "transparent",
          color: C.gold, fontFamily: F.sans, fontSize: 11, cursor: "pointer",
        }}>{user.name ? user.name[0].toUpperCase() : "·"}</button>
      </div>

      {/* Body */}
      <div style={{ padding: "26px 22px 100px", display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Section: Upcoming trips */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", fontWeight: 400, color: C.cream }}>Upcoming</h2>
              <p style={{ fontFamily: F.sans, fontSize: 8.5, color: C.stone, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
                {upcoming.length} {upcoming.length === 1 ? "trip" : "trips"} on the ledger
              </p>
            </div>
            <button onClick={onNew} style={{
              padding: "8px 12px", background: "transparent",
              border: `0.5px solid ${C.goldMuted}`, color: C.gold,
              fontFamily: F.sans, fontSize: 8.5, letterSpacing: 2.4, textTransform: "uppercase", cursor: "pointer",
            }}>+ New</button>
          </div>

          {upcoming.length === 0
            ? <NoTrips onNew={onNew} />
            : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {upcoming.map(t => (
                  <TripCard key={t.id} trip={t} number={numberFor(t.id)} onOpen={() => onOpen(t.id)} />
                ))}
              </div>
          }
        </section>

        {/* Section: Past trips — only shown if there are any */}
        {past.length > 0 && (
          <section>
            <h2 style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", fontWeight: 400, color: C.cream, marginBottom: 12 }}>Past</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {past.map(t => (
                <TripCard key={t.id} trip={t} number={numberFor(t.id)} isPast onOpen={() => onOpen(t.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Section: The rest — placeholders */}
        <section>
          <h2 style={{ fontFamily: F.display, fontSize: 17, fontStyle: "italic", fontWeight: 400, color: C.cream, marginBottom: 4 }}>The rest of the ledger</h2>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.stone, fontWeight: 300, fontStyle: "italic", lineHeight: 1.5, marginBottom: 14 }}>
            We're building these alongside you. Tell us which one to bring next.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Placeholder id="margaux" mark="M" name="Margaux"        blurb="A named concierge who answers in minutes." when="Soon" accent={C.gold}  voted={wants.has("margaux")} onVote={toggleWant} />
            <Placeholder id="book"    mark="B" name="The Black Book" blurb="Every hotel suite, table and driver worth keeping." when="Q3"   accent={C.blush} voted={wants.has("book")}    onVote={toggleWant} />
            <Placeholder id="voice"   mark="V" name="Voice memory"   blurb="Voice notes from each trip, tied to the day." when="Q3"        accent={C.dusk}  voted={wants.has("voice")}   onVote={toggleWant} />
            <Placeholder id="gather"  mark="G" name="Gatherings"     blurb="Dinners and salons, planned the same way." when="Q4"           accent={C.sage}  voted={wants.has("gather")}  onVote={toggleWant} />
          </div>
        </section>

        {/* Tell us — the feedback path */}
        <section style={{
          padding: "18px 18px 16px",
          border: `0.5px solid ${C.goldMuted}55`,
          background: "linear-gradient(180deg, #15130F 0%, #0F0E0C 100%)",
          position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 14, height: "1px", background: C.gold }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: "1px", height: 14, background: C.gold }} />
          <SC size={8.5} color={C.gold}>The makers are listening</SC>
          <p style={{ fontFamily: F.body, fontSize: 14.5, color: C.creamSoft, fontWeight: 300, lineHeight: 1.55, marginTop: 8, fontStyle: "italic", marginBottom: 14 }}>
            Tell us what's working, what isn't, and what you'd want next. We read every note personally.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn primary onClick={() => setFeedbackOpen(true)} style={{ flex: 1, padding: "12px" }}>Send us a note</Btn>
            {wants.size > 0 && (
              <span style={{ fontFamily: F.sans, fontSize: 8.5, color: C.gold, letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                {wants.size} want{wants.size === 1 ? "" : "s"} flagged
              </span>
            )}
          </div>
        </section>
      </div>

      {window.FEEDBACK && (
        <window.FEEDBACK.FeedbackSheet
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          wants={wants}
          toggleWant={toggleWant}
          user={user}
        />
      )}
    </div>
  );
};

return { Home };
})();

window.HOME = HOME;
