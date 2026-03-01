import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Theme logic
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload(); // quick refresh to update navbar state
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "60px",
        backgroundColor: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
        color: "var(--text-color)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          marginRight: "40px",
          fontSize: "20px",
          fontWeight: "bold",
          color: "var(--primary)",
          cursor: "pointer"
        }}
        onClick={() => navigate("/")}
      >
        AptiCode
      </div>

      {/* Main Navigation */}
      <div style={{ display: "flex", gap: "24px", height: "100%" }}>
        <NavItem to="/" label="Explore" />
        <NavItem to="/problems" label="Problems" />
        <NavItem to="/target" label="Target" />
      </div>

      {/* Right Side */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: "none",
            border: "1px solid var(--nav-border)",
            borderRadius: "8px",
            color: "var(--text-color)",
            width: "36px",
            height: "36px",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginRight: "8px",
            transition: "all 0.2s ease",
          }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {user ? (
          <>
            <span style={{ color: "var(--accent)", fontWeight: "500" }}>
              {user.name}
            </span>
            {user.role === "admin" && (
              <NavItem to="/admin/upload" label="Upload" />
            )}
            <NavItem to="/profile" label="Profile" />
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "var(--danger)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavItem to="/login" label="Login" />
            <NavItem to="/signup" label="Signup" />
          </>
        )}
      </div>
    </nav>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        color: isActive ? "#ffffff" : "#bdc3c7",
        fontWeight: isActive ? "600" : "400",
        display: "flex",
        alignItems: "center",
        height: "100%",
        borderBottom: isActive
          ? "2px solid #ffffff"
          : "2px solid transparent",
        transition: "all 0.2s ease",
        padding: "0 4px",
      })}
    >
      {label}
    </NavLink>
  );
}