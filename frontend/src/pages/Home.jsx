import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [problemCount, setProblemCount] = useState(0);

  useEffect(() => {
    fetch("https://apticode-backend.onrender.com/api/problems")
      .then((res) => res.json())
      .then((data) => setProblemCount(data.length))
      .catch(() => { });
  }, []);

  // Logged-in users see the dashboard view
  if (user) {
    return <LoggedInHome user={user} problemCount={problemCount} navigate={navigate} />;
  }

  // Guests see the landing page
  return <GuestHome problemCount={problemCount} navigate={navigate} />;
}

/* =========================================
   🔹 LOGGED-IN: Dashboard with News & Stats
========================================= */
function LoggedInHome({ user, problemCount, navigate }) {
  return (
    <div style={{ padding: "80px 24px 40px 24px", color: "var(--text-color)", maxWidth: "1600px", margin: "0 auto" }}>

      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f, var(--nav-bg))",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "32px",
        border: "1px solid var(--nav-border)",
      }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>
          Welcome back, {user.name} 👋
        </h1>
        <p style={{ color: "var(--muted-text)", fontSize: "16px", marginBottom: "20px" }}>
          Keep up the momentum — consistency is key to cracking aptitude exams.
        </p>
        <button
          onClick={() => navigate("/problems")}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Continue Solving →
        </button>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
        <QuickStat value={problemCount} label="Total Problems" icon="📝" />
        <QuickStat value="3" label="Difficulty Levels" icon="📊" />
        <QuickStat value="Daily" label="New Problems" icon="🔥" />
      </div>

      {/* Aptitude Exam News */}
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        📰 Aptitude Exam Updates
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
        <NewsCard
          tag="CAT 2026"
          tagColor="#2563eb"
          title="CAT 2026 Registration Opens in August — Key Dates Announced"
          desc="IIM Calcutta to conduct CAT 2026. Expected exam date: Last week of November. Registration window: Aug 2 – Sep 20."
          time="2 hours ago"
        />
        <NewsCard
          tag="SSC CGL"
          tagColor="#ec4899"
          title="SSC CGL 2026 Tier-1 Cutoff Expected to Rise by 5-8 Marks"
          desc="Based on difficulty analysis, the General category cutoff for SSC CGL is projected at 145-150 marks this year."
          time="5 hours ago"
        />
        <NewsCard
          tag="Banking"
          tagColor="#16a34a"
          title="IBPS PO 2026 Prelims — Quant Section Analysis & Cutoff"
          desc="Quantitative Aptitude section was moderate. Expected sectional cutoff: 8-10 marks. Key topics: DI, Simplification, Number Series."
          time="1 day ago"
        />
        <NewsCard
          tag="GATE 2026"
          tagColor="#ca8a04"
          title="GATE 2026 Aptitude Section — 15 Marks Now Mandatory"
          desc="General Aptitude section carries 15 marks across all papers. Focus areas: Verbal Ability, Numerical Computation, Data Interpretation."
          time="2 days ago"
        />
        <NewsCard
          tag="Placements"
          tagColor="#8b5cf6"
          title="TCS NQT 2026 — Aptitude Cutoff & Preparation Strategy"
          desc="TCS NQT aptitude section cutoff expected around 65-70%. Focus on Quant, Logical Reasoning, and Verbal Ability for best results."
          time="3 days ago"
        />
      </div>

      {/* Exam Cutoffs Table */}
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        📋 Recent Exam Cutoffs
      </h2>
      <div style={{ background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--card-border)", overflow: "hidden", marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", background: "rgba(0,0,0,0.05)" }}>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--muted-text)", fontWeight: "600" }}>Exam</th>
              <th style={{ padding: "14px 16px", textAlign: "left", color: "var(--muted-text)", fontWeight: "600" }}>Category</th>
              <th style={{ padding: "14px 16px", textAlign: "right", color: "var(--muted-text)", fontWeight: "600" }}>Cutoff</th>
              <th style={{ padding: "14px 16px", textAlign: "right", color: "var(--muted-text)", fontWeight: "600" }}>Year</th>
            </tr>
          </thead>
          <tbody>
            <CutoffRow exam="CAT" category="General" cutoff="99+ percentile" year="2025" />
            <CutoffRow exam="SSC CGL Tier-1" category="General" cutoff="142.5 marks" year="2025" />
            <CutoffRow exam="IBPS PO Prelims" category="General" cutoff="48.25 marks" year="2025" />
            <CutoffRow exam="TCS NQT" category="All" cutoff="65% aggregate" year="2025" />
            <CutoffRow exam="GATE (CS)" category="General" cutoff="32.5 marks" year="2025" />
            <CutoffRow exam="SBI PO Prelims" category="General" cutoff="52.50 marks" year="2025" />
          </tbody>
        </table>
      </div>

      {/* Tips Section */}
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        💡 Daily Tip
      </h2>
      <div style={{
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        borderRadius: "12px",
        padding: "24px",
        border: "1px solid var(--card-border)",
      }}>
        <p style={{ fontSize: "16px", lineHeight: "1.7", color: "#e5e7eb", marginBottom: "8px" }}>
          "For Time & Work problems, always convert work into per-day units first. If A finishes in 10 days,
          A does <strong style={{ color: "var(--accent)" }}>1/10</strong> of the work per day. This simplification makes
          combined-work problems much easier."
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>— AptiCode Daily Tips</p>
      </div>
    </div>
  );
}

/* =========================================
   🔹 GUEST: Landing Page
 ========================================= */
