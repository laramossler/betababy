// ─── REDESIGN SHARED ─────────────────────────────────────
// Cross-phase primitives for the Woven first sitting:
//   NoteToLara · PhaseIndicator · RestartBar
//   MargauxAvatar · LaraAvatar
//   Waveform · RomeMap
//   useTypewriter · usePressHoldMic
//
// Everything renders pixel-decisions straight from the handoff README.

const { C: SC_C, F: SC_F } = window.LEDGER;
const { SC: SC_SC, Mono: SC_Mono, Btn: SC_Btn } = window.ATOMS;
const { useState: rUseState, useEffect: rUseEffect, useRef: rUseRef, useCallback: rUseCallback } = React;

// ─── Avatars ──────────────────────────────────────────────
function MargauxAvatar({ s = 80, speaking = false }) {
  return (
    <div style={{
      width: s, height: s, borderRadius: "50%",
      border: `0.5px solid ${SC_C.blush}80`,
      background: `radial-gradient(circle at 35% 30%, ${SC_C.blush}40, ${SC_C.blush}10 60%, transparent 80%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", flexShrink: 0,
      boxShadow: speaking ? `0 0 ${s * 0.4}px ${SC_C.blush}30, 0 0 ${s * 0.2}px ${SC_C.blush}55` : "none",
      transition: "box-shadow 0.4s ease",
    }}>
      <div style={{ position: "absolute", inset: s * 0.08, borderRadius: "50%", border: `0.5px dashed ${SC_C.blush}40` }} />
      <span style={{ fontFamily: SC_F.display, fontSize: s * 0.42, color: SC_C.blush, fontStyle: "italic", fontWeight: 300 }}>M</span>
    </div>
  );
}

function LaraAvatar({ s = 48 }) {
  return (
    <div style={{
      width: s, height: s, borderRadius: "50%",
      border: `0.5px solid ${SC_C.gold}80`,
      background: `radial-gradient(circle at 35% 30%, ${SC_C.gold}30, ${SC_C.gold}10 60%, transparent 80%)`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ fontFamily: SC_F.display, fontSize: s * 0.4, color: SC_C.gold, fontStyle: "italic" }}>L</span>
    </div>
  );
}

// ─── Waveform ─────────────────────────────────────────────
function Waveform({ active = false, bars = 27, color = SC_C.blush, h = 36 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, height: h, opacity: active ? 1 : 0.4, transition: "opacity 0.6s ease" }}>
      {Array.from({ length: bars }).map((_, i) => {
        const base = Math.abs(Math.sin((i + 1) * 1.7)) * (h * 0.55) + h * 0.15;
        return <div key={i} style={{
          width: 2,
          height: active ? base : base * 0.4,
          background: color,
          transition: "height 0.3s",
          animation: active ? `wpulse ${0.9 + (i % 5) * 0.25}s ease-in-out ${i * 0.04}s infinite` : "none",
        }} />;
      })}
      <style>{`@keyframes wpulse { 0%,100% { transform: scaleY(0.4) } 50% { transform: scaleY(1.1) } }`}</style>
    </div>
  );
}

// ─── Typewriter hook ──────────────────────────────────────
function useTypewriter(text, speed = 22, onDone) {
  const [out, setOut] = rUseState("");
  const [done, setDone] = rUseState(false);
  rUseEffect(() => {
    setOut("");
    setDone(false);
    if (!text) { setDone(true); onDone && onDone(); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
        onDone && onDone();
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { out, done };
}

// ─── Press-hold mic with real getUserMedia ────────────────
// onCapture({durationMs, blob, url}) fires on release if held >400ms.
// Falls back to time-only capture if mic permission is unavailable.
function usePressHoldMic({ minHoldMs = 400, onCapture } = {}) {
  const startRef = rUseRef(0);
  const tickRef = rUseRef(null);
  const streamRef = rUseRef(null);
  const recRef = rUseRef(null);
  const chunksRef = rUseRef([]);
  const abortRef = rUseRef(false);
  const [heldMs, setHeldMs] = rUseState(0);
  const [recording, setRecording] = rUseState(false);
  const [unavailable, setUnavailable] = rUseState(false);

  const start = rUseCallback(async () => {
    abortRef.current = false;
    startRef.current = performance.now();
    setHeldMs(0);
    setRecording(true);
    tickRef.current = setInterval(() => {
      setHeldMs(performance.now() - startRef.current);
    }, 33);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // User may have released before permission resolved
      if (abortRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start();
    } catch (e) {
      setUnavailable(true);
    }
  }, []);

  const stop = rUseCallback(() => {
    const duration = performance.now() - startRef.current;
    abortRef.current = true;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setRecording(false);
    setHeldMs(0);
    const finalise = (blob, url) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      recRef.current = null;
      if (duration < minHoldMs) return; // accidental — ignore
      onCapture && onCapture({ durationMs: duration, blob: blob || null, url: url || null });
    };
    const rec = recRef.current;
    if (!rec) { finalise(null, null); return; }
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      finalise(blob, URL.createObjectURL(blob));
    };
    try { rec.stop(); } catch (e) { finalise(null, null); }
  }, [minHoldMs, onCapture]);

  // Clean up if unmounted mid-record
  rUseEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  return { start, stop, heldMs, recording, unavailable };
}

// ─── Phase indicator (3 hairlines, top-center) ────────────
function PhaseIndicator({ phase }) {
  // Map every phase to one of three movements
  const m = phase === "cover" || phase === "incoming" || phase === "declined" || phase === "beat" || phase === "signoff"
    ? 0
    : phase === "letter" || phase === "shortlist"
    ? 1
    : 2;
  return (
    <div style={{
      position: "absolute", top: 14, left: 0, right: 0,
      display: "flex", justifyContent: "center", gap: 5,
      zIndex: 30, pointerEvents: "none",
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 18, height: 1.5,
          background: i === m ? SC_C.gold : SC_C.borderLight,
          transition: "background 0.5s ease",
        }} />
      ))}
    </div>
  );
}

// ─── Note to Lara (floating pencil + bottom sheet) ────────
function NoteToLara() {
  const [open, setOpen] = rUseState(false);
  const [text, setText] = rUseState("");
  const [sent, setSent] = rUseState(false);
  const { start, stop, recording, heldMs, unavailable } = usePressHoldMic({
    minHoldMs: 400,
    onCapture: ({ durationMs, url }) => {
      const ds = (durationMs / 1000).toFixed(1);
      setText(t => (t ? t + " · " : "") + `[voice · ${ds}s${url ? "" : " · no audio"}]`);
    },
  });

  const send = () => {
    if (!text.trim()) return;
    try {
      const key = "ledger.notes-to-lara.v1";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
      existing.push({ at: new Date().toISOString(), body: text.trim() });
      window.localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {}
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setText("");
    }, 1300);
  };

  return (
    <React.Fragment>
      {/* Floating pencil */}
      <button onClick={() => setOpen(true)} aria-label="Note to Lara" style={{
        position: "absolute", top: 64, right: 14, zIndex: 40,
        width: 30, height: 30, borderRadius: "50%",
        background: "rgba(10,9,8,0.45)", backdropFilter: "blur(8px)",
        border: `0.5px solid ${SC_C.goldMuted}`,
        color: SC_C.gold,
        fontFamily: SC_F.display, fontSize: 14, fontStyle: "italic",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        padding: 0, lineHeight: 1,
      }}>✎</button>

      {open && (
        <div style={{ position: "absolute", inset: 0, zIndex: 200, animation: "fadeIn 0.25s ease" }}>
          <div onClick={() => !sent && setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            background: SC_C.bgSoft, borderTop: `0.5px solid ${SC_C.border}`,
            padding: "18px 22px 28px", animation: "rise 0.35s ease",
          }}>
            <div style={{ width: 32, height: 3, background: SC_C.border, margin: "0 auto 14px", borderRadius: 2 }} />

            {sent ? (
              <div style={{ textAlign: "center", padding: "22px 0 14px" }}>
                <p style={{ fontFamily: SC_F.display, fontSize: 18, color: SC_C.gold, fontStyle: "italic" }}>Sent.</p>
                <p style={{ fontFamily: SC_F.body, fontSize: 13.5, color: SC_C.creamSoft, fontStyle: "italic", fontWeight: 300, marginTop: 6 }}>
                  Lara will read this.
                </p>
              </div>
            ) : (
              <React.Fragment>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <LaraAvatar s={32} />
                  <div>
                    <SC_SC color={SC_C.gold} size={8.5}>Note to Lara</SC_SC>
                    <p style={{ fontFamily: SC_F.body, fontSize: 12, color: SC_C.stone, fontStyle: "italic", fontWeight: 300, marginTop: 2 }}>
                      Goes straight to her. Voice or text.
                    </p>
                  </div>
                </div>

                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="What's working. What isn't. The phrase that landed wrong."
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 12px", marginTop: 4,
                    background: SC_C.card, border: `0.5px solid ${SC_C.border}`,
                    fontFamily: SC_F.body, fontSize: 14, color: SC_C.cream, fontStyle: "italic",
                    fontWeight: 300, outline: "none", resize: "none", lineHeight: 1.55,
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <button
                    onMouseDown={start} onMouseUp={stop} onMouseLeave={recording ? stop : undefined}
                    onTouchStart={(e) => { e.preventDefault(); start(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stop(); }}
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: recording ? SC_C.gold : "transparent",
                      border: `0.5px solid ${SC_C.gold}`,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: recording ? `0 0 0 6px ${SC_C.gold}22, 0 0 0 12px ${SC_C.gold}10, 0 0 0 22px ${SC_C.gold}06` : "none",
                      transition: "box-shadow 0.2s",
                    }}
                  >
                    <span style={{ color: recording ? SC_C.bg : SC_C.gold, fontFamily: SC_F.mono, fontSize: 13, fontWeight: 500 }}>●</span>
                  </button>
                  <div style={{ flex: 1 }}>
                    {recording ? (
                      <p style={{ fontFamily: SC_F.mono, fontSize: 10.5, color: SC_C.gold, letterSpacing: 1.4 }}>
                        REC · {(heldMs / 1000).toFixed(1)}s
                      </p>
                    ) : (
                      <p style={{ fontFamily: SC_F.mono, fontSize: 9.5, color: SC_C.stone, letterSpacing: 1.2 }}>
                        {unavailable ? "MIC UNAVAILABLE · TYPE INSTEAD" : "HOLD TO RECORD"}
                      </p>
                    )}
                  </div>
                  <SC_Btn onClick={send} primary={!!text.trim()} style={{ opacity: text.trim() ? 1 : 0.45 }}>
                    Send
                  </SC_Btn>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

// ─── Restart bar (demo only) ──────────────────────────────
function RestartBar({ onRestart }) {
  return (
    <button onClick={onRestart} style={{
      position: "absolute", bottom: 12, right: 12, zIndex: 35,
      background: "rgba(10,9,8,0.45)", backdropFilter: "blur(8px)",
      border: `0.5px solid ${SC_C.border}`,
      color: SC_C.stone, padding: "5px 10px 5px 8px",
      fontFamily: SC_F.sans, fontSize: 8.5, letterSpacing: 2, textTransform: "uppercase",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ fontSize: 12 }}>↺</span> restart
    </button>
  );
}

// ─── Rome map (abstract grid + Tiber curve + dashed roads) ─
// pinsByDay: [{ day, color, pins: [{ x, y, n, label }] }]
function RomeMap({ pinsByDay = [], height = 280, activeDay = null }) {
  const W = 320, H = height;
  return (
    <div style={{ position: "relative", width: "100%", height: H, background: "#0F0D0B", border: `0.5px solid ${SC_C.border}`, overflow: "hidden" }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
        {/* Grid dots */}
        {Array.from({ length: 16 }).map((_, i) =>
          Array.from({ length: 14 }).map((_, j) => (
            <circle key={`g-${i}-${j}`} cx={i * 22 + 8} cy={j * 22 + 8} r={0.6} fill={SC_C.border} />
          ))
        )}
        {/* Tiber curve (hand-drawn-ish bezier through middle) */}
        <path d={`M ${W*0.18} 0 C ${W*0.42} ${H*0.25}, ${W*0.28} ${H*0.55}, ${W*0.46} ${H*0.78} S ${W*0.62} ${H*1.05}, ${W*0.58} ${H}`}
          stroke={SC_C.sea} strokeOpacity="0.35" strokeWidth="2" fill="none" />
        {/* Dashed roads */}
        <line x1="0" y1={H*0.4} x2={W} y2={H*0.46} stroke={SC_C.borderLight} strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1="0" y1={H*0.72} x2={W} y2={H*0.66} stroke={SC_C.borderLight} strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={W*0.35} y1="0" x2={W*0.45} y2={H} stroke={SC_C.borderLight} strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={W*0.78} y1="0" x2={W*0.68} y2={H} stroke={SC_C.borderLight} strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Same-day polylines */}
        {pinsByDay.map((d, di) => {
          if (!d.pins || d.pins.length < 2) return null;
          if (activeDay !== null && activeDay !== d.day) return null;
          const points = d.pins.map(p => `${p.x},${p.y}`).join(" ");
          return <polyline key={`l-${di}`} points={points} fill="none" stroke={d.color} strokeWidth="1" strokeDasharray="4 3" opacity={activeDay === null ? 0.45 : 0.8} />;
        })}

        {/* Pins */}
        {pinsByDay.map((d, di) => {
          if (activeDay !== null && activeDay !== d.day) return null;
          return d.pins.map((p, pi) => (
            <g key={`p-${di}-${pi}`}>
              <circle cx={p.x} cy={p.y} r={9} fill={SC_C.bg} stroke={d.color} strokeWidth="1" />
              <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fill={d.color}>
                {p.n}
              </text>
            </g>
          ));
        })}
      </svg>
    </div>
  );
}

window.WOVEN_SHARED = {
  MargauxAvatar, LaraAvatar, Waveform,
  useTypewriter, usePressHoldMic,
  PhaseIndicator, NoteToLara, RestartBar, RomeMap,
};
