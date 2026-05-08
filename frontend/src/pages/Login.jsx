import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        // 🔥 Store token
        localStorage.setItem("token", data.token);

        // 🔥 Store user info
        localStorage.setItem("user", JSON.stringify(data.user));

        setMessage("Login successful! Redirecting...");
        
        setTimeout(() => {
          navigate("/");
        }, 1000);

      } else {
        setMessage(data.message || "Login failed");
      }

    } catch (err) {
      console.error("Frontend Login Catch Error:", err);
      setMessage("Network or server connection failed. Please try again.");
    }
  };

  return (
    <div style={{
      padding: "100px 20px",
      maxWidth: "400px",
      margin: "0 auto",
      color: "white"
    }}>
      <h2 style={{ marginBottom: "20px" }}>Login</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ padding: "10px" }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ padding: "10px" }}
        />

        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Login
        </button>
      </form>

      {message && (
        <p style={{ 
          marginTop: "15px", 
          color: message.includes("successful") ? "#22c55e" : "#ef4444" 
        }}>
          {message}
        </p>
      )}
    </div>
  );
}