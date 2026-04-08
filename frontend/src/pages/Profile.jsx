import { useState, useEffect } from "react";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [ranks, setRanks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch("https://apticode-backend.onrender.com/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserData(data.user);
        setRanks(data.ranks);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "100px 24px", color: "var(--muted-text)", textAlign: "center" }}>
        Loading profile...
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ padding: "100px 24px", color: "var(--muted-text)", textAlign: "center" }}>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "12px" }}>Not Logged In</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const initials = userData.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const stats          = userData.stats || {};
  const solvedProblems = userData.solvedProblems || [];

  const fmtSecs = (s) => {
    if (!s && s !== 0) return "—";
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // Helper: format relative time (e.g., 2 hours ago)
  const formatTimeAgo = (date) => {
    if (!date) return "";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + "d ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + "h ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + "m ago";
    return Math.floor(seconds) + "s ago";
  };


  return (
    <div style={{ padding: "80px 24px 40px 24px", color: "var(--text-color)", maxWidth: "1600px", margin: "0 auto" }}>

      {/* ═══════ Profile Header ═══════ */}
      <div style={{
        background: "var(--profile-header-bg)",
        borderRadius: "20px",
        padding: "32px 36px",
        marginBottom: "24px",
        border: "1px solid var(--profile-header-border)",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "var(--profile-glow)",
      }}>
        {/* Decorative glow — only visible in dark mode via CSS var opacity */}
        <div style={{
          position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px",
          background: "var(--glow-accent)", borderRadius: "50%",
        }} />
        {/* Avatar */}
        <ProfileAvatar name={userData.name} initials={initials} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "700", color: "var(--text-primary)" }}>{userData.name}</h1>
          <p style={{ color: "var(--muted-text)", margin: "4px 0 0 0", fontSize: "14px" }}>{userData.email}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "13px", color: "var(--muted-text)" }}>Overall Rank</div>
          <div style={{
            fontSize: "32px", fontWeight: "800",
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>#{ranks?.overallRank || "—"}</div>
        </div>
      </div>

      {/* ═══════ Stats Row: Donut + Mini Stats ═══════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

        {/* Donut Card */}
        <GlassCard>
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <DonutChart
              total={stats.totalSolved ?? 0}
              easy={stats.easySolved ?? 0}
              medium={stats.mediumSolved ?? 0}
              hard={stats.hardSolved ?? 0}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <DiffBadge label="Easy" val={stats.easySolved ?? 0} color="#22c55e" rank={ranks?.easyRank} />
              <DiffBadge label="Medium" val={stats.mediumSolved ?? 0} color="#f59e0b" rank={ranks?.mediumRank} />
              <DiffBadge label="Hard" val={stats.hardSolved ?? 0} color="#ef4444" rank={ranks?.hardRank} />
            </div>
          </div>
        </GlassCard>

        {/* Mini Stats Card */}
        <GlassCard>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "100%", alignContent: "center" }}>
            <GlowStat icon="⚡" value={stats.xp ?? 0}              label="Total XP"      glow="#f59e0b" />
            <GlowStat icon="🔥" value={`${stats.streak ?? 0}d`}   label="Current Streak" glow="#ef4444" />
            <GlowStat icon="🏆" value={stats.maxStreak ?? 0}       label="Max Streak"    glow="#a855f7" />
            <GlowStat icon="✅" value={stats.totalSolved ?? 0}     label="Solved"        glow="#22c55e" />
          </div>
        </GlassCard>
      </div>

      {/* ═══════ Performance Card ═══════ */}
      <GlassCard style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)" }}>
          ⚡ Performance
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {/* Rank Score */}
          <div style={{
            textAlign: "center", padding: "16px 8px",
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "12px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--muted-text)", fontWeight: "500", marginBottom: "6px" }}>Rank Score</div>
            <div style={{
              fontSize: "26px", fontWeight: "800",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{(stats.rankScore ?? 0).toFixed(1)}</div>
            {ranks?.scoreRank && (
              <div style={{ fontSize: "11px", color: "var(--muted-text)", marginTop: "4px" }}>#{ranks.scoreRank} globally</div>
            )}
          </div>
          {/* Avg Easy */}
          <AvgTimeCard label="Avg Easy" time={fmtSecs(stats.avgEasyTime)} color="#22c55e" />
          {/* Avg Medium */}
          <AvgTimeCard label="Avg Medium" time={fmtSecs(stats.avgMediumTime)} color="#f59e0b" />
          {/* Avg Hard */}
          <AvgTimeCard label="Avg Hard" time={fmtSecs(stats.avgHardTime)} color="#ef4444" />
        </div>
      </GlassCard>

      {/* ═══════ Heatmap ═══════ */}
      <GlassCard style={{ marginBottom: "24px" }}>
        <Heatmap solvedProblems={solvedProblems} maxStreak={stats.maxStreak ?? 0} />
      </GlassCard>

      {/* ═══════ Rank Badges ═══════ */}
      <GlassCard style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)" }}>
          🏅 Rank Breakdown
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          <RankBadge label="Overall" rank={ranks?.overallRank} color="#6366f1" />
          <RankBadge label="Easy"    rank={ranks?.easyRank}    color="#22c55e" />
          <RankBadge label="Medium"  rank={ranks?.mediumRank}  color="#f59e0b" />
          <RankBadge label="Hard"    rank={ranks?.hardRank}    color="#ef4444" />
          <RankBadge label="Score"   rank={ranks?.scoreRank}   color="#a855f7" />
        </div>
      </GlassCard>

      {/* ═══════ Solved Problems List ═══════ */}
      <GlassCard>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)" }}>
          ✅ Solved Problems ({solvedProblems.length})
        </h3>
        {solvedProblems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {solvedProblems.map((sp, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", background: "var(--row-hover)", borderRadius: "8px",
                border: "1px solid var(--border)",
              }}>
                <span style={{ color: "var(--success)", marginRight: "10px", fontSize: "13px" }}>✓</span>
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between", marginRight: "20px" }}>
                  <span style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: "500" }}>
                    {sp.problemId?.title || "Unknown Problem"}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--muted-text)" }}>
                    {formatTimeAgo(sp.solvedAt)}
                  </span>
                </div>
                <span style={{
                  fontSize: "12px", fontWeight: "600", padding: "2px 10px", borderRadius: "10px",
                  background: sp.difficulty === "Easy" ? "rgba(34,197,94,0.12)" : sp.difficulty === "Medium" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                  color: sp.difficulty === "Easy" ? "#22c55e" : sp.difficulty === "Medium" ? "#f59e0b" : "#ef4444",
                  minWidth: "60px", textAlign: "center"
                }}>
                  {sp.difficulty}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted-text)", fontSize: "14px" }}>No problems solved yet. Start solving!</p>
        )}
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════
   🔹 Glass Card Wrapper
