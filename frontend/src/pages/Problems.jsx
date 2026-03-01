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
    <div style={{ padding: "100px 32px 32px 32px", color: "var(--text-color)", maxWidth: "1600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px", fontSize: "42px", fontWeight: "800" }}>Problems</h1>

      {/* Topic Pills Row */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "32px",
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
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <input
          placeholder="Search problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "14px 18px",
            background: "var(--input-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            color: "var(--text-color)",
            fontSize: "17px",
            outline: "none",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.target.style.borderColor = "var(--card-border)"}
        />

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          style={{
            padding: "14px 18px",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            color: "var(--text-color)",
            fontSize: "17px",
            cursor: "pointer",
            outline: "none",
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
            padding: "14px 18px",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            color: "var(--text-color)",
            fontSize: "17px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="All">All Status</option>
          <option value="Solved">Solved</option>
          <option value="Unsolved">Unsolved</option>
        </select>
      </div>

      {/* Results count */}
      <p style={{ color: "var(--muted-text)", fontSize: "16px", marginBottom: "16px", fontWeight: "500" }}>
        Showing {filtered.length} of {problems.length} problems
      </p>

      {/* Problems List */}
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "40px 1fr 200px 120px",
          padding: "18px 24px",
          borderBottom: "2px solid var(--card-border)",
          background: "rgba(255,255,255,0.02)",
          fontSize: "15px",
          fontWeight: "700",
          color: "var(--muted-text)",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          <span></span>
          <span>Title</span>
          <span>Topic</span>
          <span style={{ textAlign: "right" }}>Difficulty</span>
        </div>
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
          <div style={{ textAlign: "center", padding: "60px", color: "var(--muted-text)", fontSize: "18px" }}>
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
        padding: "10px 20px",
        borderRadius: "24px",
        background: active ? "var(--accent)" : "var(--card-bg)",
        border: active ? "1px solid var(--accent)" : "1px solid var(--card-border)",
        color: active ? "white" : "var(--text-color)",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: active ? "700" : "500",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: active ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
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
      ? "var(--success)"
      : difficulty === "Medium"
        ? "#eab308"
        : "var(--danger)";

  return (
    <div
      onClick={() => navigate(`/problem/${id}`)}
      style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr 200px 120px",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid var(--card-border)",
        cursor: "pointer",
        color: "var(--text-color)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--row-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {/* Solved Indicator */}
      <span style={{ color: solved ? "var(--success)" : "var(--muted-text)", fontSize: "20px" }}>
        {solved ? "✓" : "•"}
      </span>

      {/* Title */}
      <span style={{ fontSize: "18px", fontWeight: "600" }}>{title}</span>

      {/* Topic */}
      <span style={{ fontSize: "16px", color: "var(--muted-text)" }}>{topic}</span>

      {/* Difficulty */}
      <span
        style={{
          fontSize: "16px",
          color: difficultyColor,
          textAlign: "right",
          fontWeight: "700",
        }}
      >
        {difficulty}
      </span>
    </div>
  );
}