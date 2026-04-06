import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const API = "https://apticode-backend.onrender.com";

/* ── helpers ── */
const fmtSecs = (s) => {
  if (!s && s !== 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export default function Problem() {
  const { id } = useParams();

  const [activeTab, setActiveTab]       = useState("problem");
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [problem, setProblem]           = useState(null);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const [prevTimeTaken, setPrevTimeTaken] = useState(null);

  // Timer
  const [elapsed, setElapsed]   = useState(0);         // seconds
  const [running, setRunning]   = useState(false);
  const timerRef                = useRef(null);
  const startTimeRef            = useRef(null);

  // Submission result
  const [result, setResult] = useState(null);
  // { timeTaken, timeTakenFormatted, globalAvgTime, globalAvgFormatted, fastSolve }

  /* ── fetch problem ── */
  useEffect(() => {
    fetch(`${API}/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProblem(data);
      })
      .catch((err) => console.error("Error fetching problem:", err));
  }, [id]);

  /* ── check if already solved & start timer ── */
  useEffect(() => {
    if (!problem) return;
    const token = localStorage.getItem("token");
    if (!token) {
      // Not logged in — start timer anyway for UX
      startTimer();
      return;
    }
    fetch(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const sp = data?.user?.solvedProblems || [];
        const entry = sp.find(
          (p) => (p.problemId?._id || p.problemId) === id ||
                 (p.problemId?._id || p.problemId)?.toString() === id
        );
        if (entry) {
          setAlreadySolved(true);
          setPrevTimeTaken(entry.timeTaken);
        } else {
          startTimer();
        }
      })
      .catch(() => startTimer());
  }, [problem]);

  /* ── timer controls ── */
  const startTimer = () => {
    startTimeRef.current = Date.now() - elapsed * 1000;
    setRunning(true);
  };

  const stopTimer = () => {
    setRunning(false);
    clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  /* ── cleanup on unmount ── */
  useEffect(() => () => clearInterval(timerRef.current), []);

  if (!problem) {
    return (
      <div style={{ padding: "100px", color: "white", fontSize: "20px" }}>
        Loading...
      </div>
    );
  }

  const CORRECT_OPTION = problem.correctOption;
  const isCorrect = selectedOption === CORRECT_OPTION;

  /* ── submit ── */
  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) { alert("You must be logged in to submit."); return; }
    if (!selectedOption) return;

    const finalTime = elapsed;
    stopTimer();
    setIsSubmitted(true);

    if (selectedOption === CORRECT_OPTION) {
      try {
        const res = await fetch(`${API}/api/users/solve/${id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ timeTaken: finalTime }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult({
            timeTaken:          data.timeTaken,
            timeTakenFormatted: data.timeTakenFormatted,
            globalAvgTime:      data.globalAvgTime,
            globalAvgFormatted: data.globalAvgFormatted,
            fastSolve:          data.fastSolve,
          });
        }
      } catch (err) {
        console.error("Error recording solve:", err);
      }
    }
  };

  const difficultyColor =
    problem.difficulty === "Easy"   ? "var(--success)"
    : problem.difficulty === "Medium" ? "#eab308"
    : "var(--danger)";

  return (
    <div
      style={{
        padding: "100px 32px 32px 32px",
        color: "var(--text-color)",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <h1 style={{ marginBottom: "12px", fontSize: "36px", fontWeight: "700" }}>
        {problem.number && (
          <span style={{ color: "var(--muted-text)", marginRight: "12px", fontWeight: "500" }}>
            #{problem.number}
          </span>
        )}
        {problem.title}
      </h1>

      <p style={{ color: "var(--muted-text)", marginBottom: "32px", fontSize: "18px" }}>
        Difficulty:{" "}
        <span style={{ color: difficultyColor, fontWeight: "600" }}>{problem.difficulty}</span>
        {" "}· Topic: <span style={{ color: "var(--text-color)" }}>{problem.topic}</span>
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          borderBottom: "1px solid var(--card-border)",
          marginBottom: "32px",
        }}
      >
        <Tab label="Problem"  active={activeTab === "problem"}  onClick={() => setActiveTab("problem")} />
        <Tab label="Solution" active={activeTab === "solution"} onClick={() => setActiveTab("solution")} />
        <Tab label="Discuss"  active={activeTab === "discuss"}  onClick={() => setActiveTab("discuss")} />
      </div>

      <div style={{ minHeight: "500px" }}>
        {/* ── PROBLEM TAB ── */}
        {activeTab === "problem" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
              alignItems: "start",
            }}
          >
            {/* LEFT: Description */}
            <div
              style={{
                background: "var(--card-bg)",
                padding: "32px",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
              }}
            >
              <h3 style={{ marginBottom: "20px", color: "var(--text-color)", fontSize: "24px" }}>
                Problem Statement
              </h3>
              <div style={{ lineHeight: "1.8", fontSize: "19px", color: "var(--text-color)" }}>
                {problem.description.split("\n").map((line, i) => (
                  <p key={i} style={{ marginBottom: "16px" }}>{line}</p>
                ))}
              </div>
              {problem.author && (
                <p style={{ fontSize: "16px", color: "var(--muted-text)", marginTop: "24px" }}>
                  Author: {problem.author}
                </p>
              )}
              {problem.reference && (
                <p style={{ fontSize: "16px", color: "var(--muted-text)" }}>
                  Reference: {problem.reference}
                </p>
              )}
            </div>

            {/* RIGHT: Solve Panel */}
            <div
              style={{
                background: "var(--card-bg)",
                padding: "32px",
                borderRadius: "12px",
                border: "1px solid var(--card-border)",
                position: "sticky",
                top: "100px",
              }}
            >
              {/* ── Already Solved ── */}
              {alreadySolved ? (
                <AlreadySolvedBanner timeTaken={prevTimeTaken} />
              ) : (
                <>
                  {/* Timer Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "24px",
                    }}
                  >
                    <h3 style={{ fontSize: "22px", margin: 0 }}>Select the correct answer:</h3>
                    <TimerBadge seconds={elapsed} stopped={isSubmitted} />
                  </div>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {problem.options.map((optText, index) => {
                      const optLabel = String.fromCharCode(65 + index);
                      const isSelected = selectedOption === optText;
                      let status = "neutral";
                      if (isSubmitted) {
                        if (optText === CORRECT_OPTION) status = "correct";
                        else if (isSelected && optText !== CORRECT_OPTION) status = "wrong";
                        else status = "disabled";
                      } else if (isSelected) {
                        status = "selected";
                      }
                      return (
                        <Option
                          key={optLabel}
                          label={optLabel}
                          text={optText}
                          status={status}
                          onClick={() => !isSubmitted && setSelectedOption(optText)}
                        />
                      );
                    })}
                  </div>

                  {/* Submit / Result */}
                  <div style={{ marginTop: "32px" }}>
                    {!isSubmitted ? (
                      <button
                        onClick={handleSubmit}
                        disabled={!selectedOption}
                        style={{
                          padding: "14px 40px",
                          backgroundColor: selectedOption ? "var(--accent)" : "rgba(255,255,255,0.05)",
                          color: selectedOption ? "white" : "var(--muted-text)",
                          border: "none",
                          borderRadius: "8px",
                          cursor: selectedOption ? "pointer" : "not-allowed",
                          fontWeight: "700",
                          fontSize: "18px",
                          transition: "all 0.2s ease",
                          boxShadow: selectedOption ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
                        }}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {/* Correct / Wrong badge */}
                        <span
                          style={{
                            color: isCorrect ? "var(--success)" : "var(--danger)",
                            fontWeight: "800",
                            fontSize: "22px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {isCorrect ? "✅ Correct!" : "❌ Try Again"}
                        </span>

                        {/* Time result card (only on correct) */}
                        {isCorrect && result && (
                          <ResultCard result={result} />
                        )}

                        {/* Retry for wrong answer */}
                        {!isCorrect && (
                          <button
                            onClick={() => { setIsSubmitted(false); setSelectedOption(null); startTimer(); }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--accent)",
                              cursor: "pointer",
                              fontSize: "16px",
                              textAlign: "left",
                              padding: 0,
                            }}
                          >
                            Try another option
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── SOLUTION TAB ── */}
        {activeTab === "solution" && (
          <div style={{ maxWidth: "800px" }}>
            {isSubmitted || alreadySolved ? (
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "32px",
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                }}
              >
                <h3 style={{ color: "var(--success)", marginBottom: "20px", fontSize: "28px" }}>
                  Solution Breakdown
                </h3>
                <p style={{ fontSize: "20px", lineHeight: "1.7" }}>
                  The correct option is <strong>{problem.correctOption}</strong>.
                </p>
                {problem.solution && (
                  <div style={{ marginTop: "20px", fontSize: "18px" }}>{problem.solution}</div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "40px",
                  borderRadius: "12px",
                  border: "1px dashed var(--card-border)",
                  textAlign: "center",
                  color: "var(--muted-text)",
                  fontSize: "20px",
                }}
              >
                🔒 Please submit an answer to unlock the detailed solution.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Tab({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        paddingBottom: "10px",
        cursor: "pointer",
        borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
        color: active ? "var(--text-color)" : "var(--muted-text)",
        fontWeight: active ? "600" : "400",
      }}
    >
      {label}
    </div>
  );
}

function TimerBadge({ seconds, stopped }) {
  const m   = Math.floor(seconds / 60);
  const s   = seconds % 60;
  const str = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: stopped ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.08)",
        border: `1px solid ${stopped ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.2)"}`,
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "17px",
        fontWeight: "700",
        fontVariantNumeric: "tabular-nums",
        color: stopped ? "var(--success)" : "var(--accent)",
        letterSpacing: "1px",
      }}
    >
      <span style={{ fontSize: "13px" }}>{stopped ? "⏹" : "⏱"}</span>
      {str}
    </div>
  );
}

function AlreadySolvedBanner({ timeTaken }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "48px" }}>✅</div>
      <h3 style={{ color: "var(--success)", fontSize: "22px", margin: 0 }}>
        Already Solved!
      </h3>
      {timeTaken != null && (
        <p style={{ color: "var(--muted-text)", fontSize: "16px", margin: 0 }}>
          You solved this in{" "}
          <strong style={{ color: "var(--text-color)" }}>
            {fmtSecs(timeTaken)}
          </strong>
        </p>
      )}
      <p style={{ color: "var(--muted-text)", fontSize: "14px", margin: 0 }}>
        Check the <strong>Solution</strong> tab to review.
      </p>
    </div>
  );
}