═══════════════════════════════════ */
/* ─── ProfileAvatar ─────────────────────────────── */
function ProfileAvatar({ name, initials }) {
  const hue = name
    ? [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 250;
  return (
    <div style={{
      width: "72px", height: "72px", borderRadius: "50%",
      background: `hsl(${hue}, 65%, 52%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "28px", fontWeight: "800", color: "white",
      flexShrink: 0, userSelect: "none",
      boxShadow: "var(--profile-glow)",
    }}>
      {initials}
    </div>
  );
}

function GlassCard({ children, style }) {
  return (
    <div style={{
      background: "var(--card-bg)",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid var(--card-border)",
      boxShadow: "var(--card-shadow)",
      transition: "background-color 0.25s ease, border-color 0.25s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════
   🔹 Donut Chart (SVG)
═══════════════════════════════════ */
function DonutChart({ total, easy, medium, hard }) {
  const size = 140;
  const strokeWidth = 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [];
  if (total > 0) {
    let offset = 0;
    if (easy > 0) { segments.push({ pct: easy / total, color: "#22c55e", offset }); offset += easy / total; }
    if (medium > 0) { segments.push({ pct: medium / total, color: "#f59e0b", offset }); offset += medium / total; }
    if (hard > 0) { segments.push({ pct: hard / total, color: "#ef4444", offset }); }
  }

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${seg.pct * circumference} ${circumference}`}
            strokeDashoffset={-seg.offset * circumference}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${seg.color}66)` }}
          />
        ))}
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-color)" }}>{total}</span>
        <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: "500" }}>✓ Solved</span>
      </div>
    </div>
  );
}

function DiffBadge({ label, val, color, rank }) {
  return (
    <div style={{
      padding: "8px 16px", background: "var(--row-hover)", border: `1px solid ${color}44`,
      borderRadius: "10px", minWidth: "110px", display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <div style={{ fontSize: "11px", color, fontWeight: "700", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-primary)" }}>{val}</div>
      </div>
      {rank && <div style={{ fontSize: "11px", color: "var(--muted-text)" }}>#{rank}</div>}
    </div>
  );
}

function GlowStat({ icon, value, label, glow }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: "22px", marginBottom: "6px", filter: `drop-shadow(0 0 6px ${glow}44)` }}>{icon}</div>
      <div style={{ fontSize: "22px", fontWeight: "800", marginBottom: "2px", color: "var(--text-color)" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "var(--muted-text)", fontWeight: "500" }}>{label}</div>
    </div>
  );
}

function RankBadge({ label, rank, color }) {
  return (
    <div style={{
      textAlign: "center", padding: "14px 8px",
      background: `${color}08`, border: `1px solid ${color}20`,
      borderRadius: "12px",
    }}>
      <div style={{ fontSize: "24px", fontWeight: "800", color, marginBottom: "4px" }}>
        #{rank || "—"}
      </div>
      <div style={{ fontSize: "12px", color: "var(--muted-text)", fontWeight: "500" }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════
   🔹 Activity Heatmap (Real data)
═══════════════════════════════════ */
function Heatmap({ solvedProblems, maxStreak }) {
  const toLocalDateStr = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const dateCountMap = {};
  let totalSubmissions = 0;
  const activeDaysSet = new Set();

  solvedProblems.forEach((sp) => {
    if (sp.solvedAt) {
      const dateStr = toLocalDateStr(sp.solvedAt);
      dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
      activeDaysSet.add(dateStr);
      totalSubmissions += 1;
    }
  });

  // Current streak from sorted dates
  const sortedDates = [...activeDaysSet].sort();
  let calcMaxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { currentStreak = 1; }
    else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      currentStreak = Math.round((curr - prev) / 86400000) === 1 ? currentStreak + 1 : 1;
    }
    calcMaxStreak = Math.max(calcMaxStreak, currentStreak);
  }

  // Generate 52 weeks ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (52 * 7 + today.getDay()));

  const weeks = [];
  const monthLabels = [];
  let cur = new Date(startDate);
  let lastMonth = -1;

  while (cur <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (cur <= today) {
        const ds = toLocalDateStr(cur);
        week.push({ date: ds, count: dateCountMap[ds] || 0 });
        const mo = cur.getMonth();
        if (mo !== lastMonth && d === 0) {
          monthLabels.push({ weekIndex: weeks.length, label: cur.toLocaleString("default", { month: "short" }) });
          lastMonth = mo;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const getColor = (c) => {
    if (c === 0) return "var(--heatmap-empty)";
    if (c === 1) return "#155e2d";
    if (c === 2) return "#16a34a";
    if (c <= 4) return "#22c55e";
    return "#4ade80";
  };

  const cs = 13, gap = 3;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
          <span style={{
            fontSize: "20px", fontWeight: "800",
            background: "linear-gradient(90deg, var(--success), var(--accent))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{totalSubmissions}</span>
          <span style={{ color: "var(--muted-text)", fontWeight: "400" }}> submissions in the past year</span>
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--muted-text)" }}>
          <span>Active days: <strong style={{ color: "var(--text-primary)" }}>{activeDaysSet.size}</strong></span>
          <span>Max streak: <strong style={{ color: "var(--text-primary)" }}>{maxStreak || calcMaxStreak}</strong></span>
        </div>
      </div>

      {/* Month Labels */}
      <div style={{ display: "flex", paddingLeft: "0px", marginBottom: "4px", height: "16px", position: "relative" }}>
        {monthLabels.map((ml, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${ml.weekIndex * (cs + gap)}px`,
            fontSize: "11px", color: "var(--muted-text)",
          }}>
            {ml.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "flex", gap: `${gap}px`, overflowX: "auto", paddingBottom: "8px" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
            {week.map((day, di) => (
              <div
                key={di}
                style={{
                  width: `${cs}px`, height: `${cs}px`, borderRadius: "3px",
                  backgroundColor: getColor(day.count),
                  boxShadow: day.count > 0 ? `0 0 4px ${getColor(day.count)}66` : "none",
                  transition: "transform 0.15s",
                  cursor: day.count > 0 ? "pointer" : "default",
                }}
                title={`${day.date}: ${day.count} solve${day.count !== 1 ? "s" : ""}`}
                onMouseEnter={(e) => day.count > 0 && (e.currentTarget.style.transform = "scale(1.5)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "11px", color: "var(--muted-text)", marginRight: "4px" }}>Less</span>
        {["var(--heatmap-empty)", "#155e2d", "#16a34a", "#22c55e", "#4ade80"].map((c, i) => (
          <div key={i} style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: c }} />
        ))}
        <span style={{ fontSize: "11px", color: "var(--muted-text)", marginLeft: "4px" }}>More</span>
      </div>
    </div>
  );
}

function AvgTimeCard({ label, time, color }) {
  return (
    <div style={{
      textAlign: "center", padding: "16px 8px",
      background: `${color}10`, border: `1px solid ${color}30`,
      borderRadius: "12px",
    }}>
      <div style={{ fontSize: "11px", color: "var(--muted-text)", fontWeight: "500", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "800", color }}>{time}</div>
      <div style={{ fontSize: "11px", color: "var(--muted-text)", marginTop: "4px" }}>avg solve time</div>
    </div>
  );
}
