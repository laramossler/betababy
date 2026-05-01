// ─── SCREENS B — Concierge, Black Book, Memory, Gatherings ──
const { C, F, ME, CONCIERGE, CIRCLE, BLACK_BOOK, VOICE_NOTES, CONCIERGE_THREAD, GATHERINGS } = window.LEDGER;
const { Mono, Rule, SC, Tag, Ini, Btn, Imagery, Dot, Divider, PetTag } = window.ATOMS;
const { useState, useEffect, useRef } = React;

// ─── CONCIERGE ────────────────────────────────────────────
function Concierge({ go }) {
  const [thread, setThread] = useState(CONCIERGE_THREAD);
  const [draft, setDraft] = useState("");
  const endRef = useRef();
  useEffect(() => { endRef.current?.scrollTo?.({ top: 9999 }); }, [thread]);

  const send = () => {
    if (!draft.trim()) return;
    const next = [...thread, { from: "me", time: "Just now", body: draft }];
    setThread(next);
    setDraft("");
    setTimeout(() => {
      setThread(t => [...t, { from: "margaux", time: "Just now", body: "Noted. Looking into it now — I'll come back within the hour." }]);
    }, 1400);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100%", display: "flex", flexDirection: "column", paddingBottom: 90 }}>
      <div style={{ padding: "56px 22px 18px", borderBottom: `0.5px solid ${C.border}` }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 14 }}>← Home</button>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Ini letter="M" color={C.blush} s={48} />
          <div>
            <SC size={8.5} color={C.stone}>Your concierge</SC>
            <h1 style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 2 }}>Margaux</h1>
            <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontWeight: 300, marginTop: 2 }}>Paris · 08:00 — 23:00 CET · <span style={{ color: C.sage }}>● online</span></p>
          </div>
        </div>
      </div>

      {/* Bio card */}
      <div style={{ margin: "20px 22px 14px", padding: "16px 16px", background: C.card, border: `0.5px solid ${C.border}` }}>
        <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.7, fontWeight: 300 }}>
          "I work with twelve members. I know the chef at Le Doyenné, the harbor master in Antibes, and which villa in Cap-Ferrat keeps a piano in tune. Tell me what you want."
        </p>
      </div>

      {/* Thread */}
      <div ref={endRef} style={{ flex: 1, padding: "8px 22px 16px", overflowY: "auto" }}>
        {thread.map((m, i) => {
          const mine = m.from === "me";
          return (
            <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ maxWidth: "78%" }}>
                <p style={{ fontFamily: F.mono, fontSize: 8, color: C.stone, marginBottom: 4, textAlign: mine ? "right" : "left" }}>{mine ? "You" : "Margaux"} · {m.time}</p>
                <div style={{
                  padding: "10px 13px",
                  background: mine ? `${C.gold}12` : C.card,
                  border: `0.5px solid ${mine ? C.goldMuted + "40" : C.border}`,
                  fontFamily: F.body, fontSize: 14, color: C.cream, lineHeight: 1.55, fontWeight: 300,
                }}>{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 6, padding: "0 22px 12px", flexWrap: "wrap" }}>
        {["Book a table", "Hold a villa", "Pet logistics", "Find a stylist"].map(q => (
          <button key={q} onClick={() => setDraft(q + ": ")} style={{ padding: "7px 12px", border: `0.5px solid ${C.border}`, background: "transparent", color: C.creamSoft, fontFamily: F.sans, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>{q}</button>
        ))}
      </div>

      {/* Composer */}
      <div style={{ padding: "10px 18px 18px", borderTop: `0.5px solid ${C.border}`, background: C.bgSoft, display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Tell Margaux..."
          style={{ flex: 1, background: C.card, border: `0.5px solid ${C.border}`, padding: "11px 14px", fontFamily: F.body, fontSize: 14, color: C.cream, outline: "none", fontWeight: 300 }}
        />
        <button onClick={send} style={{ padding: "11px 18px", background: C.gold, border: "none", fontFamily: F.sans, fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: C.bg, cursor: "pointer" }}>Send</button>
      </div>
    </div>
  );
}

// ─── BLACK BOOK ───────────────────────────────────────────
function BlackBook({ go }) {
  const [filter, setFilter] = useState("all");
  const types = ["all", ...new Set(BLACK_BOOK.map(b => b.type))];
  const list = filter === "all" ? BLACK_BOOK : BLACK_BOOK.filter(b => b.type === filter);

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 90 }}>
      <div style={{ padding: "56px 22px 24px" }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 18 }}>← Home</button>
        <SC>The Little Black Book</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 28, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 6, lineHeight: 1.15 }}>People & places<br/>worth keeping</h1>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontWeight: 300, marginTop: 12, lineHeight: 1.6 }}>
          A private record of who knows you, where you've been welcomed, and what made it worth returning.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, padding: "0 22px 18px", overflowX: "auto" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "7px 14px", border: `0.5px solid ${filter === t ? C.gold : C.border}`, background: filter === t ? `${C.gold}12` : "transparent", color: filter === t ? C.gold : C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" }}>{t}</button>
        ))}
      </div>

      {/* Entries */}
      <div style={{ padding: "0 22px" }}>
        {list.map((b, i) => (
          <div key={b.id} style={{ display: "flex", padding: "16px 0", borderBottom: i < list.length - 1 ? `0.5px solid ${C.border}` : "none", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 4, height: 56, background: b.color, flexShrink: 0, marginTop: 6 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <h3 style={{ fontFamily: F.display, fontSize: 17, color: C.cream, fontWeight: 500 }}>{b.name}</h3>
                <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, flexShrink: 0 }}>{b.lastSeen}</p>
              </div>
              <p style={{ fontFamily: F.sans, fontSize: 9, color: b.color, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 3 }}>{b.type} · {b.city}</p>
              <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.6, fontWeight: 300, marginTop: 8 }}>"{b.note}"</p>
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {Array.from({ length: b.visited }).map((_, j) => <Dot key={j} color={C.goldMuted} s={4} />)}
                <span style={{ fontFamily: F.mono, fontSize: 9, color: C.stone, marginLeft: 4 }}>×{b.visited}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MEMORY LEDGER (voice notes) ──────────────────────────
function Memory({ go }) {
  const [playing, setPlaying] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    setProgress(0);
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 2), 80);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 90 }}>
      <div style={{ padding: "56px 22px 24px" }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 18 }}>← Home</button>
        <SC>The Memory Ledger</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 28, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 6, lineHeight: 1.15 }}>The voices you<br/>kept this year</h1>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontWeight: 300, marginTop: 12, lineHeight: 1.6 }}>
          One-tap voice notes from each trip — ambient, intimate, never published. Becomes the first chapter of next season's podcast.
        </p>
      </div>

      <div style={{ padding: "0 22px" }}>
        {VOICE_NOTES.map(v => {
          const isPlaying = playing === v.id;
          return (
            <div key={v.id} style={{ marginBottom: 14, padding: "16px 16px", background: C.card, border: `0.5px solid ${isPlaying ? v.color + "60" : C.border}`, borderLeft: `2px solid ${v.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <SC size={8.5} color={v.color}>{v.trip} · {v.date}</SC>
                <p style={{ fontFamily: F.mono, fontSize: 9, color: C.stone }}>{v.duration}</p>
              </div>
              <p style={{ fontFamily: F.body, fontSize: 17, color: C.cream, fontStyle: "italic", lineHeight: 1.55, fontWeight: 300 }}>"{v.quote}"</p>
              {v.who && <p style={{ fontFamily: F.sans, fontSize: 10, color: C.stone, letterSpacing: 1.5, marginTop: 8, textTransform: "uppercase" }}>— {v.who}</p>}

              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setPlaying(isPlaying ? null : v.id)} style={{ width: 32, height: 32, borderRadius: "50%", border: `0.5px solid ${v.color}`, background: isPlaying ? v.color : "transparent", color: isPlaying ? C.bg : v.color, cursor: "pointer", fontFamily: F.sans, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isPlaying ? "❚❚" : "▸"}
                </button>
                <div style={{ flex: 1, height: 2, background: C.border, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${isPlaying ? progress : 0}%`, background: v.color, transition: "width 0.08s linear" }} />
                </div>
                <button style={{ background: "none", border: `0.5px solid ${C.border}`, padding: "5px 10px", color: C.stone, fontFamily: F.sans, fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>Transcribe</button>
              </div>
            </div>
          );
        })}

        {/* Compose new */}
        <div style={{ marginTop: 8, padding: "20px 16px", border: `0.5px dashed ${C.border}`, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, margin: "0 auto", borderRadius: "50%", border: `0.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: 16 }}>●</div>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.cream, fontStyle: "italic", marginTop: 12, fontWeight: 300 }}>Hold to capture a thought</p>
          <p style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>One tap from the lock screen</p>
        </div>
      </div>
    </div>
  );
}

// ─── GATHERINGS (the future arc — host experiences) ──────
function Gatherings({ go }) {
  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 90 }}>
      <div style={{ padding: "56px 22px 24px" }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", color: C.stone, fontFamily: F.sans, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 18 }}>← Home</button>
        <SC>Gatherings</SC>
        <h1 style={{ fontFamily: F.display, fontSize: 28, color: C.cream, fontWeight: 400, fontStyle: "italic", marginTop: 6, lineHeight: 1.15 }}>Host the room you've<br/>always wanted in</h1>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.creamSoft, fontWeight: 300, marginTop: 12, lineHeight: 1.65 }}>
          A salon, a long table, a closed-door listening session. The Ledger handles invitations, dietary holds, the seating chart, and the after-card.
        </p>
      </div>

      {/* Drafting */}
      {GATHERINGS.map(g => (
        <div key={g.id} style={{ margin: "0 22px 20px", border: `0.5px solid ${C.border}` }}>
          <div style={{ height: 140, background: `linear-gradient(135deg, ${C.bg} 0%, #2A2520 50%, ${C.gold} 130%)`, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(10,9,8,0.85) 100%)" }} />
            <div style={{ position: "absolute", top: 12, left: 14 }}>
              <Tag color={C.gold} size={8}>Drafting</Tag>
            </div>
            <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.cream, opacity: 0.85, fontStyle: "italic", fontWeight: 300 }}>{g.sub}</p>
              <h2 style={{ fontFamily: F.display, fontSize: 22, color: C.cream, fontWeight: 400, fontStyle: "italic" }}>{g.title}</h2>
            </div>
          </div>
          <div style={{ padding: "14px 16px 16px", background: C.card }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontFamily: F.mono, fontSize: 10, color: C.creamSoft }}>{g.when}</p>
              <p style={{ fontFamily: F.mono, fontSize: 10, color: C.stone }}>{g.where}</p>
            </div>
            <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.creamSoft, fontStyle: "italic", lineHeight: 1.6, fontWeight: 300 }}>"{g.desc}"</p>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `0.5px solid ${C.border}` }}>
              <div>
                <p style={{ fontFamily: F.display, fontSize: 18, color: C.cream, fontWeight: 400 }}>{g.rsvp}<span style={{ color: C.stone, fontSize: 14 }}> / {g.capacity}</span></p>
                <SC size={8} color={C.stone}>Confirmed</SC>
              </div>
              <Btn primary={false}>Continue planning</Btn>
            </div>
          </div>
        </div>
      ))}

      {/* Templates */}
      <div style={{ padding: "8px 22px 8px" }}>
        <SC style={{ marginBottom: 14 }}>Start a new gathering</SC>
        {[
          { title: "Salon supper", sub: "8–14 guests · long table · one topic", color: C.gold },
          { title: "Listening session", sub: "20 guests · vinyl, candles, silence between tracks", color: C.dusk },
          { title: "Closed-door tasting", sub: "6–10 guests · winemaker, sommelier, no phones", color: C.blush },
          { title: "Salon residency", sub: "Three nights, same flat, rotating guests", color: C.sage },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px", border: `0.5px solid ${C.border}`, marginBottom: 5, cursor: "pointer", background: C.card }}>
            <div style={{ width: 4, height: 36, background: t.color }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: F.display, fontSize: 14.5, color: C.cream, fontWeight: 500 }}>{t.title}</p>
              <p style={{ fontFamily: F.body, fontSize: 12, color: C.stone, fontStyle: "italic", marginTop: 2, fontWeight: 300 }}>{t.sub}</p>
            </div>
            <span style={{ color: C.stone, fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

window.SCREENS_B = { Concierge, BlackBook, Memory, Gatherings };