function ResultCard({ result }) {
  return (
    <div
      style={{
        marginTop: "8px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--card-border)",
        borderRadius: "10px",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Fast Solve badge */}
      {result.fastSolve && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "linear-gradient(135deg, #f59e0b22, #ef444422)",
            border: "1px solid #f59e0b55",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "13px",
            fontWeight: "700",
            color: "#f59e0b",
            alignSelf: "flex-start",
          }}
        >
          ⚡ Fast Solve!
        </div>
      )}

      <div style={{ display: "flex", gap: "32px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--muted-text)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Your Time
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-color)" }}>
            {result.timeTakenFormatted || "—"}
          </div>
        </div>
        {result.globalAvgTime && (
          <div>
            <div style={{ fontSize: "11px", color: "var(--muted-text)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Global Avg
            </div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--muted-text)" }}>
              {result.globalAvgFormatted || "—"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Option({ label, text, status, onClick }) {
  let borderColor = "var(--card-border)";
  let bgColor     = "transparent";
  let cursor      = "pointer";

  if (status === "selected")  { borderColor = "var(--accent)";   bgColor = "rgba(59,130,246,0.1)"; }
  else if (status === "correct")  { borderColor = "var(--success)"; bgColor = "rgba(34,197,94,0.1)"; cursor = "default"; }
  else if (status === "wrong")    { borderColor = "var(--danger)";  bgColor = "rgba(239,68,68,0.1)"; cursor = "default"; }
  else if (status === "disabled") { borderColor = "var(--nav-border)"; bgColor = "rgba(0,0,0,0.05)"; cursor = "default"; }

  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "16px",
        cursor,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        opacity: status === "disabled" ? 0.5 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `2px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <span>{text}</span>
    </div>
  );
}