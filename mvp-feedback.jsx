// ─── FEEDBACK SHEET ────────────────────────────────────────
// A bottom sheet over Home — three prompts + lightweight upvotes.

const FEEDBACK = (() => {
const { C, F, Mono, SC, Btn } = window.MVP;
const { useState, useEffect } = React;

const FEATURE_OPTIONS = [
  { id: "margaux", name: "Margaux",        blurb: "Human concierge" },
  { id: "book",    name: "Black Book",     blurb: "Hotels & people" },
  { id: "voice",   name: "Voice memory",   blurb: "Trip voice notes" },
  { id: "gather",  name: "Gatherings",     blurb: "Dinners & salons" },
];

const Chip = ({ active, label, sub, onClick }) => (
  <button onClick={onClick} style={{
    flex: "1 1 calc(50% - 5px)",
    minWidth: 0,
    textAlign: "left",
    padding: "11px 12px",
    border: `0.5px solid ${active ? C.gold : C.border}`,
    background: active ? "#1A1612" : C.bgSoft,
    color: active ? C.gold : C.creamSoft,
    cursor: "pointer",
    transition: "all 0.18s",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
      <span style={{
        width: 12, height: 12, borderRadius: "50%",
        border: `0.5px solid ${active ? C.gold : C.stoneSoft}`,
        background: active ? C.gold : "transparent",
        display: "inline-block", flexShrink: 0,
      }} />
      <span style={{ fontFamily: F.display, fontSize: 14, fontStyle: "italic", fontWeight: 400 }}>{label}</span>
    </div>
    <span style={{ fontFamily: F.sans, fontSize: 9, color: C.stone, letterSpacing: 1.4, textTransform: "uppercase", display: "block", paddingLeft: 18 }}>{sub}</span>
  </button>
);

const Section = ({ label, hint, children }) => (
  <div style={{ marginBottom: 22 }}>
    <SC size={8.5} color={C.gold}>{label}</SC>
    {hint && <p style={{ fontFamily: F.body, fontSize: 13, color: C.stone, fontWeight: 300, fontStyle: "italic", marginTop: 4, lineHeight: 1.45 }}>{hint}</p>}
    <div style={{ marginTop: 10 }}>{children}</div>
  </div>
);

const Area = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{
      fontFamily: F.body, fontSize: 15.5, color: C.cream,
      padding: "10px 12px",
      background: C.bgSoft, border: `0.5px solid ${C.border}`,
      lineHeight: 1.5, resize: "none", fontWeight: 300,
      width: "100%",
    }} />
);

const DRAFT_KEY = "ledger.mvp.feedbackDraft";
const loadDraft = () => {
  try { return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "null") || {}; }
  catch { return {}; }
};
const saveDraft = (d) => { try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch {} };
const clearDraft = () => { try { window.localStorage.removeItem(DRAFT_KEY); } catch {} };

const FeedbackSheet = ({ open, onClose, wants, toggleWant, user }) => {
  // Restore any in-progress text — closing or refreshing doesn't lose what
  // she was typing.
  const initial = loadDraft();
  const [working, setWorking] = useState(initial.working || "");
  const [notWorking, setNotWorking] = useState(initial.notWorking || "");
  const [other, setOther] = useState(initial.other || "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Auto-save draft on every keystroke
  useEffect(() => {
    if (working || notWorking || other) saveDraft({ working, notWorking, other });
    else clearDraft();
  }, [working, notWorking, other]);

  // animate slide-up via mount/unmount + transform
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      setSent(false);
      setError("");
      const t = setTimeout(() => setVisible(true), 16);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  const hasContent = working.trim() || notWorking.trim() || other.trim() || wants.size > 0;

  const send = async () => {
    setError("");
    const note = {
      working: working.trim(),
      notWorking: notWorking.trim(),
      other: other.trim(),
      wants: Array.from(wants),
    };
    // POST to the worker. If the call fails, keep the draft and surface
    // the error rather than swallowing it.
    const ok = await (window.LEDGER_API?.sendFeedback?.(note) ?? Promise.resolve(false));
    if (!ok) {
      setError("Couldn't reach the makers. Note kept — try again in a moment.");
      return;
    }
    clearDraft();
    setSent(true);
    setTimeout(() => {
      setWorking(""); setNotWorking(""); setOther("");
      onClose();
    }, 1900);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      pointerEvents: "auto",
    }}>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(6,5,4,0.62)",
        backdropFilter: "blur(3px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.28s ease",
      }} />

      {/* sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        height: "92%",
        background: C.bg,
        borderTop: `0.5px solid ${C.borderLight}`,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.32s cubic-bezier(.2,.7,.2,1)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.borderLight }} />
        </div>

        {sent ? (
          // ── confirmation state ────────────────────────────
          <div className="fade" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center" }}>
            <Mono s={30} />
            <h2 style={{ fontFamily: F.display, fontSize: 30, fontStyle: "italic", fontWeight: 400, color: C.cream, marginTop: 22, lineHeight: 1.15 }}>
              We've got it.
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 16, color: C.creamSoft, fontWeight: 300, lineHeight: 1.55, marginTop: 14, maxWidth: 260 }}>
              Thank you{user.name ? `, ${user.name.split(" ")[0]}` : ""}. A maker will read this within the day.
            </p>
          </div>
        ) : (
          // ── form ──────────────────────────────────────────
          <>
            {/* Header */}
            <div style={{ padding: "8px 24px 18px", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `0.5px solid ${C.border}` }}>
              <div>
                <SC size={9} color={C.gold}>A note back to the makers</SC>
                <h2 style={{ fontFamily: F.display, fontSize: 24, fontStyle: "italic", fontWeight: 400, color: C.cream, marginTop: 6, lineHeight: 1.15 }}>
                  Tell us anything.
                </h2>
              </div>
              <button onClick={onClose} style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "transparent", border: `0.5px solid ${C.border}`,
                color: C.stone, fontSize: 16, cursor: "pointer", lineHeight: 1, fontFamily: F.sans,
              }}>×</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 8px" }}>
              <p style={{ fontFamily: F.body, fontSize: 14.5, color: C.stone, fontStyle: "italic", fontWeight: 300, lineHeight: 1.5, marginBottom: 24 }}>
                Be unfiltered. We read every word, personally — this isn't a survey.
              </p>

              <Section label="What's working">
                <Area value={working} onChange={setWorking} placeholder="The forwarding is the part I keep coming back to…" />
              </Section>

              <Section label="What isn't">
                <Area value={notWorking} onChange={setNotWorking} placeholder="The dates picker felt clumsy. The companions field…" />
              </Section>

              <Section label="What you'd want next" hint="Tap any you'd reach for first. Optional.">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {FEATURE_OPTIONS.map(opt => (
                    <Chip key={opt.id} active={wants.has(opt.id)} label={opt.name} sub={opt.blurb}
                      onClick={() => toggleWant(opt.id)} />
                  ))}
                </div>
                <Area value={other} onChange={setOther} placeholder="Something we haven't mentioned?" rows={2} />
              </Section>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px 28px", flexShrink: 0, background: `linear-gradient(to top, ${C.bg} 75%, transparent)` }}>
              {error && (
                <p style={{ textAlign: "center", marginBottom: 10, fontFamily: F.body, fontSize: 13, color: C.blush, fontStyle: "italic" }}>
                  {error}
                </p>
              )}
              <Btn full primary onClick={send} disabled={!hasContent}>Send to the makers</Btn>
              <p style={{ textAlign: "center", marginTop: 12, fontFamily: F.sans, fontSize: 9, color: C.stoneSoft, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Goes straight to a human · not a form
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

return { FeedbackSheet, FEATURE_OPTIONS };
})();

window.FEEDBACK = FEEDBACK;
