import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Problems() {
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [problems, setProblems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  useEffect(() => {
    fetch("http://localhost:5000/api/problems")
      .then((res) => res.json())
      .then((data) => setProblems(data))
      .catch((err) => console.error("Error fetching problems:", err));

    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user && data.user.solvedProblems) {
            const ids = data.user.solvedProblems.map((p) => p.problemId?._id || p.problemId);
            setSolvedProblems(ids);
          }
        })
        .catch((err) => console.error("Error fetching user data:", err));
    }
  }, []);

  // Extract unique topics from problems
  const topics = ["All Topics", ...new Set(problems.map((p) => p.topic).filter(Boolean))];

  // Apply all filters
  const filtered = problems.filter((p) => {
    const matchesTopic = selectedTopic === "All Topics" || p.topic === selectedTopic;
    const matchesDifficulty = selectedDifficulty === "All" || p.difficulty === selectedDifficulty;
    const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());

    const isSolved = solvedProblems.includes(p._id);
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Solved" && isSolved) ||
      (selectedStatus === "Unsolved" && !isSolved);

    return matchesTopic && matchesDifficulty && matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: "80px 24px 24px 24px", color: "var(--text-color)", maxWidth: "1600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "16px" }}>Problems</h1>

      {/* Topic Pills Row */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {topics.map((topic) => (
          <TopicPill
            key={topic}
            label={topic}
            active={selectedTopic === topic}
            onClick={() => setSelectedTopic(topic)}
          />
        ))}
      </div>

      {/* Search + Filters Row */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <input
          placeholder="Search problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "var(--input-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "6px",
            color: "var(--text-color)",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "var(--input-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "6px",
            color: "var(--text-color)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "6px",
            color: "white",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <option value="All">All Status</option>
          <option value="Solved">Solved</option>
          <option value="Unsolved">Unsolved</option>
        </select>
      </div>

      {/* Results count */}
      <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>
        Showing {filtered.length} of {problems.length} problems
      </p>

      {/* Problems List */}
      <div>
        {filtered.length > 0 ? (
          filtered.map((problem) => (
            <ProblemRow
              key={problem._id}
              id={problem._id}
              title={problem.title}
              difficulty={problem.difficulty}
              topic={problem.topic}
              solved={solvedProblems.includes(problem._id)}
            />
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            No problems match your filters.
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Helper components --- */

function TopicPill({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "16px",
        background: active ? "var(--accent)" : "var(--card-bg)",
        border: active ? "1px solid var(--accent)" : "1px solid var(--card-border)",
        color: active ? "white" : "var(--text-color)",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: active ? "600" : "400",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </div>
  );
}

function ProblemRow({ id, title, difficulty, topic, solved }) {
  const navigate = useNavigate();

  const difficultyColor =
    difficulty === "Easy"
      ? "#22c55e"
      : difficulty === "Medium"
        ? "#eab308"
        : "#ef4444";

  return (
    <div
      onClick={() => navigate(`/problem/${id}`)}
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr 140px 100px",
        alignItems: "center",
        padding: "14px 8px",
        borderBottom: "1px solid var(--card-border)",
        cursor: "pointer",
        color: "var(--text-color)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--row-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {/* Solved Indicator */}
      <span style={{ color: solved ? "#22c55e" : "#6b7280" }}>
        {solved ? "✓" : "•"}
      </span>

      {/* Title */}
      <span style={{ fontSize: "15px" }}>{title}</span>

      {/* Topic */}
      <span style={{ fontSize: "13px", color: "#6b7280" }}>{topic}</span>

      {/* Difficulty */}
      <span
        style={{
          fontSize: "14px",
          color: difficultyColor,
          textAlign: "right",
          fontWeight: "600",
        }}
      >
        {difficulty}
      </span>
    </div>
  );
}