function GuestHome({ problemCount, navigate }) {
  return (
    <div style={{ padding: "80px 24px 40px 24px", color: "var(--text-color)", maxWidth: "1600px", margin: "0 auto" }}>

      {/* Hero Section */}
      <div style={{ textAlign: "center", padding: "60px 0 50px 0" }}>
        <div style={{ fontSize: "14px", color: "var(--accent)", fontWeight: "600", letterSpacing: "2px", marginBottom: "16px", textTransform: "uppercase" }}>
          Aptitude Preparation Platform
        </div>
        <h1 style={{ fontSize: "48px", fontWeight: "800", lineHeight: "1.2", marginBottom: "20px" }}>
          Master Aptitude with{" "}
          <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AptiCode
          </span>
        </h1>
        <p style={{ color: "var(--muted-text)", fontSize: "18px", maxWidth: "800px", margin: "0 auto 36px auto", lineHeight: "1.7" }}>
          Practice aptitude problems, track your progress, compete with others — all in one platform built for placement prep.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/problems")}
            style={{
              padding: "14px 32px",
              background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Start Solving →
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "14px 32px",
              background: "transparent",
              color: "var(--text-color)",
              border: "1px solid var(--card-border)",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#666")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "60px", textAlign: "center" }}>
        <StatBadge value={problemCount} label="Problems Available" />
        <StatBadge value="3" label="Difficulty Levels" />
        <StatBadge value="∞" label="Practice Sessions" />
      </div>

      {/* Feature Cards */}
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", textAlign: "center" }}>
        Why AptiCode?
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "60px" }}>
        <FeatureCard icon="📝" title="Practice Smart" desc="Curated aptitude problems across topics like Arithmetic, Algebra, Logical Reasoning, and Data Interpretation." color="var(--accent)" />
        <FeatureCard icon="📊" title="Track Progress" desc="See your solved count, XP, streak, and per-difficulty rankings on your personal profile page." color="var(--success)" />
        <FeatureCard icon="🏆" title="Compete & Rank" desc="Leaderboard rankings across all users — climb the ranks by solving more problems consistently." color="var(--warning)" />
      </div>

      {/* How It Works */}
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px", textAlign: "center" }}>
        How It Works
      </h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap", marginBottom: "60px" }}>
        <StepCard number="1" title="Sign Up" desc="Create your free account in seconds" />
        <StepCard number="2" title="Solve" desc="Pick problems by topic or difficulty" />
        <StepCard number="3" title="Grow" desc="Track stats and climb the leaderboard" />
      </div>

      {/* CTA */}
      <div style={{
        textAlign: "center",
        background: "linear-gradient(135deg, #1e3a5f, var(--nav-bg))",
        borderRadius: "16px",
        padding: "48px 24px",
        border: "1px solid var(--nav-border)",
      }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "12px" }}>Ready to level up?</h2>
        <p style={{ color: "var(--muted-text)", marginBottom: "24px" }}>Join hundreds of students preparing for placements.</p>
        <button
          onClick={() => navigate("/signup")}
          style={{
            padding: "14px 40px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Get Started Free
        </button>
      </div>
    </div>
  );
}

/* =========================================
   🔹 Shared Helper Components
 ========================================= */

function QuickStat({ value, label, icon }) {
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: "12px", padding: "20px", border: "1px solid var(--card-border)", textAlign: "center" }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--accent)", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "var(--muted-text)" }}>{label}</div>
    </div>
  );
}

function NewsCard({ tag, tagColor, title, desc, time }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: "10px",
        padding: "20px",
        border: "1px solid var(--card-border)",
        transition: "border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--muted-text)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--card-border)")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{
          padding: "3px 10px",
          borderRadius: "12px",
          background: `${tagColor}22`,
          color: tagColor,
          fontSize: "12px",
          fontWeight: "600",
        }}>
          {tag}
        </span>
        <span style={{ color: "var(--muted-text)", fontSize: "12px", marginLeft: "auto" }}>{time}</span>
      </div>
      <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px", lineHeight: "1.4" }}>{title}</h3>
      <p style={{ color: "var(--muted-text)", fontSize: "13px", lineHeight: "1.5" }}>{desc}</p>
    </div>
  );
}

function CutoffRow({ exam, category, cutoff, year }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
      <td style={{ padding: "12px 16px", fontWeight: "500" }}>{exam}</td>
      <td style={{ padding: "12px 16px", color: "var(--muted-text)" }}>{category}</td>
      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--accent)", fontWeight: "600" }}>{cutoff}</td>
      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--muted-text)" }}>{year}</td>
    </tr>
  );
}

function StatBadge({ value, label }) {
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: "12px", padding: "24px", border: "1px solid var(--card-border)" }}>
      <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--accent)", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "var(--muted-text)" }}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }) {
  return (
    <div
      style={{
        background: "var(--card-bg)",
        borderRadius: "12px",
        padding: "28px",
        border: "1px solid var(--card-border)",
        transition: "border-color 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ fontSize: "32px", marginBottom: "16px" }}>{icon}</div>
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>{title}</h3>
      <p style={{ color: "var(--muted-text)", fontSize: "14px", lineHeight: "1.6" }}>{desc}</p>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div style={{ textAlign: "center", maxWidth: "200px" }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", fontWeight: "bold", margin: "0 auto 12px auto",
        color: "white"
      }}>
        {number}
      </div>
      <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>{title}</h4>
      <p style={{ color: "var(--muted-text)", fontSize: "13px" }}>{desc}</p>
    </div>
  );
}
