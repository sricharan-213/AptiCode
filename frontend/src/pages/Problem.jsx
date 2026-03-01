import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Problem() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("description");
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [problem, setProblem] = useState(null);

  // 🔥 Fetch problem from backend
  useEffect(() => {
    fetch(`http://localhost:5000/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => setProblem(data))
      .catch((err) => console.error("Error fetching problem:", err));
  }, [id]);

  if (!problem) {
    return (
      <div style={{ padding: "100px", color: "white" }}>
        Loading...
      </div>
    );
  }

  const CORRECT_OPTION = problem.correctOption;
  const isCorrect = selectedOption === CORRECT_OPTION;

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    // 🔒 BLOCK IF NOT LOGGED IN
    if (!token) {
      alert("You must be logged in to submit.");
      return;
    }

    if (!selectedOption) return;

    setIsSubmitted(true);

    if (selectedOption === CORRECT_OPTION) {
      try {
        await fetch(`http://localhost:5000/api/users/solve/${id}`, {
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
        padding: "80px 24px 24px 24px",
        color: "var(--text-color)",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <h1 style={{ marginBottom: "8px" }}>{problem.title}</h1>

      <p
        style={{
          color: "var(--muted-text)",
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        Difficulty:{" "}
        <span style={{ color: "var(--success)" }}>
          {problem.difficulty}
        </span>{" "}
        · Topic: {problem.topic}
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          borderBottom: "1px solid var(--card-border)",
          marginBottom: "24px",
        }}
      >
        <Tab label="Description" active={activeTab === "description"} onClick={() => setActiveTab("description")} />
        <Tab label="Solve" active={activeTab === "solve"} onClick={() => setActiveTab("solve")} />
        <Tab label="Solution" active={activeTab === "solution"} onClick={() => setActiveTab("solution")} />
        <Tab label="Discuss" active={activeTab === "discuss"} onClick={() => setActiveTab("discuss")} />
      </div>

      <div style={{ minHeight: "300px" }}>
        {/* DESCRIPTION */}
        {activeTab === "description" && (
          <div style={{ lineHeight: "1.7", fontSize: "16px" }}>
            <h3 style={{ marginBottom: "12px", color: "var(--text-color)" }}>
              Problem Statement
            </h3>

            <p style={{ marginBottom: "20px" }}>
              {problem.description}
            </p>

            {problem.author && (
              <p style={{ fontSize: "14px", color: "var(--muted-text)" }}>
                Author: {problem.author}
              </p>
            )}

            {problem.reference && (
              <p style={{ fontSize: "14px", color: "var(--muted-text)" }}>
                Reference: {problem.reference}
              </p>
            )}
          </div>
        )}

        {/* SOLVE */}
        {activeTab === "solve" && (
          <div>
            <h3 style={{ marginBottom: "20px" }}>
              Choose the correct option:
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

            <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              {!isSubmitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedOption}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: selectedOption ? "var(--accent)" : "rgba(0,0,0,0.1)",
                    opacity: selectedOption ? 1 : 0.6,
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: selectedOption ? "pointer" : "not-allowed",
                    fontWeight: "600",
                  }}
                >
                  Submit
                </button>
              ) : (
                <span
                  style={{
                    color: isCorrect ? "#22c55e" : "#ef4444",
                    fontWeight: "bold",
                    fontSize: "16px",
                  }}
                >
                  {isCorrect ? "Correct Answer!" : "Wrong Answer"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* SOLUTION */}
        {activeTab === "solution" && (
          <div>
            {isSubmitted ? (
              <div>
                <h3 style={{ color: "#22c55e", marginBottom: "16px" }}>
                  Solution Unlocked
                </h3>
                <p>
                  Correct Answer: {problem.correctOption}
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid var(--card-border)",
                  textAlign: "center",
                  color: "var(--muted-text)",
                }}
              >
                🔒 Attempt the problem to unlock solution
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