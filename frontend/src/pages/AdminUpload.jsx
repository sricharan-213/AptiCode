import { useState } from "react";

export default function AdminUpload() {
    const [form, setForm] = useState({
        title: "",
        description: "",
        options: ["", "", "", ""],
        correctOption: "",
        difficulty: "Easy",
        topic: "",
        author: "",
        reference: "",
    });

    const [status, setStatus] = useState(null); // { type: "success" | "error", msg }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "admin") {
        return (
            <div style={{ padding: "100px 24px", color: "#9ca3af", textAlign: "center" }}>
                <h2 style={{ color: "#ef4444", marginBottom: "12px" }}>Access Denied</h2>
                <p>You must be an admin to upload problems.</p>
            </div>
        );
    }

    const handleOptionChange = (index, value) => {
        const newOptions = [...form.options];
        newOptions[index] = value;
        setForm({ ...form, options: newOptions });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus(null);

        const token = localStorage.getItem("token");
        if (!token) {
            setStatus({ type: "error", msg: "No auth token found. Please log in." });
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/problems", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({ type: "success", msg: `Problem "${data.title}" created successfully!` });
                setForm({
                    title: "",
                    description: "",
                    options: ["", "", "", ""],
                    correctOption: "",
                    difficulty: "Easy",
                    topic: "",
                    author: "",
                    reference: "",
                });
            } else {
                setStatus({ type: "error", msg: data.message || "Failed to create problem" });
            }
        } catch (err) {
            setStatus({ type: "error", msg: "Network error. Is the server running?" });
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "10px 14px",
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "6px",
        color: "white",
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box",
    };

    const labelStyle = {
        display: "block",
        color: "#9ca3af",
        fontSize: "13px",
        marginBottom: "6px",
        fontWeight: "500",
    };

    return (
        <div style={{ padding: "80px 24px 40px 24px", color: "white", maxWidth: "700px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "8px" }}>Upload Problem</h1>
            <p style={{ color: "#6b7280", marginBottom: "32px", fontSize: "14px" }}>
                Admin panel — Add a new problem to the question bank
            </p>

            {status && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "6px",
                        marginBottom: "24px",
                        background: status.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${status.type === "success" ? "#22c55e" : "#ef4444"}`,
                        color: status.type === "success" ? "#22c55e" : "#ef4444",
                        fontSize: "14px",
                    }}
                >
                    {status.msg}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Title */}
                <div>
                    <label style={labelStyle}>Title *</label>
                    <input
                        style={inputStyle}
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Trains crossing a bridge"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label style={labelStyle}>Description *</label>
                    <textarea
                        style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Full problem statement..."
                        required
                    />
                </div>

                {/* Options */}
                <div>
                    <label style={labelStyle}>Options (4 choices) *</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {form.options.map((opt, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ color: "#6b7280", fontWeight: "bold", width: "20px" }}>
                                    {String.fromCharCode(65 + i)}.
                                </span>
                                <input
                                    style={inputStyle}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                    required
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Correct Option */}
                <div>
                    <label style={labelStyle}>Correct Option *</label>
                    <select
                        style={inputStyle}
                        value={form.correctOption}
                        onChange={(e) => setForm({ ...form, correctOption: e.target.value })}
                        required
                    >
                        <option value="">-- Select correct answer --</option>
                        {form.options.map((opt, i) =>
                            opt ? (
                                <option key={i} value={opt}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                </option>
                            ) : null
                        )}
                    </select>
                </div>

                {/* Difficulty + Topic row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={labelStyle}>Difficulty *</label>
                        <select
                            style={inputStyle}
                            value={form.difficulty}
                            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                            required
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Topic *</label>
                        <input
                            style={inputStyle}
                            value={form.topic}
                            onChange={(e) => setForm({ ...form, topic: e.target.value })}
                            placeholder="e.g. Time & Distance"
                            required
                        />
                    </div>
                </div>

                {/* Author + Reference row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={labelStyle}>Author</label>
                        <input
                            style={inputStyle}
                            value={form.author}
                            onChange={(e) => setForm({ ...form, author: e.target.value })}
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Reference</label>
                        <input
                            style={inputStyle}
                            value={form.reference}
                            onChange={(e) => setForm({ ...form, reference: e.target.value })}
                            placeholder="Optional"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    style={{
                        padding: "12px",
                        backgroundColor: "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "16px",
                        marginTop: "8px",
                    }}
                >
                    Upload Problem
                </button>
            </form>
        </div>
    );
}
