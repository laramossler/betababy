// ─── SCREENS ──────────────────────────────────────────────
const { C, F, ME, CONCIERGE, CIRCLE, TRIPS, VIBES, WEEK, PET_TASKS, BLACK_BOOK, VOICE_NOTES, CONCIERGE_THREAD, GATHERINGS } = window.LEDGER;
const { Mono, Rule, SC, Tag, Ini, Btn, Imagery, Dot, Status, Divider, PetTag } = window.ATOMS;
const { useState, useEffect, useRef } = React;

// ─── HOME — Chloe's dashboard ────────────────────────────
function Home({ go, setTrip, dynamicTrips = [] }) {
  const allTrips = [...dynamicTrips, ...TRIPS];
  const active = allTrips.find(t => t.status === "active");
  const upcoming = allTrips.filter(t => t.status === "drafting");
  const past = allTrips.filter(t => t.status === "past");

  // Time in HK + LDN (mock)
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const fmt = (offset) => {
    const d = new Date(now.getTime() + offset * 3600 * 1000);
    return d.toUTCString().slice(17, 22);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 80 }}>
      {/* Greeting header */}
      <div style={{ padding: "60px 22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <Mono s={26} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>HKG · {fmt(8)}</p>
              <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, letterSpacing: 1 }}>LDN · {fmt(0)}</p>
            </div>
            <Ini letter={ME.initial} s={28} />
          </div>
        </div>

        <SC style={{ marginBottom: 8 }}>Good evening, Chloe</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 30, color: C.cream, fontWeight: 400, lineHeight: 1.15, fontStyle: "italic", letterSpacing: -0.3 }}>
          Eleven days until<br/>the Riviera
        </h1>
        <p style={{ fontFamily: F.cn, fontSize: 11, color: C.stone, letterSpacing: 4, marginTop: 8 }}>蔚蓝海岸 · 十一日</p>
      </div>

      {/* Active trip — big card */}
      <div onClick={() => { setTrip(active.id); go("trip"); }} style={{ margin: "0 22px 28px", cursor: "pointer", border: `0.5px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ height: 180, background: active.coverGrad, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(10,9,8,0.85) 100%)" }} />
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6, alignItems: "center" }}>
            <Dot color={C.gold} s={6} glow />
            <SC size={8.5} color={C.cream} style={{ letterSpacing: 2.4 }}>Active</SC>
          </div>
          <div style={{ position: "absolute", top: 14, right: 14 }}>
            <SC size={8.5} color={C.cream} style={{ letterSpacing: 2.4 }}>You're hosting</SC>
          </div>
          <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream, opacity: 0.8, fontStyle: "italic", fontWeight: 300 }}>{active.sub}</p>
            <h2 style={{ fontFamily: F.display, fontSize: 24, color: C.cream, fontWeight: 400, fontStyle: "italic" }}>{active.title}</h2>
          </div>
        </div>
        <div style={{ background: C.card, padding: "16px 16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ fontFamily: F.mono, fontSize: 10, color: C.creamSoft, letterSpacing: 1 }}>{active.dates}</p>
            <div style={{ display: "flex", gap: 4 }}>
              {active.guests.map(id => {
                const g = CIRCLE.find(c => c.id === id);
                return g ? <Ini key={id} letter={g.initial} s={18} /> : null;
              })}
              <PetTag s={18} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { k: "Booked", n: active.progress.booked, c: C.sage },
              { k: "Ready", n: active.progress.ready, c: C.gold },
              { k: "Pending", n: active.progress.pending, c: C.stone },
              { k: "Empty", n: active.progress.none, c: C.red },
            ].map(b => (
              <div key={b.k} style={{ flex: 1, padding: "8px 4px", background: C.bg, border: `0.5px solid ${C.border}`, textAlign: "center" }}>
                <p style={{ fontFamily: F.display, fontSize: 16, color: b.c, fontWeight: 400, lineHeight: 1 }}>{b.n}</p>
                <p style={{ fontFamily: F.sans, fontSize: 7.5, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 4 }}>{b.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan a new trip — entry tile */}
      <div style={{ padding: "0 22px 28px" }}>
        <button onClick={() => go("create")} style={{
          width: "100%", background: "transparent",
          border: `0.5px solid ${C.goldMuted}`, padding: "20px 18px",
          cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14,
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative corners */}
          {[
            { t: 6, l: 6, bt: 1, bl: 1 }, { t: 6, r: 6, bt: 1, br: 1 },
            { b: 6, l: 6, bb: 1, bl: 1 }, { b: 6, r: 6, bb: 1, br: 1 },
          ].map((p, i) => (
            <div key={i} style={{
              position: "absolute", width: 10, height: 10,
              ...(p.t !== undefined && { top: p.t }), ...(p.b !== undefined && { bottom: p.b }),
              ...(p.l !== undefined && { left: p.l }), ...(p.r !== undefined && { right: p.r }),
              borderTop: p.bt ? `0.5px solid ${C.gold}` : "none",
              borderBottom: p.bb ? `0.5px solid ${C.gold}` : "none",
              borderLeft: p.bl ? `0.5px solid ${C.gold}` : "none",
              borderRight: p.br ? `0.5px solid ${C.gold}` : "none",
              opacity: 0.6,
            }} />
          ))}
          <div style={{ width: 44, height: 44, border: `0.5px solid ${C.gold}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: 22, fontFamily: F.body, fontWeight: 300 }}>+</div>
          <div style={{ flex: 1 }}>
            <SC size={8.5} color={C.gold} style={{ marginBottom: 4 }}>Begin a new trip</SC>
            <p style={{ fontFamily: F.display, fontSize: 17, color: C.cream, fontStyle: "italic", fontWeight: 400, lineHeight: 1.25 }}>What's pulling at you?</p>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", marginTop: 4, fontWeight: 300 }}>Spark to invitation in seven steps.</p>
          </div>
          <span style={{ color: C.gold, fontFamily: F.body, fontSize: 18, fontStyle: "italic" }}>→</span>
        </button>
      </div>

      {/* What needs you */}
      <div style={{ padding: "0 22px 28px" }}>
        <SC style={{ marginBottom: 12 }}>Wants your eyes</SC>
        {[
          { sub: "Riviera · Day 4", title: "Sundowners — three votes, time to lock?", who: "Margaux", action: "Lock", color: C.gold },
          { sub: "Biscuit · Return permit", title: "HK import permit — submit by Apr 28", who: "Pet desk", action: "Approve", color: C.blush },
          { sub: "Amalfi · Iris hosting", title: "Iris asked: dates Sept 15–21 work?", who: "From Iris", action: "Reply", color: C.dusk },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px", background: C.card, border: `0.5px solid ${C.border}`, borderLeft: `1.5px solid ${item.color}`, marginBottom: 5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: F.sans, fontSize: 8.5, color: C.stone, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 3 }}>{item.sub}</p>
              <p style={{ fontFamily: F.display, fontSize: 13.5, color: C.cream, fontWeight: 400, lineHeight: 1.3 }}>{item.title}</p>
              <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", marginTop: 3, fontWeight: 300 }}>{item.who}</p>
            </div>
            <Tag color={item.color} size={8}>{item.action}</Tag>
          </div>
        ))}
      </div>

      {/* Concierge nudge */}
      <div onClick={() => go("concierge")} style={{ margin: "0 22px 28px", padding: "16px 16px", border: `0.5px solid ${C.border}`, background: C.card, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
        <Ini letter="M" color={C.blush} s={36} />
        <div style={{ flex: 1 }}>
          <SC size={8.5} color={C.stone} style={{ marginBottom: 4 }}>Margaux · Concierge</SC>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.cream, fontStyle: "italic", lineHeight: 1.4, fontWeight: 300 }}>
            "I've held Mira for the sound bath. Your move."
          </p>
        </div>
        <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone }}>2m</p>
      </div>

      {/* Trips strip — past + future */}
      <div style={{ padding: "0 22px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SC>Your Year</SC>
          <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone }}>{TRIPS.length} trips</p>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginRight: -22 }}>
          {[...upcoming, ...past].map(t => (
            <div key={t.id} onClick={() => { setTrip(t.id); go("trip"); }} style={{ minWidth: 180, cursor: "pointer", border: `0.5px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ height: 100, background: t.coverGrad, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(10,9,8,0.7) 100%)" }} />
                <div style={{ position: "absolute", top: 8, left: 10 }}>
                  <SC size={7.5} color={C.cream} style={{ letterSpacing: 1.8 }}>
                    {t.status === "drafting" ? "Drafting" : t.status === "past" ? "Past" : "Active"}
                  </SC>
                </div>
              </div>
              <div style={{ padding: "12px 12px 14px", background: C.card }}>
                <p style={{ fontFamily: F.display, fontSize: 13, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.3 }}>{t.title}</p>
                <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginTop: 4 }}>{t.dates}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice memory teaser */}
      <div onClick={() => go("memory")} style={{ margin: "0 22px 32px", padding: "18px 16px", border: `0.5px solid ${C.border}`, cursor: "pointer", background: `linear-gradient(180deg, ${C.card} 0%, ${C.bg} 100%)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <SC>The Memory Ledger</SC>
          <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone }}>{VOICE_NOTES.length} voices</p>
        </div>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.cream, fontStyle: "italic", lineHeight: 1.6, fontWeight: 300 }}>
          "{VOICE_NOTES[3].quote}"
        </p>
        <p style={{ fontFamily: F.sans, fontSize: 9.5, color: C.stone, marginTop: 8, letterSpacing: 1.5 }}>
          — {VOICE_NOTES[3].who}, Kyoto · Mar 30
        </p>
      </div>
    </div>
  );
}

