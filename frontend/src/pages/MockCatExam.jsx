import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";
const EXAM_DURATION = 3600; // 60 minutes

const pad = (n) => String(n).padStart(2, "0");
const formatTime = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const qKey = (sectionName, idx) => `${sectionName}_${idx}`;

// ── Palette colour map ────────────────────────────────────────
const PC = {
  current:       { bg: "#1d4ed8", border: "#3b82f6", text: "#fff" },
  answered:      { bg: "#15803d", border: "#22c55e", text: "#fff" },
  "mrk-review":  { bg: "#6d28d9", border: "#8b5cf6", text: "#fff" },
  "ans-review":  { bg: "#b45309", border: "#f59e0b", text: "#fff" },
  "not-answered":{ bg: "#991b1b", border: "#ef4444", text: "#fca5a5" },
  "not-visited": { bg: "#1e293b", border: "#334155", text: "#475569" },
};

// ── Inline style helpers ──────────────────────────────────────
const pill = (bg, color) => ({
  display: "inline-flex", alignItems: "center", padding: "3px 13px",
  borderRadius: 20, background: bg, color, fontSize: 12, fontWeight: 700,
  letterSpacing: 0.3,
});

const diffColor = (d) =>
  d === "Easy"   ? { bg: "#052e16", color: "#4ade80" } :
  d === "Medium" ? { bg: "#1c1400", color: "#facc15" } :
                   { bg: "#2d0000", color: "#f87171" };

