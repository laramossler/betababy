// ─── WOVEN FLOW · ORCHESTRATOR ────────────────────────────
// Phase machine + localStorage persistence + persistent overlays.
// Resumes where the user left off across reloads.

const { C: WC, F: WF } = window.LEDGER;
const { Cover, Incoming, Declined, CallBeat, CallSignoff, LetterIntro, Shortlist, CALL_BEATS } = window.WOVEN_A;
const { DayPlanner, Drafted, planFromVerdicts } = window.WOVEN_B;
const { PhaseIndicator, NoteToLara, RestartBar } = window.WOVEN_SHARED;
const { useState: wfState, useEffect: wfEffect, useCallback: wfCb } = React;

const FLOW_KEY = "ledger.first-sitting.v1";

// All six picks are pre-kept — Lara held the tables last week. Chloe's
// job at the shortlist is to flip what changed her mind, not to start from
// blank.
const DEFAULT_VERDICTS = { p1: "keep", p2: "keep", p3: "keep", p4: "keep", p5: "keep", p6: "keep" };

const EMPTY_STATE = {
  phase: "cover",
  beatIdx: 0,
  captures: {},          // beatId -> { chips, voice }
  verdicts: { ...DEFAULT_VERDICTS },
  planOverrides: {},     // 'dayIdx-slotId' -> entry | null
  completed: false,
};

function loadFlow() {
  try {
    const raw = window.localStorage.getItem(FLOW_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_STATE, ...parsed };
  } catch (e) { return EMPTY_STATE; }
}
function saveFlow(s) {
  try { window.localStorage.setItem(FLOW_KEY, JSON.stringify(s)); } catch (e) {}
}
function clearFlow() {
  try { window.localStorage.removeItem(FLOW_KEY); } catch (e) {}
}

function WovenFlow({ onFinalise }) {
  const [state, setState] = wfState(loadFlow());

  // Persist on every change
  wfEffect(() => { saveFlow(state); }, [state]);

  const set = (patch) => setState(s => ({ ...s, ...patch }));

  const restart = wfCb(() => {
    if (!window.confirm("Restart the first sitting? Your captures will be cleared.")) return;
    clearFlow();
    setState(EMPTY_STATE);
  }, []);

  // ─── phase transitions ─────────────────────────────────
  const startCall   = () => set({ phase: "incoming" });
  const accept      = () => set({ phase: "beat", beatIdx: 0 });
  const decline     = () => set({ phase: "declined" });
  const retry       = () => set({ phase: "incoming" });
  const captureBeat = (cap) => {
    const beat = CALL_BEATS[state.beatIdx];
    const captures = { ...state.captures, [beat.id]: cap };
    if (state.beatIdx + 1 >= CALL_BEATS.length) {
      set({ captures, phase: "signoff" });
    } else {
      set({ captures, beatIdx: state.beatIdx + 1 });
    }
  };
  const toLetter    = () => set({ phase: "letter" });
  const toShortlist = () => set({ phase: "shortlist" });
  const setVerdicts = (next) => set({ verdicts: next });
  const toPlanner   = () => set({ phase: "planner" });
  const setOverride = (key, value) => set({ planOverrides: { ...state.planOverrides, [key]: value } });
  const finalise    = () => {
    set({ phase: "drafted" });
  };
  const enterLedger = () => {
    set({ completed: true });
    // hand off computed plan to host
    onFinalise && onFinalise({
      ...state,
      phase: "drafted",
      completed: true,
      computedPlan: planFromVerdicts(state.verdicts),
    });
  };

  // ─── phase render ──────────────────────────────────────
  let body = null;
  switch (state.phase) {
    case "cover":     body = <Cover next={startCall} />; break;
    case "incoming":  body = <Incoming accept={accept} decline={decline} />; break;
    case "declined":  body = <Declined retry={retry} />; break;
    case "beat":      body = (
      <CallBeat
        beatIdx={state.beatIdx}
        beat={CALL_BEATS[state.beatIdx]}
        capture={state.captures[CALL_BEATS[state.beatIdx].id]}
        onComplete={captureBeat}
      />
    ); break;
    case "signoff":   body = <CallSignoff onLetter={toLetter} />; break;
    case "letter":    body = <LetterIntro onShortlist={toShortlist} />; break;
    case "shortlist": body = <Shortlist verdicts={state.verdicts} setVerdicts={setVerdicts} onPlanner={toPlanner} />; break;
    case "planner":   body = (
      <DayPlanner
        verdicts={state.verdicts}
        planOverrides={state.planOverrides}
        setOverride={setOverride}
        onFinalise={finalise}
      />
    ); break;
    case "drafted":   body = (
      <Drafted
        verdicts={state.verdicts}
        planOverrides={state.planOverrides}
        captures={state.captures}
        onEnterLedger={enterLedger}
      />
    ); break;
    default:          body = <Cover next={startCall} />;
  }

  const showOverlays = state.phase !== "cover";

  return (
    <div style={{ height: "100%", background: WC.bg, display: "flex", flexDirection: "column", position: "relative", color: WC.cream, animation: "fadeIn 0.4s ease" }}>
      {showOverlays && <PhaseIndicator phase={state.phase} />}
      {showOverlays && <NoteToLara />}
      <div key={state.phase + ":" + state.beatIdx} style={{ flex: 1, display: "flex", flexDirection: "column", animation: "rise 0.5s ease" }}>
        {body}
      </div>
      {showOverlays && <RestartBar onRestart={restart} />}
    </div>
  );
}

window.WOVEN = { WovenFlow, loadFlow, clearFlow, FLOW_KEY };
