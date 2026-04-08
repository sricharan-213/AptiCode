import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";

/* ─── Avatar Component ─────────────────────────────────────────── */
function Avatar({ user, onClick }) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <button
      onClick={onClick}
      title={user?.name}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "2px solid rgba(255,161,22,0.5)",
        background: user?.avatar
          ? "transparent"
          : "linear-gradient(135deg, #ffa116 0%, #f59e0b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "700",
        color: "#1a1a1a",
        overflow: "hidden",
        padding: 0,
        transition: "box-shadow 0.2s ease, transform 0.15s ease",
        boxShadow: "0 0 0 0 rgba(255,161,22,0.4)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,161,22,0.3)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 0 rgba(255,161,22,0.4)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ lineHeight: 1, letterSpacing: "0.02em" }}>{initial}</span>
      )}
    </button>
  );
}

/* ─── Dropdown Menu ─────────────────────────────────────────────── */
function DropdownMenu({ user, onNavigate, onLogout, isOpen }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        minWidth: "200px",
        backgroundColor: "var(--nav-bg)",
        border: "1px solid var(--nav-border)",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        overflow: "hidden",
        zIndex: 999,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.97)",
        pointerEvents: isOpen ? "all" : "none",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}
    >
      {/* User Info Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid var(--nav-border)",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-color)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.name}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--muted-text)",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.email || (user?.role === "admin" ? "Administrator" : "Member")}
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ padding: "6px" }}>
        {user?.role === "admin" && (
          <DropdownItem
            icon="⚙️"
            label="Upload Problems"
            onClick={() => onNavigate("/admin/upload")}
          />
        )}
        <DropdownItem
          icon="👤"
          label="My Profile"
          onClick={() => onNavigate("/profile")}
        />
        <div
          style={{
            height: "1px",
            backgroundColor: "var(--nav-border)",
            margin: "6px 0",
          }}
        />
        <DropdownItem
          icon="🚪"
          label="Logout"
          onClick={onLogout}
          danger
        />
      </div>
    </div>
  );
}

function DropdownItem({ icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "8px 10px",
        background: hovered
          ? danger
            ? "rgba(248,113,113,0.1)"
            : "var(--row-hover)"
          : "transparent",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        color: danger
          ? hovered
            ? "var(--danger)"
            : "#f87171cc"
          : "var(--text-color)",
        fontSize: "13px",
        fontWeight: "500",
        textAlign: "left",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
}

/* ─── Main Navbar ────────────────────────────────────────────────── */
export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const dropdownRef = useRef(null);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const handleLogout = () => {
    setDropdownOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "56px",
        backgroundColor: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
        color: "var(--text-color)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        zIndex: 1000,
        boxShadow: "0 1px 0 var(--nav-border)",
        gap: "8px",
      }}
    >
      {/* ── Left: Logo ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          marginRight: "28px",
          flexShrink: 0,
        }}
        onClick={() => navigate("/")}
      >
        <img
          src="/image.png"
          alt="AptiCode Logo"
          style={{ width: "30px", height: "30px", borderRadius: "6px" }}
        />
        <span
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "var(--primary)",
            letterSpacing: "-0.3px",
          }}
        >
          AptiCode
        </span>
      </div>

      {/* ── Center: Nav Links ── */}
      <div style={{ display: "flex", gap: "4px", height: "100%", alignItems: "center" }}>
        <NavItem to="/" label="Explore" exact />
        <NavItem to="/problems" label="Problems" />
        <NavItem to="/target" label="Target" />
      </div>

      {/* ── Right Side ── */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Theme Toggle */}
        <IconButton
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </IconButton>

        {user ? (
          /* ── Avatar + Dropdown ── */
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <Avatar user={user} onClick={() => setDropdownOpen((o) => !o)} />
            <DropdownMenu
              user={user}
              isOpen={dropdownOpen}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </div>
        ) : (
          /* ── Auth Links ── */
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <NavLink
              to="/login"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "500",
                color: isActive ? "var(--primary)" : "var(--muted-text)",
                padding: "6px 12px",
                borderRadius: "8px",
                transition: "color 0.15s ease",
              })}
            >
              Log in
            </NavLink>
            <NavLink
              to="/signup"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: isActive ? "#1a1a1a" : "#1a1a1a",
                backgroundColor: "var(--primary)",
                padding: "6px 14px",
                borderRadius: "8px",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              })}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.88";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Sign up
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─── Reusable Sub-components ───────────────────────────────────── */
function NavItem({ to, label, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      style={({ isActive }) => ({
        textDecoration: "none",
        color: isActive ? "var(--text-color)" : "var(--muted-text)",
        fontWeight: isActive ? "600" : "400",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        height: "100%",
        padding: "0 10px",
        borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
        transition: "color 0.18s ease, border-color 0.18s ease",
        letterSpacing: "0.01em",
      })}
      onMouseEnter={(e) => {
        if (e.currentTarget.style.color !== "var(--text-color)") {
          e.currentTarget.style.color = "var(--text-color)";
        }
      }}
      onMouseLeave={(e) => {
        // NavLink re-applies its own style, no manual reset needed
      }}
    >
      {label}
    </NavLink>
  );
}

function IconButton({ onClick, title, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--row-hover)" : "none",
        border: "1px solid var(--nav-border)",
        borderRadius: "8px",
        color: "var(--text-color)",
        width: "34px",
        height: "34px",
        fontSize: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}