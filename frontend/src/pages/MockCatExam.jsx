import { useState, useEffect } from "react";

export default function MockCatExam() {
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mock/cat_mock_1");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTestData(data);
      } catch (err) {
        setError("Failed to load test");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "80px 24px", color: "#9ca3af", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "80px 24px", color: "#ef4444", textAlign: "center" }}>
        {error}
      </div>
    );
  }

  const section = testData.sections[0];
  const question = section.questions[0];

  return (
    <div style={{ padding: "80px 24px 40px 24px", color: "white", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "4px" }}>CAT 2026 — Mock Exam</h1>
      <p style={{ color: "#6b7280", marginBottom: "32px", fontSize: "14px" }}>
        {testData.title || "Mock Test"}
      </p>

      {/* Section name */}
      <div style={{
        display: "inline-block",
        padding: "4px 14px",
        borderRadius: "20px",
        background: "#1e3a5f",
        color: "#60a5fa",
        fontSize: "13px",
        fontWeight: "600",
        marginBottom: "24px"
      }}>
        Section: {section.name}
      </div>

      {/* Question card */}
      <div style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "10px",
        padding: "24px",
      }}>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "10px" }}>
          Q1 &nbsp;·&nbsp; {question.type}
        </p>
        <p style={{ fontSize: "16px", lineHeight: "1.7", marginBottom: "24px" }}>
          {question.text}
        </p>

        {/* MCQ radio options */}
        {question.type === "MCQ" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {question.options.map((opt, i) => (
              <label key={i} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="radio" name="option" value={opt} style={{ accentColor: "#2563eb" }} />
                <span style={{ fontSize: "15px" }}>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {/* TITA numeric input */}
        {question.type === "TITA" && (
          <input
            type="number"
            placeholder="Type your answer..."
            style={{
              padding: "10px 14px",
              background: "#262626",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "white",
              fontSize: "15px",
              width: "200px",
              outline: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
