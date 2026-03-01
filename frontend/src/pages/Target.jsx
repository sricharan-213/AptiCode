export default function Target() {
  return (
    <div style={{ padding: "80px 24px 24px 24px", color: "white", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "8px" }}>Your Targets</h1>
      <p style={{ color: "#9ca3af", marginBottom: "40px" }}>Select an exam goal to get a personalized study plan.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        <ExamCard
          title="CAT 2026"
          desc="Common Admission Test for MBA"
          color="#2563eb"
          status="Active"
        />
        <ExamCard
          title="SSC CGL"
          desc="Combined Graduate Level Exam"
          color="#ec4899"
          status="Start"
        />
        <ExamCard
          title="Banking PO"
          desc="IBPS / SBI Probationary Officer"
          color="#16a34a"
          status="Start"
        />
        <ExamCard
          title="JEE Advanced"
          desc="Joint Entrance Examination"
          color="#ca8a04"
          status="Locked"
        />
      </div>
    </div>
  );
}

function ExamCard({ title, desc, color, status }) {
  return (
    <div style={{
      background: "#262626",
      borderRadius: "12px",
      padding: "24px",
      border: "1px solid #333",
      transition: "transform 0.2s",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden"
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#333";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "8px",
        backgroundColor: `${color}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "16px",
        fontSize: "24px",
        color: color
      }}>
        🎯
      </div>

      <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>{title}</h3>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>{desc}</p>

      <div style={{
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: "20px",
        backgroundColor: status === "Active" ? color : "#333",
        color: status === "Active" ? "white" : "#9ca3af",
        fontSize: "13px",
        fontWeight: "600"
      }}>
        {status === "Active" ? "Continue Prep" : status === "Locked" ? "Premium Only" : "Start Track"}
      </div>
    </div>
  )
}
