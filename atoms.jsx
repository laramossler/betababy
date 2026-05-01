// ─── REUSABLE ATOMS ────────────────────────────────────────
const { C, F } = window.LEDGER;

const Mono = ({ s = 28 }) => (
  <div style={{ width: s, height: s, border: `0.5px solid ${C.goldMuted}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: s * 0.38, color: C.gold, letterSpacing: 1.5, flexShrink: 0 }}>L</div>
);

const Rule = ({ w = "48px", m = "24px auto", c = C.goldMuted }) => (
  <div style={{ width: w, height: "0.5px", margin: m, background: `linear-gradient(90deg, transparent, ${c}, transparent)` }} />
);

const SC = ({ children, color = C.gold, style = {}, size = 9.5 }) => (
  <p style={{ fontFamily: F.sans, fontSize: size, letterSpacing: 3.2, textTransform: "uppercase", color, fontWeight: 400, ...style }}>{children}</p>
);

const Tag = ({ children, color = C.gold, filled = false, size = 9 }) => (
  <span style={{ display: "inline-block", padding: "3px 9px", fontSize: size, fontFamily: F.sans, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase", border: `0.5px solid ${color}`, color: filled ? C.bg : color, background: filled ? color : "transparent", lineHeight: 1.4 }}>{children}</span>
);

const Ini = ({ letter, color = C.gold, s = 22, filled = false }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", border: `0.5px solid ${color}50`, background: filled ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontSize: s * 0.38, color: filled ? C.bg : color, flexShrink: 0 }}>{letter}</div>
);

const Btn = ({ children, onClick, primary = true, full = false, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      padding: "13px 22px",
      background: primary ? C.gold : "transparent",
      border: primary ? "none" : `0.5px solid ${C.borderLight}`,
      fontFamily: F.sans, fontSize: 9.5, letterSpacing: 3, textTransform: "uppercase",
      color: primary ? C.bg : C.creamSoft, cursor: "pointer",
      width: full ? "100%" : "auto",
      transition: "all 0.2s",
      ...style,
    }}
  >{children}</button>
);

// Subtle striped placeholder for imagery (per design rules)
const Imagery = ({ h = 140, label = "imagery", grad = null, dark = false }) => (
  <div style={{
    height: h,
    background: grad || `repeating-linear-gradient(135deg, ${dark ? "#0F0E0D" : "#1A1917"} 0 8px, ${dark ? "#0A0908" : "#151413"} 8px 16px)`,
    border: `0.5px solid ${C.border}`,
    position: "relative",
    overflow: "hidden",
  }}>
    {!grad && (
      <p style={{ position: "absolute", bottom: 8, left: 10, fontFamily: F.mono, fontSize: 8, color: C.stone, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</p>
    )}
  </div>
);

const Dot = ({ color = C.gold, s = 5, glow = false }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: glow ? `0 0 6px ${color}55` : "none" }} />
);

// Status indicator
const Status = ({ kind }) => {
  const map = {
    done: { color: C.sage, label: "✓" },
    ready: { color: C.gold, label: "○" },
    pending: { color: C.stone, label: "·" },
    none: { color: C.red, label: "·" },
  };
  const m = map[kind] || map.pending;
  return <Dot color={m.color} s={6} glow={kind === "done" || kind === "ready"} />;
};

const Divider = ({ m = "16px 0" }) => (
  <div style={{ height: "0.5px", background: C.border, margin: m }} />
);

// Minimal monogram for sections (e.g. dog tag)
const PetTag = ({ s = 22 }) => (
  <div style={{ width: s, height: s, borderRadius: "50%", border: `0.5px solid ${C.blush}50`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: s * 0.36, color: C.blush, fontStyle: "italic", flexShrink: 0 }}>B</div>
);

window.ATOMS = { Mono, Rule, SC, Tag, Ini, Btn, Imagery, Dot, Status, Divider, PetTag };