// ─────────────────────────────────────────────────────────────
export default function MockCatExam() {
  const navigate = useNavigate();

  const [phase,       setPhase]       = useState("lobby"); // lobby|exam|submitting|result|error
  const [sections,    setSections]    = useState([]);       // [{name, questions:[]}]
  const [secIdx,      setSecIdx]      = useState(0);
  const [qIdx,        setQIdx]        = useState(0);
  const [answers,     setAnswers]     = useState({});       // { "VARC_0": "optionText" }
  const [markedRev,   setMarkedRev]   = useState(new Set());
  const [visited,     setVisited]     = useState(new Set());
  const [timeLeft,    setTimeLeft]    = useState(EXAM_DURATION);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");

  const startTimeRef  = useRef(null);
  const timerRef      = useRef(null);
  const submitFnRef   = useRef(null); // for timer to call submit

  // ── Mark visited on navigation ───────────────────────────
  useEffect(() => {
    if (phase !== "exam" || !sections[secIdx]) return;
    const key = qKey(sections[secIdx].name, qIdx);
    setVisited((prev) => new Set([...prev, key]));
  }, [secIdx, qIdx, phase, sections]);

  // ── Real-time timer (tab-switch safe) ────────────────────
  useEffect(() => {
    if (phase !== "exam") return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const rem = EXAM_DURATION - elapsed;
      if (rem <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        submitFnRef.current?.(true);
      } else {
        setTimeLeft(rem);
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Load exam from backend ───────────────────────────────
  const loadExam = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res  = await fetch(`${API}/api/mock-cat/cat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load exam");

      setSections(data.sections);
      setTimeLeft(data.duration || EXAM_DURATION);
      startTimeRef.current = Date.now();
      setSecIdx(0);
      setQIdx(0);
      setAnswers({});
      setMarkedRev(new Set());
      setVisited(new Set());
      setPhase("exam");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit exam ──────────────────────────────────────────
  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!auto) {
        const total    = sections.reduce((s, sec) => s + sec.questions.length, 0);
        const answered = Object.keys(answers).length;
        const ok = window.confirm(
          `You have answered ${answered} of ${total} questions.\nSubmit the exam now?`
        );
        if (!ok) return;
      }
      clearInterval(timerRef.current);
      setPhase("submitting");
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res  = await fetch(`${API}/api/mock-cat/submit`, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body:    JSON.stringify({ answers }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Submission failed");
        setResult(data);
        setPhase("result");
      } catch (err) {
        setErrorMsg(err.message);
        setPhase("error");
      } finally {
        setLoading(false);
      }
    },
    [answers, sections]
  );

  useEffect(() => { submitFnRef.current = handleSubmit; }, [handleSubmit]);

  // ── Derived helpers ──────────────────────────────────────
  const curSection  = sections[secIdx];
  const curQuestion = curSection?.questions[qIdx];
  const curKey      = curSection ? qKey(curSection.name, qIdx) : null;
  const isFirstQ    = secIdx === 0 && qIdx === 0;
  const isLastQ     = secIdx === sections.length - 1 &&
                      qIdx  === (curSection?.questions.length ?? 1) - 1;
  const totalQ      = sections.reduce((s, sec) => s + sec.questions.length, 0);
  const totalAnswered = Object.keys(answers).length;
  const urgent      = timeLeft <= 300;

  const goPrev = () => {
    if (qIdx > 0) { setQIdx((q) => q - 1); return; }
    if (secIdx > 0) {
      const prevSec = sections[secIdx - 1];
      setSecIdx((s) => s - 1);
      setQIdx(prevSec.questions.length - 1);
    }
  };

  const saveAndNext = () => {
    if (isLastQ) { handleSubmit(false); return; }
    if (qIdx < (curSection?.questions.length ?? 1) - 1) {
      setQIdx((q) => q + 1);
    } else {
      setSecIdx((s) => s + 1);
      setQIdx(0);
    }
  };

  const getStatus = (sectionName, idx) => {
    const key    = qKey(sectionName, idx);
    const isCur  = curSection?.name === sectionName && qIdx === idx && secIdx === sections.findIndex(s => s.name === sectionName);
    if (isCur) return "current";
    const hasAns = !!answers[key];
    const isRev  = markedRev.has(key);
    if (hasAns && isRev) return "ans-review";
    if (isRev)           return "mrk-review";
    if (hasAns)          return "answered";
    if (visited.has(key)) return "not-answered";
    return "not-visited";
  };

  const resetExam = () => {
    setPhase("lobby");
    setResult(null);
    setAnswers({});
    setMarkedRev(new Set());
    setVisited(new Set());
    setSecIdx(0);
    setQIdx(0);
    startTimeRef.current = null;
  };

  // ════════════════════════════════════════════════════════════
  // LOBBY
  // ════════════════════════════════════════════════════════════
  if (phase === "lobby") {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg,#060b18 0%,#0d1b2a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter',sans-serif", padding: "80px 16px 40px",
      }}>
        <div style={{
          maxWidth: 600, width: "100%", background: "#0f172a",
          border: "1px solid #1e293b", borderRadius: 24, padding: "52px 44px",
          textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🎓</div>
          <h1 style={{
            margin: "0 0 12px", fontSize: 34, fontWeight: 900,
            background: "linear-gradient(90deg,#60a5fa,#a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            CAT Mock Exam
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: 36, lineHeight: 1.9 }}>
            3 Sections &nbsp;·&nbsp; 30 Questions &nbsp;·&nbsp; 60 Minutes<br />
            <span style={{ color: "#4ade80", fontWeight: 700 }}>+3</span> Correct &nbsp;|&nbsp;
            <span style={{ color: "#f87171", fontWeight: 700 }}>−1</span> Wrong &nbsp;|&nbsp;
            <span style={{ color: "#64748b" }}>0</span> Skipped
          </p>

          {/* Section cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 40 }}>
            {[
              { name: "VARC", icon: "📖", sub: "Verbal Ability & RC" },
              { name: "DILR", icon: "🧩", sub: "Data Interpretation & LR" },
              { name: "QA",   icon: "📐", sub: "Quantitative Aptitude" },
            ].map((sec) => (
              <div key={sec.name} style={{
                background: "#1e293b", borderRadius: 14, padding: "20px 12px",
                border: "1px solid #334155",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{sec.icon}</div>
                <div style={{ fontWeight: 800, color: "#f1f5f9", fontSize: 15 }}>{sec.name}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{sec.sub}</div>
                <div style={{ marginTop: 10, ...pill("#172136","#60a5fa") }}>10 Questions</div>
              </div>
            ))}
          </div>

          {/* Rules */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "⏱️  Timer runs for 60 minutes & auto-submits when time ends",
              "💾  Your answers are saved automatically when you click Next",
              "🔖  Mark questions for review and come back later",
              "📊  Instant section-wise score breakdown on submission",
            ].map((t, i) => (
              <li key={i} style={{ fontSize: 13, color: "#94a3b8", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {errorMsg && (
            <p style={{ color: "#f87171", fontSize: 14, marginBottom: 16 }}>{errorMsg}</p>
          )}

          <button
            id="start-exam-btn"
            onClick={loadExam}
            disabled={loading}
            style={{
              width: "100%", padding: "16px", border: "none", borderRadius: 14,
              background: "linear-gradient(90deg,#2563eb,#7c3aed)",
              color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer",
              transition: "opacity 0.2s", opacity: loading ? 0.7 : 1,
              letterSpacing: 0.5,
            }}
          >
            {loading ? "Loading Questions…" : "Start Exam  →"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // EXAM
  // ════════════════════════════════════════════════════════════
  if (phase === "exam" || phase === "submitting") {
    return (
      <div style={{ minHeight: "100vh", background: "#080d18", fontFamily: "'Inter',sans-serif" }}>

        {/* ── Fixed top bar ─────────────────────────────── */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          height: 58, background: "#0f172a", borderBottom: "1px solid #1e293b",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", gap: 12,
        }}>
          {/* Left: title + section tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#f1f5f9", whiteSpace: "nowrap" }}>
              CAT Mock
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {sections.map((sec, si) => {
                const isActive = si === secIdx;
                return (
                  <button
                    key={sec.name}
                    id={`tab-${sec.name}`}
                    onClick={() => { setSecIdx(si); setQIdx(0); }}
                    style={{
                      padding: "5px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: 13, transition: "all 0.15s",
                      background: isActive ? "#2563eb" : "#1e293b",
                      color:      isActive ? "#fff"    : "#64748b",
                    }}
                  >
                    {sec.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: answered count + timer + submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
              {totalAnswered}/{totalQ} answered
            </span>
            <div style={{
              fontWeight: 900, fontSize: 21, letterSpacing: 2,
              color: urgent ? "#ef4444" : "#34d399",
              fontVariantNumeric: "tabular-nums",
              animation: urgent ? "pulse-red 1s infinite" : "none",
            }}>
              {urgent && "⚠️ "}{formatTime(timeLeft)}
            </div>
            <button
              id="submit-exam-btn"
              onClick={() => handleSubmit(false)}
              disabled={phase === "submitting"}
              style={{
                padding: "8px 20px", background: "#dc2626", border: "none",
                borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {phase === "submitting" ? "Submitting…" : "Submit Exam"}
            </button>
          </div>
        </div>

        {/* ── Body: question panel + sidebar ────────────── */}
        <div style={{
          display: "flex", height: "100vh", paddingTop: 58, overflow: "hidden",
        }}>

          {/* Question panel */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px 80px" }}>
            {curQuestion && (
              <>
                {/* Badges */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={pill("#1e3a5f","#60a5fa")}>
                    {curSection.name} · Q{qIdx + 1} of {curSection.questions.length}
                  </span>
                  {curQuestion.topic && (
                    <span style={pill("#1a1a2e","#818cf8")}>{curQuestion.topic}</span>
                  )}
                  {curQuestion.difficulty && (() => {
                    const dc = diffColor(curQuestion.difficulty);
                    return <span style={pill(dc.bg, dc.color)}>{curQuestion.difficulty}</span>;
                  })()}
                  {markedRev.has(curKey) && (
                    <span style={pill("#3b1f6e","#c4b5fd")}>🔖 Marked for Review</span>
                  )}
                </div>

                {/* Title */}
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#475569", margin: "0 0 10px" }}>
                  {curQuestion.title}
                </h2>

                {/* Description */}
                <p style={{
                  fontSize: 16, lineHeight: 1.9, color: "#e2e8f0", margin: "0 0 32px",
                  background: "#0f172a", padding: "20px 24px", borderRadius: 14,
                  border: "1px solid #1e293b",
                }}>
                  {curQuestion.description}
                </p>

                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 36 }}>
                  {(curQuestion.options || []).map((opt, i) => {
                    const selected = answers[curKey] === opt;
                    return (
                      <label
                        key={i}
                        id={`option-${curSection.name}-${qIdx + 1}-${i + 1}`}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 14,
                          padding: "14px 20px", borderRadius: 12, cursor: "pointer",
                          border: `1.5px solid ${selected ? "#2563eb" : "#1e293b"}`,
                          background: selected ? "rgba(37,99,235,0.12)" : "#0f172a",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${curKey}`}
                          value={opt}
                          checked={selected}
                          style={{ accentColor: "#2563eb", marginTop: 3, flexShrink: 0 }}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [curKey]: opt }))
                          }
                        />
                        <span style={{ color: "#e2e8f0", fontSize: 15, lineHeight: 1.6 }}>
                          <b style={{ color: "#475569", marginRight: 8 }}>
                            {String.fromCharCode(65 + i)}.
                          </b>
                          {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Action row */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", flexWrap: "wrap", gap: 12,
                }}>
                  {/* Left actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      id="clear-response-btn"
                      onClick={() =>
                        setAnswers((prev) => {
                          const n = { ...prev };
                          delete n[curKey];
                          return n;
                        })
                      }
                      style={{
                        padding: "9px 18px", background: "transparent",
                        border: "1px solid #374151", borderRadius: 8,
                        color: "#f87171", fontWeight: 600, fontSize: 13, cursor: "pointer",
                      }}
                    >
                      Clear Response
                    </button>
                    <button
                      id="mark-review-btn"
                      onClick={() =>
                        setMarkedRev((prev) => {
                          const next = new Set(prev);
                          if (next.has(curKey)) next.delete(curKey);
                          else next.add(curKey);
                          return next;
                        })
                      }
                      style={{
                        padding: "9px 18px", borderRadius: 8, fontWeight: 600,
                        fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                        background: markedRev.has(curKey) ? "#3b1f6e" : "#1e293b",
                        border:     `1px solid ${markedRev.has(curKey) ? "#7c3aed" : "#374151"}`,
                        color:      markedRev.has(curKey) ? "#c4b5fd" : "#64748b",
                      }}
                    >
                      🔖 {markedRev.has(curKey) ? "Unmark Review" : "Mark for Review"}
                    </button>
                  </div>

                  {/* Nav buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      id="prev-question-btn"
                      disabled={isFirstQ}
                      onClick={goPrev}
                      style={{
                        padding: "9px 22px", background: "#1e293b",
                        border: "1px solid #334155", borderRadius: 8,
                        color: isFirstQ ? "#334155" : "#94a3b8",
                        fontWeight: 600, fontSize: 14,
                        cursor: isFirstQ ? "not-allowed" : "pointer",
                      }}
                    >
                      ← Prev
                    </button>
                    <button
                      id={isLastQ ? "save-submit-btn" : "save-next-btn"}
                      onClick={saveAndNext}
                      style={{
                        padding: "9px 26px", border: "none", borderRadius: 8,
                        color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
                        background: isLastQ
                          ? "linear-gradient(90deg,#dc2626,#b91c1c)"
                          : "linear-gradient(90deg,#2563eb,#1d4ed8)",
                        transition: "opacity 0.15s",
                      }}
                    >
                      {isLastQ ? "Save & Submit ✓" : "Save & Next →"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Palette Sidebar ─────────────────────────── */}
          <div style={{
            width: 256, background: "#0c1424", borderLeft: "1px solid #1e293b",
            overflowY: "auto", padding: "20px 16px", flexShrink: 0,
          }}>
            {/* Legend */}
            <p style={{
              fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase",
              letterSpacing: 1.2, margin: "0 0 12px",
            }}>
              Legend
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
              {[
                { status: "answered",       label: "Answered" },
                { status: "not-answered",   label: "Not Answered" },
                { status: "mrk-review",     label: "Marked for Review" },
                { status: "ans-review",     label: "Answered + Review" },
                { status: "not-visited",    label: "Not Visited" },
              ].map((item) => {
                const c = PC[item.status];
                return (
                  <div key={item.status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      background: c.bg, border: `1.5px solid ${c.border}`,
                    }} />
                    <span style={{ fontSize: 11, color: "#475569" }}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid #1e293b", marginBottom: 20 }} />

            {/* Per-section palettes */}
            {sections.map((sec, si) => {
              const answeredInSec = sec.questions.filter((_, i) => answers[qKey(sec.name, i)]).length;
              return (
                <div key={sec.name} style={{ marginBottom: 22 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 10,
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8,
                      color: si === secIdx ? "#60a5fa" : "#334155",
                    }}>
                      {sec.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#334155" }}>
                      {answeredInSec}/{sec.questions.length}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
                    {sec.questions.map((_, qi) => {
                      const status = getStatus(sec.name, qi);
                      const c      = PC[status];
                      return (
                        <button
                          key={qi}
                          id={`palette-${sec.name}-${qi + 1}`}
                          onClick={() => { setSecIdx(si); setQIdx(qi); }}
                          title={`${sec.name} Q${qi + 1}`}
                          style={{
                            padding: "6px 0", borderRadius: 6, fontWeight: 700,
                            fontSize: 12, cursor: "pointer", transition: "all 0.1s",
                            background: c.bg, border: `1.5px solid ${c.border}`, color: c.text,
                          }}
                        >
                          {qi + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RESULT
  // ════════════════════════════════════════════════════════════
  if (phase === "result" && result) {
    const pct  = Math.max(0, result.percentage ?? 0);
    const emoji = pct >= 70 ? "🏆" : pct >= 40 ? "👍" : "💪";

    return (
      <div style={{
        minHeight: "100vh", background: "#060b18", fontFamily: "'Inter',sans-serif",
        padding: "80px 20px 60px", color: "#f1f5f9",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* ── Score summary ─────────────────────────── */}
          <div style={{
            background: "#0f172a", border: "1px solid #1e293b", borderRadius: 24,
            padding: "44px 36px", textAlign: "center", marginBottom: 32,
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>{emoji}</div>
            <h1 style={{
              fontSize: 44, fontWeight: 900, margin: "0 0 8px",
              background: "linear-gradient(90deg,#34d399,#60a5fa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {result.score} / {result.maxScore}
            </h1>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 36 }}>
              {pct.toFixed(1)}% &nbsp;·&nbsp; CAT Mock Exam
            </p>

            {/* Overall stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3,1fr)",
              gap: 16, marginBottom: 36,
            }}>
              {[
                { label: "Correct",   value: result.correctCount,   color: "#4ade80", bg: "#052e16" },
                { label: "Incorrect", value: result.incorrectCount, color: "#f87171", bg: "#2d0000" },
                { label: "Skipped",   value: result.skippedCount,   color: "#94a3b8", bg: "#1e293b" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: 16, padding: "24px 8px" }}>
                  <div style={{ fontSize: 34, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Section breakdown */}
            <div style={{ marginBottom: 36 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase",
                letterSpacing: 1.2, marginBottom: 14,
              }}>
                Section Breakdown
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {(result.sectionBreakdown || []).map((sec) => (
                  <div key={sec.name} style={{
                    background: "#1e293b", borderRadius: 14, padding: "20px 16px",
                    border: "1px solid #334155",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#60a5fa", marginBottom: 6 }}>
                      {sec.name}
                    </div>
                    <div style={{
                      fontSize: 26, fontWeight: 900,
                      color: sec.score > 0 ? "#4ade80" : sec.score < 0 ? "#f87171" : "#94a3b8",
                    }}>
                      {sec.score > 0 ? `+${sec.score}` : sec.score}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 8, display: "flex", gap: 12, justifyContent: "center" }}>
                      <span style={{ color: "#4ade80" }}>✓ {sec.correct}</span>
                      <span style={{ color: "#f87171" }}>✗ {sec.incorrect}</span>
                      <span>— {sec.skipped}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <button
                id="retake-exam-btn"
                onClick={resetExam}
                style={{
                  padding: "13px 32px", border: "none", borderRadius: 12,
                  background: "linear-gradient(90deg,#2563eb,#7c3aed)",
                  color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                }}
              >
                Retake Exam
              </button>
              <button
                id="go-home-btn"
                onClick={() => navigate("/")}
                style={{
                  padding: "13px 32px", background: "#1e293b",
                  border: "1px solid #334155", borderRadius: 12,
                  color: "#94a3b8", fontWeight: 700, fontSize: 15, cursor: "pointer",
                }}
              >
                Go Home
              </button>
            </div>
          </div>

          {/* ── Per-section question breakdown ────────── */}
          {(result.sectionBreakdown || []).map((sec) => (
            <div key={sec.name} style={{ marginBottom: 36 }}>
              <h2 style={{
                fontSize: 16, fontWeight: 800, color: "#60a5fa",
                marginBottom: 16, letterSpacing: 0.5,
              }}>
                {sec.name} — Question Breakdown
              </h2>
              {(result.results || [])
                .filter((r) => r.section === sec.name)
                .map((r, i) => {
                  const colors =
                    r.status === "correct"   ? { bg: "#052e16", border: "#16a34a", text: "#4ade80" } :
                    r.status === "incorrect" ? { bg: "#2d0000", border: "#dc2626", text: "#f87171" } :
                                               { bg: "#1e293b", border: "#334155", text: "#64748b" };
                  return (
                    <div
                      key={r.id}
                      id={`result-${r.id}`}
                      style={{
                        background: colors.bg, border: `1px solid ${colors.border}`,
                        borderRadius: 12, padding: "16px 20px", marginBottom: 10,
                      }}
                    >
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 8,
                      }}>
                        <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14 }}>
                          Q{i + 1}. {r.title}
                        </span>
                        <span style={{
                          fontWeight: 900, fontSize: 15,
                          color: r.marks > 0 ? "#4ade80" : r.marks < 0 ? "#f87171" : "#64748b",
                        }}>
                          {r.marks > 0 ? `+${r.marks}` : r.marks}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 13, display: "flex", gap: 20, flexWrap: "wrap",
                        color: "#475569",
                      }}>
                        <span>
                          Your answer:{" "}
                          <b style={{ color: r.status === "correct" ? "#4ade80" : r.status === "incorrect" ? "#f87171" : "#64748b" }}>
                            {r.userAnswer ?? "—"}
                          </b>
                        </span>
                        <span>
                          Correct: <b style={{ color: "#4ade80" }}>{r.correctOption}</b>
                        </span>
                        <span style={{ textTransform: "capitalize", color: colors.text }}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // ERROR fallback
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: "100vh", background: "#060b18", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter',sans-serif", flexDirection: "column", gap: 20,
    }}>
      <div style={{ fontSize: 52 }}>⚠️</div>
      <p style={{ color: "#f87171", fontSize: 16 }}>{errorMsg || "Something went wrong."}</p>
      <button
        onClick={() => setPhase("lobby")}
        style={{
          padding: "10px 28px", background: "#1e293b", border: "1px solid #334155",
          borderRadius: 8, color: "#94a3b8", fontWeight: 700, cursor: "pointer", fontSize: 14,
        }}
      >
        ← Back to Lobby
      </button>
    </div>
  );
}