// ─── TRIP DETAIL ─────────────────────────────────────────
function TripDetail({ tripId, go, plan, setPlan, dynamicTrips = [] }) {
  const trip = [...dynamicTrips, ...TRIPS].find(t => t.id === tripId) || TRIPS[0];
  const [tab, setTab] = useState("itinerary");
  const [expanded, setExpanded] = useState(null);

  // Use trip-specific events if defined, otherwise the editable Riviera plan
  const tripPlan = trip.events || plan;
  const isEditable = !trip.events;

  const vote = (di, eid) => {
    if (!isEditable) return;
    setPlan(p => p.map((day, i) => i !== di ? day : { ...day, events: day.events.map(ev => {
      if (ev.id !== eid) return ev;
      const v = { ...ev.votes }; v.chloe ? delete v.chloe : v.chloe = 1;
      return { ...ev, votes: v };
    })}));
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 90 }}>
      {/* Cover hero */}
      <div style={{ height: 220, background: trip.coverGrad, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,9,8,0.4) 0%, transparent 30%, rgba(10,9,8,0.95) 100%)" }} />
        <button onClick={() => go("home")} style={{ position: "absolute", top: 56, left: 20, background: "rgba(10,9,8,0.5)", border: `0.5px solid ${C.border}`, color: C.cream, padding: "6px 12px", fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", backdropFilter: "blur(6px)" }}>← Home</button>
        <div style={{ position: "absolute", top: 56, right: 20, display: "flex", gap: 4 }}>
          {trip.guests && trip.guests.map(id => {
            const g = CIRCLE.find(c => c.id === id);
            return g ? <Ini key={id} letter={g.initial} s={22} /> : null;
          })}
          <PetTag s={22} />
        </div>
        <div style={{ position: "absolute", bottom: 18, left: 22, right: 22 }}>
          <SC size={9} color={C.cream} style={{ letterSpacing: 2.4, marginBottom: 6 }}>{trip.sub}</SC>
          <h1 style={{ fontFamily: F.display, fontSize: 30, color: C.cream, fontWeight: 400, fontStyle: "italic", lineHeight: 1.1 }}>{trip.title}</h1>
          <p style={{ fontFamily: F.mono, fontSize: 10, color: C.cream, opacity: 0.85, marginTop: 8 }}>{trip.dates}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `0.5px solid ${C.border}`, background: C.bg, position: "sticky", top: 0, zIndex: 5 }}>
        {[
          { id: "itinerary", l: "Itinerary" },
          { id: "pet", l: "Biscuit" },
          { id: "guests", l: "Guests" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "14px 0", background: "none", border: "none", borderBottom: tab === t.id ? `1px solid ${C.gold}` : "1px solid transparent",
            fontFamily: F.sans, fontSize: 9.5, letterSpacing: 2.5, textTransform: "uppercase", color: tab === t.id ? C.gold : C.stone, cursor: "pointer",
          }}>{t.l}</button>
        ))}
      </div>

      {tab === "itinerary" && trip.drafting && (
        <div style={{ padding: "32px 22px" }}>
          {/* Consensus banner */}
          <div style={{ marginBottom: 18, padding: "16px 16px", border: `0.5px solid ${C.gold}40`, background: `${C.gold}06`, borderLeft: `1.5px solid ${C.gold}` }}>
            <SC color={C.gold} size={8.5}>Locked from the circle</SC>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.cream, fontStyle: "italic", lineHeight: 1.55, marginTop: 8, fontWeight: 300 }}>
              "{trip.consensus?.dream}"
            </p>
            {trip.consensus?.vibes && (
              <div style={{ marginTop: 10, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {trip.consensus.vibes.map(v => <Tag key={v} filled color={C.gold} size={8}>{v}</Tag>)}
              </div>
            )}
          </div>

          {/* Drafting state */}
          <div style={{ padding: "32px 22px", border: `0.5px solid ${C.border}`, background: C.card, textAlign: "center" }}>
            <div style={{ display: "inline-flex", marginBottom: 16 }}>
              <Ini letter="M" color={C.blush} s={48} />
            </div>
            <SC color={C.blush}>Margaux · Concierge</SC>
            <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 12, lineHeight: 1.25 }}>
              Drafting your week
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.6, marginTop: 12, fontWeight: 300 }}>
              "I'll have a first pass for you in 48 hours — villa options, the chef I'm thinking of, the boat day. The rest we'll shape together."
            </p>
            <Rule w="40px" m="20px auto" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left", maxWidth: 280, margin: "0 auto" }}>
              {[
                { l: "Scoping villas", s: "3–5 properties matching the vibe" },
                { l: "Holding key tables", s: "Best restaurants in the window" },
                { l: "Booking your private chef", s: "Two referrals already in hand" },
                { l: "Pet logistics", s: trip.pets?.length ? "Biscuit's papers begin tomorrow" : "—" },
                { l: "Drafting day-by-day", s: "Built around the consensus" },
              ].filter(i => i.s !== "—").map((i, ix) => (
                <div key={ix} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                  <Dot color={C.gold} s={4} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: F.display, fontSize: 13, color: C.cream, fontWeight: 500 }}>{i.l}</p>
                    <p style={{ fontFamily: F.body, fontSize: 11, color: C.stone, fontStyle: "italic", marginTop: 1, fontWeight: 300 }}>{i.s}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginTop: 18, letterSpacing: 1 }}>EST. READY · 48H</p>
          </div>

          {/* Guest list preview */}
          <div style={{ marginTop: 18 }}>
            <SC style={{ marginBottom: 10 }}>The Circle · {trip.guests?.length || 0}</SC>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {trip.guests?.map(id => {
                const g = CIRCLE.find(c => c.id === id);
                if (!g) return null;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `0.5px solid ${C.border}`, background: C.card }}>
                    <Ini letter={g.initial} s={22} />
                    <span style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontWeight: 300 }}>{g.name}</span>
                  </div>
                );
              })}
              {trip.pets?.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: `0.5px solid ${C.border}`, background: C.card }}>
                  <PetTag s={22} />
                  <span style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontWeight: 300 }}>Biscuit</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "itinerary" && !trip.drafting && (
        <div style={{ padding: "24px 18px" }}>
          {trip.status === "past" && (
            <div style={{ marginBottom: 22, padding: "14px 14px", border: `0.5px solid ${C.border}`, background: C.card, borderLeft: `1.5px solid ${C.dusk}` }}>
              <SC color={C.dusk} size={8.5}>Memory · {trip.title}</SC>
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.cream, fontStyle: "italic", lineHeight: 1.55, marginTop: 6, fontWeight: 300 }}>"{trip.note}"</p>
            </div>
          )}
          {tripPlan.map((day, di) => (
            <div key={day.day} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12, paddingBottom: 10, borderBottom: `0.5px solid ${C.border}` }}>
                <span style={{ fontFamily: F.display, fontSize: 36, fontWeight: 300, color: C.gold, lineHeight: 1, opacity: 0.25 }}>{String(day.day).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: F.display, fontSize: 17, color: C.cream, fontWeight: 500 }}>{day.title}</h2>
                  <SC color={C.stone} size={8.5}>{day.theme} · {day.date}</SC>
                </div>
              </div>

              {day.events.map(ev => {
                const open = expanded === ev.id;
                const vc = Object.keys(ev.votes).length;
                const voted = !!ev.votes.chloe;
                return (
                  <div key={ev.id} onClick={() => setExpanded(open ? null : ev.id)} style={{
                    background: ev.locked ? `${C.gold}05` : C.card,
                    border: `0.5px solid ${ev.locked ? C.goldMuted + "30" : C.border}`,
                    padding: "13px 14px", marginBottom: 4, cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.stone, minWidth: 32 }}>{ev.time}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <p style={{ fontFamily: F.display, fontSize: 14, color: C.cream, fontWeight: 500 }}>{ev.title}</p>
                              {ev.pet && <PetTag s={14} />}
                            </div>
                            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontWeight: 300, fontStyle: "italic", marginTop: 1 }}>{ev.sub}</p>
                          </div>
                        </div>
                        {ev.locked && <div style={{ marginTop: 7 }}><Tag filled color={C.sage} size={8}>Confirmed</Tag></div>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); vote(di, ev.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", border: `0.5px solid ${voted ? C.gold : C.stone + "30"}`, background: voted ? C.gold : "transparent", boxShadow: voted ? `0 0 6px ${C.gold}40` : "none" }} />
                      </button>
                    </div>

                    {open && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${C.border}` }}>
                        <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, lineHeight: 1.7, fontWeight: 300 }}>{ev.detail}</p>

                        <div style={{ marginTop: 10, padding: "9px 12px", background: `${C.gold}05`, borderLeft: `1.5px solid ${C.goldMuted}` }}>
                          <SC color={C.goldMuted} size={8} style={{ marginBottom: 3 }}>Dress</SC>
                          <p style={{ fontFamily: F.body, fontSize: 12.5, color: C.cream, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300 }}>{ev.dress}</p>
                        </div>

                        {vc > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                            <Dot color={C.gold} />
                            <span style={{ fontFamily: F.sans, fontSize: 9.5, color: C.stone }}>{vc}</span>
                            <div style={{ display: "flex", gap: 2 }}>
                              {Object.keys(ev.votes).map(uid => {
                                const g = CIRCLE.find(x => x.id === uid);
                                return g ? <Ini key={uid} letter={g.initial} s={15} color={C.stone} /> : null;
                              })}
                            </div>
                          </div>
                        )}

                        {ev.alts && (
                          <div style={{ marginTop: 12 }}>
                            <SC color={C.stone} size={8} style={{ marginBottom: 6 }}>Or instead</SC>
                            {ev.alts.map(a => (
                              <div key={a.id} style={{ padding: "9px 12px", marginBottom: 3, border: `0.5px solid ${C.border}` }}>
                                <p style={{ fontFamily: F.display, fontSize: 12.5, color: C.cream, fontWeight: 400 }}>{a.title}</p>
                                <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, marginTop: 3, fontWeight: 300 }}>{a.detail}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {tab === "pet" && <PetTab />}
      {tab === "guests" && <GuestsTab trip={trip} />}
    </div>
  );
}

// ─── PET TAB ──────────────────────────────────────────────
function PetTab() {
  const done = PET_TASKS.filter(t => t.status === "done").length;
  return (
    <div style={{ padding: "24px 18px" }}>
      {/* Biscuit profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <PetTag s={56} />
        <div>
          <SC size={8.5} color={C.stone}>Travelling with you</SC>
          <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 2 }}>Biscuit</h2>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontWeight: 300 }}>Pomeranian · 3.2kg · Cabin-eligible</p>
        </div>
      </div>

      <div style={{ padding: "14px 14px", background: C.card, border: `0.5px solid ${C.border}`, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <SC size={8.5}>Travel readiness</SC>
          <p style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, marginTop: 2 }}>{done} of {PET_TASKS.length} <span style={{ fontStyle: "italic", color: C.gold }}>cleared</span></p>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `1px solid ${C.border}`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="24" cy="24" r="20" stroke={C.border} strokeWidth="2" fill="none" />
            <circle cx="24" cy="24" r="20" stroke={C.gold} strokeWidth="2" fill="none" strokeDasharray={`${(done/PET_TASKS.length) * 125.6} 125.6`} />
          </svg>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.gold }}>{Math.round(done/PET_TASKS.length*100)}%</span>
        </div>
      </div>

      <SC style={{ marginBottom: 12 }}>Checklist</SC>
      {PET_TASKS.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px", background: t.status === "done" ? "transparent" : C.card, border: `0.5px solid ${C.border}`, marginBottom: 4 }}>
          <div style={{ marginTop: 4 }}><Status kind={t.status} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: F.display, fontSize: 13, color: C.cream, fontWeight: 400 }}>{t.title}</p>
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.stone, fontWeight: 300, fontStyle: "italic", marginTop: 1 }}>{t.sub}</p>
            {t.who && <p style={{ fontFamily: F.sans, fontSize: 8.5, color: C.goldMuted, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>handled by {t.who}</p>}
          </div>
          {t.due && <Tag color={C.stone} size={8}>{t.due}</Tag>}
        </div>
      ))}

      <div style={{ marginTop: 20, padding: "16px 14px", border: `0.5px solid ${C.border}`, background: `${C.blush}05`, borderLeft: `1.5px solid ${C.blush}` }}>
        <SC color={C.blush} size={8.5}>Margaux's note</SC>
        <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", lineHeight: 1.6, fontWeight: 300, marginTop: 6 }}>
          "Élise — your sitter — has met three Poms before. She's bringing her own carrier in case Biscuit prefers his own scent during the boat day."
        </p>
      </div>
    </div>
  );
}

// ─── GUESTS TAB ───────────────────────────────────────────
function GuestsTab({ trip }) {
  const guests = trip.guests ? trip.guests.map(id => CIRCLE.find(c => c.id === id)).filter(Boolean) : [];
  const responses = {
    chloe: { vibes: ["Indulge", "Celebrate"], wild: "I want one night nobody photographs.", dates: "May 10–20", color: C.gold },
    sophia: { vibes: ["Restore", "Adventure"], wild: "Sunrise from the water with just us four.", dates: "Flexible", color: C.sage },
    aria: { vibes: ["Indulge", "Explore"], wild: "A vineyard where the rosé tastes like the place.", dates: "May 10–20", color: C.blush },
    noor: { vibes: ["Celebrate", "Escape"], wild: "Somewhere I can wear the silver dress.", dates: "May 12–18", color: C.dusk },
  };

  return (
    <div style={{ padding: "24px 18px" }}>
      <SC style={{ marginBottom: 14 }}>Four voices</SC>
      {guests.map(g => {
        const r = responses[g.id];
        if (!r) return null;
        return (
          <div key={g.id} style={{ padding: "16px 16px", background: C.card, border: `0.5px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Ini letter={g.initial} s={32} color={r.color} />
              <div>
                <p style={{ fontFamily: F.display, fontSize: 16, color: C.cream, fontWeight: 500 }}>{g.name}</p>
                <p style={{ fontFamily: F.sans, fontSize: 9.5, color: C.stone, letterSpacing: 1.5 }}>{g.city.toUpperCase()} · {r.dates}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              {r.vibes.map(v => <Tag key={v} color={r.color} size={8.5}>{v}</Tag>)}
            </div>
            <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", lineHeight: 1.5, fontWeight: 300 }}>"{r.wild}"</p>
          </div>
        );
      })}

      {/* Consensus */}
      <div style={{ marginTop: 16, padding: "16px 14px", border: `0.5px solid ${C.gold}40`, background: `${C.gold}05` }}>
        <SC>Consensus</SC>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.cream, fontStyle: "italic", lineHeight: 1.7, marginTop: 8, fontWeight: 300 }}>
          The shape: <span style={{ color: C.gold }}>indulgent evenings, slow mornings, one big adventure on the water.</span> Everyone's open May 12–17. Rosé runs through the trip.
        </p>
      </div>
    </div>
  );
}

window.SCREENS_A = { Home, TripDetail };
