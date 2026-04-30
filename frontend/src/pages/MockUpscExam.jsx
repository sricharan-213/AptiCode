import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const PAPER_DURATION = 7200; // 120 minutes per paper

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
export default function MockUpscExam() {
  const navigate = useNavigate();

  const [phase,       setPhase]       = useState("lobby"); // lobby|exam|transition|submitting|result|error
  const [sections,    setSections]    = useState([]);       // [{name, questions:[]}]
  const [currentPaper, setCurrentPaper] = useState(0);      // 0 = GS1, 1 = CSAT
  const [qIdx,        setQIdx]        = useState(0);
  const [answers,     setAnswers]     = useState({});       // { "GS Paper I_0": "optionText" }
  const [markedRev,   setMarkedRev]   = useState(new Set());
  const [visited,     setVisited]     = useState(new Set());
  const [timeLeft,    setTimeLeft]    = useState(PAPER_DURATION);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [warnings,    setWarnings]    = useState(0);
  const [language,    setLanguage]    = useState("English");

  const startTimeRef  = useRef(null);
  const timerRef      = useRef(null);
  const submitFnRef   = useRef(null); // for timer to call submit

  // ── Tab switch detection ───────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && phase === "exam") {
        setWarnings(w => {
          const next = w + 1;
          if (next >= 3) {
            alert("Tab switch limit exceeded! Auto-submitting current paper.");
            submitFnRef.current?.(true);
          } else {
            alert(`Warning! Tab switch detected. (${next}/3)`);
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase]);

  // ── Mark visited on navigation ───────────────────────────
  useEffect(() => {
    if (phase !== "exam" || !sections[currentPaper]) return;
    const key = qKey(sections[currentPaper].name, qIdx);
    setVisited((prev) => new Set([...prev, key]));
  }, [currentPaper, qIdx, phase, sections]);

  // ── Real-time timer ──────────────────────────────────────
  useEffect(() => {
    if (phase !== "exam") return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const rem = PAPER_DURATION - elapsed;
      if (rem <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        submitFnRef.current?.(true);
      } else {
        setTimeLeft(rem);
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [phase, currentPaper]);

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
      const res  = await fetch(`${API}/api/mock-upsc/upsc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load exam");

      setSections(data.sections);
      setTimeLeft(PAPER_DURATION);
      startTimeRef.current = Date.now();
      setCurrentPaper(0);
      setQIdx(0);
      setAnswers({});
      setMarkedRev(new Set());
      setVisited(new Set());
      setWarnings(0);
      setPhase("exam");
      
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit / Transition Logic ────────────────────────────
  const handlePaperSubmit = useCallback(
    async (auto = false) => {
      if (!auto && currentPaper === 0) {
        const total    = sections[0].questions.length;
        const answered = sections[0].questions.filter((_, i) => answers[qKey(sections[0].name, i)]).length;
        const ok = window.confirm(
          `You have answered ${answered} of ${total} questions in GS Paper I.\nSubmit Paper I and proceed to CSAT?`
        );
        if (!ok) return;
      } else if (!auto && currentPaper === 1) {
        const total    = sections[1].questions.length;
        const answered = sections[1].questions.filter((_, i) => answers[qKey(sections[1].name, i)]).length;
        const ok = window.confirm(
          `You have answered ${answered} of ${total} questions in CSAT Paper II.\nFinal Submit Exam?`
        );
        if (!ok) return;
      }

      clearInterval(timerRef.current);
      
      if (currentPaper === 0) {
        setPhase("transition");
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
      } else {
        // Final Submit
        setPhase("submitting");
        setLoading(true);
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
        try {
          const token = localStorage.getItem("token");
          const res  = await fetch(`${API}/api/mock-upsc/submit`, {
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
      }
    },
    [answers, sections, currentPaper]
  );

  useEffect(() => { submitFnRef.current = handlePaperSubmit; }, [handlePaperSubmit]);

  const startPaperII = () => {
    setCurrentPaper(1);
    setQIdx(0);
    setTimeLeft(PAPER_DURATION);
    startTimeRef.current = Date.now();
    setPhase("exam");
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // ── Derived helpers ──────────────────────────────────────
  const curSection  = sections[currentPaper];
  const curQuestion = curSection?.questions[qIdx];
  const curKey      = curSection ? qKey(curSection.name, qIdx) : null;
  const isFirstQ    = qIdx === 0;
  const isLastQ     = qIdx  === (curSection?.questions.length ?? 1) - 1;
  const totalQ      = curSection?.questions.length || 0;
  const totalAnswered = curSection ? curSection.questions.filter((_, i) => answers[qKey(curSection.name, i)]).length : 0;
  const urgent      = timeLeft <= 300;

  const goPrev = () => {
    if (qIdx > 0) { setQIdx((q) => q - 1); }
  };

  const saveAndNext = () => {
    if (isLastQ) { handlePaperSubmit(false); return; }
    setQIdx((q) => q + 1);
  };

  const getStatus = (sectionName, idx) => {
    const key    = qKey(sectionName, idx);
    const isCur  = curSection?.name === sectionName && qIdx === idx;
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
    setCurrentPaper(0);
    setQIdx(0);
    setWarnings(0);
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
          <div style={{ fontSize: 60, marginBottom: 20 }}>🏛️</div>
          <h1 style={{
            margin: "0 0 12px", fontSize: 34, fontWeight: 900,
            background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            UPSC CSE Prelims Mock
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: 36, lineHeight: 1.9 }}>
            2 Papers &nbsp;·&nbsp; 180 Questions &nbsp;·&nbsp; 240 Minutes Total<br />
            <span style={{ color: "#4ade80", fontWeight: 700 }}>+2/+2.5</span> Correct &nbsp;|&nbsp;
            <span style={{ color: "#f87171", fontWeight: 700 }}>−0.66</span> Wrong &nbsp;|&nbsp;
            <span style={{ color: "#64748b" }}>0</span> Skipped
          </p>

          {/* Section cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 40 }}>
            {[
              { name: "GS Paper I", icon: "🌍", sub: "General Studies", qCount: 100 },
              { name: "CSAT Paper II", icon: "🧠", sub: "Civil Services Aptitude", qCount: 80 },
            ].map((sec) => (
              <div key={sec.name} style={{
                background: "#1e293b", borderRadius: 14, padding: "20px 12px",
                border: "1px solid #334155",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{sec.icon}</div>
                <div style={{ fontWeight: 800, color: "#f1f5f9", fontSize: 15 }}>{sec.name}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{sec.sub}</div>
                <div style={{ marginTop: 10, ...pill("#172136","#8b5cf6") }}>{sec.qCount} Questions | 120 mins</div>
              </div>
            ))}
          </div>

          {/* Rules */}
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "⏱️  Timer runs for 120 mins per paper. CSAT starts after GS I is submitted.",
              "🚫  Negative marking: -0.66 per wrong answer.",
              "🖥️  Fullscreen enforced. Max 3 tab switches allowed before auto-submit.",
              "🌐  UI is available in English (toggle mock only).",
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
            onClick={loadExam}
            disabled={loading}
            style={{
              width: "100%", padding: "16px", border: "none", borderRadius: 14,
              background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
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
  // TRANSITION
  // ════════════════════════════════════════════════════════════
  if (phase === "transition") {
    return (
      <div style={{
        minHeight: "100vh", background: "#060b18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter',sans-serif", padding: "80px 16px 40px",
      }}>
        <div style={{
          maxWidth: 600, width: "100%", background: "#0f172a",
          border: "1px solid #1e293b", borderRadius: 24, padding: "52px 44px",
          textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
          <h1 style={{
            margin: "0 0 12px", fontSize: 30, fontWeight: 900, color: "#f1f5f9"
          }}>
            Paper I Submitted Successfully
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 36, lineHeight: 1.6 }}>
            You have completed General Studies Paper I.<br/>
            Click the button below when you are ready to begin CSAT Paper II.<br/>
            You will have 120 minutes.
          </p>
          <button
            onClick={startPaperII}
            style={{
              width: "100%", padding: "16px", border: "none", borderRadius: 14,
              background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
              color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer",
            }}
          >
            Begin CSAT Paper II →
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
          {/* Left: title + language */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: "#f1f5f9", whiteSpace: "nowrap" }}>
              UPSC Prelims Mock
            </span>
            <div style={{ padding: "4px 12px", background: "#1e293b", borderRadius: 6, color: "#8b5cf6", fontSize: 12, fontWeight: "bold" }}>
              {curSection?.name}
            </div>
            <button 
              onClick={() => setLanguage(lang => lang === "English" ? "Hindi" : "English")}
              style={{
                padding: "4px 12px", background: "transparent", border: "1px solid #334155", 
                borderRadius: 6, color: "#94a3b8", fontSize: 12, cursor: "pointer"
              }}
            >
              Lang: {language}
            </button>
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
              onClick={() => handlePaperSubmit(false)}
              disabled={phase === "submitting"}
              style={{
                padding: "8px 20px", background: "#dc2626", border: "none",
                borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {phase === "submitting" ? "Submitting…" : currentPaper === 0 ? "Submit Paper I" : "Final Submit"}
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
                  border: "1px solid #1e293b", whiteSpace: "pre-wrap"
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
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 14,
                          padding: "14px 20px", borderRadius: 12, cursor: "pointer",
                          border: `1.5px solid ${selected ? "#8b5cf6" : "#1e293b"}`,
                          background: selected ? "rgba(139, 92, 246, 0.12)" : "#0f172a",
                          transition: "all 0.15s",
                        }}
                      >
                        <input
                          type="radio"
                          name={`q-${curKey}`}
                          value={opt}
                          checked={selected}
                          style={{ accentColor: "#8b5cf6", marginTop: 3, flexShrink: 0 }}
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
                      onClick={saveAndNext}
                      style={{
                        padding: "9px 26px", border: "none", borderRadius: 8,
                        color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
                        background: isLastQ
                          ? "linear-gradient(90deg,#dc2626,#b91c1c)"
                          : "linear-gradient(90deg,#8b5cf6,#ec4899)",
                        transition: "opacity 0.15s",
                      }}
                    >
                      {isLastQ ? (currentPaper === 0 ? "Save & Submit Paper I" : "Save & Final Submit") : "Save & Next →"}
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

            {/* Current section palette */}
            {curSection && (
              <div style={{ marginBottom: 22 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 10,
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8,
                    color: "#8b5cf6",
                  }}>
                    {curSection.name}
                  </span>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    {totalAnswered}/{curSection.questions.length}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
                  {curSection.questions.map((_, qi) => {
                    const status = getStatus(curSection.name, qi);
                    const c      = PC[status];
                    return (
                      <button
                        key={qi}
                        onClick={() => setQIdx(qi)}
                        title={`${curSection.name} Q${qi + 1}`}
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
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RESULT
  // ════════════════════════════════════════════════════════════
  if (phase === "result" && result) {
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
            <h1 style={{
              fontSize: 36, fontWeight: 900, margin: "0 0 24px",
              background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              UPSC Prelims Mock Result
            </h1>

            <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 36 }}>
                <div style={{ padding: "24px 40px", background: "#1e293b", borderRadius: 16, border: "1px solid #334155" }}>
                    <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>GS Paper I Score</div>
                    <div style={{ fontSize: 44, fontWeight: "900", color: "#f1f5f9" }}>{result.scoreGS} <span style={{fontSize: 20, color: "#64748b"}}>/ 200</span></div>
                </div>
                <div style={{ padding: "24px 40px", background: "#1e293b", borderRadius: 16, border: `1px solid ${result.isCSATPassed ? "#16a34a" : "#dc2626"}` }}>
                    <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>CSAT Paper II Score</div>
                    <div style={{ fontSize: 44, fontWeight: "900", color: result.isCSATPassed ? "#4ade80" : "#f87171" }}>{result.scoreCSAT} <span style={{fontSize: 20, color: "#64748b"}}>/ 200</span></div>
                    <div style={{ fontSize: 14, color: result.isCSATPassed ? "#4ade80" : "#f87171", marginTop: 8, fontWeight: "bold" }}>
                        {result.isCSATPassed ? "QUALIFIED" : "NOT QUALIFIED"}
                    </div>
                </div>
            </div>

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

            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <button
                onClick={resetExam}
                style={{
                  padding: "13px 32px", border: "none", borderRadius: 12,
                  background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
                  color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
                }}
              >
                Retake Exam
              </button>
              <button
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
                fontSize: 16, fontWeight: 800, color: "#8b5cf6",
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
                      
                      {r.explanation && (
                          <div style={{ marginBottom: 12, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                              <strong style={{color: "#94a3b8"}}>Explanation:</strong> {r.explanation}
                          </div>
                      )}

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
        Go Back
      </button>
    </div>
  );
}
