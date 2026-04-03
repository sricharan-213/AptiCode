import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Problem() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("problem");
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [problem, setProblem] = useState(null);

  // 🔥 Fetch problem from backend
  useEffect(() => {
    fetch(`https://apticode-backend.onrender.com/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => setProblem(data))
      .catch((err) => console.error("Error fetching problem:", err));
  }, [id]);

  if (!problem) {
    return (
      <div style={{ padding: "100px", color: "white", fontSize: "20px" }}>
        Loading...
      </div>
    );
  }

  const CORRECT_OPTION = problem.correctOption;
  const isCorrect = selectedOption === CORRECT_OPTION;

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to submit.");
      return;
    }

    if (!selectedOption) return;

    setIsSubmitted(true);

    if (selectedOption === CORRECT_OPTION) {
      try {
        await fetch(`https://apticode-backend.onrender.com/api/users/solve/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Error recording solve:", err);
      }
    }
  };

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
      <h1 style={{ marginBottom: "12px", fontSize: "36px", fontWeight: "700" }}>{problem.title}</h1>

      <p
        style={{
          color: "var(--muted-text)",
          marginBottom: "32px",
          fontSize: "18px",
        }}
      >
        Difficulty:{" "}
        <span style={{ color: "var(--success)", fontWeight: "600" }}>
          {problem.difficulty}
        </span>{" "}
        · Topic: <span style={{ color: "var(--text-color)" }}>{problem.topic}</span>
      </p>

      {/* Tabs for secondary content */}
      <div
        style={{
          display: "flex",
          gap: "32px",
          borderBottom: "1px solid var(--card-border)",
          marginBottom: "32px",
        }}
      >
        <Tab label="Problem" active={activeTab === "problem"} onClick={() => setActiveTab("problem")} />
        <Tab label="Solution" active={activeTab === "solution"} onClick={() => setActiveTab("solution")} />
        <Tab label="Discuss" active={activeTab === "discuss"} onClick={() => setActiveTab("discuss")} />
      </div>

      <div style={{ minHeight: "500px" }}>
        {/* PROBLEM SPLIT VIEW */}
        {activeTab === "problem" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
              alignItems: "start"
            }}
          >
            {/* LEFT: DESCRIPTION */}
            <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
              <h3 style={{ marginBottom: "20px", color: "var(--text-color)", fontSize: "24px" }}>
                Problem Statement
              </h3>

              <div style={{ lineHeight: "1.8", fontSize: "19px", color: "var(--text-color)" }}>
                {problem.description.split('\n').map((line, i) => (
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

            {/* RIGHT: SOLVE PANEL */}
            <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "12px", border: "1px solid var(--card-border)", position: "sticky", top: "100px" }}>
              <h3 style={{ marginBottom: "24px", fontSize: "24px" }}>
                Select the correct answer:
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {problem.options.map((optText, index) => {
                  const optLabel = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = selectedOption === optText;

                  let status = "neutral";

                  if (isSubmitted) {
                    if (optText === CORRECT_OPTION) status = "correct";
                    else if (isSelected && optText !== CORRECT_OPTION) status = "wrong";
                    else status = "disabled";
                  } else {
                    if (isSelected) status = "selected";
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

              <div style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "20px" }}>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span
                      style={{
                        color: isCorrect ? "var(--success)" : "var(--danger)",
                        fontWeight: "800",
                        fontSize: "22px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      {isCorrect ? "✅ Correct!" : "❌ Try Again"}
                    </span>
                    {!isCorrect && <button onClick={() => { setIsSubmitted(false); setSelectedOption(null); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "16px", textAlign: "left", padding: 0 }}>Try another option</button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SOLUTION */}
        {activeTab === "solution" && (
          <div style={{ maxWidth: "800px" }}>
            {isSubmitted ? (
              <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "12px", border: "1px solid var(--card-border)" }}>
                <h3 style={{ color: "var(--success)", marginBottom: "20px", fontSize: "28px" }}>
                  Solution Breakdown
                </h3>
                <p style={{ fontSize: "20px", lineHeight: "1.7" }}>
                  The correct option is <strong>{problem.correctOption}</strong>.
                </p>
                {/* Assuming problem might have a solution property eventually */}
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
                  fontSize: "20px"
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

/* ---------- Components ---------- */

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

function Option({ label, text, status, onClick }) {
  let borderColor = "var(--card-border)";
  let bgColor = "transparent";
  let cursor = "pointer";

  if (status === "selected") {
    borderColor = "var(--accent)";
    bgColor = "rgba(59, 130, 246, 0.1)";
  } else if (status === "correct") {
    borderColor = "var(--success)";
    bgColor = "rgba(34, 197, 94, 0.1)";
    cursor = "default";
  } else if (status === "wrong") {
    borderColor = "var(--danger)";
    bgColor = "rgba(239, 68, 68, 0.1)";
    cursor = "default";
  } else if (status === "disabled") {
    cursor = "default";
    borderColor = "var(--nav-border)";
    bgColor = "rgba(0,0,0,0.05)";
  }

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
        }}
      >
        {label}
      </div>
      <span>{text}</span>
    </div>
  );
}