import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sun, Moon, User, LogOut, Settings, ChevronDown } from "lucide-react";

/* ─── Avatar ────────────────────────────────────────────────────── */
function Avatar({ user }) {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  // Deterministic hue from username so color is consistent
  const hue = user?.name
    ? [...user.name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 210;

  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: user?.avatar
          ? "transparent"
          : `hsl(${hue}, 70%, 52%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "700",
        color: "#fff",
        overflow: "hidden",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

/* ─── Dropdown ──────────────────────────────────────────────────── */
function DropdownMenu({ user, onNavigate, onLogout, isOpen }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        minWidth: "210px",
        backgroundColor: "var(--nav-bg)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        boxShadow: "var(--card-shadow-lg)",
        overflow: "hidden",
        zIndex: 999,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.97)",
        pointerEvents: isOpen ? "all" : "none",
        transition: "opacity 0.15s ease, transform 0.15s ease",
      }}
    >
      {/* User info header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.name}
        </div>
        <div
          style={{
            fontSize: "12px",
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

      {/* Items */}
      <div style={{ padding: "6px" }}>
        {user?.role === "admin" && (
          <DropItem icon={<Settings size={14} />} label="Upload Problems" onClick={() => onNavigate("/admin/upload")} />
        )}
        <DropItem icon={<User size={14} />} label="My Profile" onClick={() => onNavigate("/profile")} />
        <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "4px 0" }} />
        <DropItem icon={<LogOut size={14} />} label="Logout" onClick={onLogout} danger />
      </div>
    </div>
  );
}

function DropItem({ icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        width: "100%",
        padding: "7px 10px",
        background: hovered
          ? danger ? "rgba(220,38,38,0.08)" : "var(--row-hover)"
          : "transparent",
        border: "none",
        borderRadius: "7px",
        cursor: "pointer",
        color: danger
          ? hovered ? "var(--danger-hover)" : "var(--danger)"
          : "var(--text-color)",
        fontSize: "13px",
        fontWeight: "500",
        textAlign: "left",
        transition: "background 0.12s ease, color 0.12s ease",
      }}
    >
      <span style={{ opacity: 0.8, display: "flex" }}>{icon}</span>
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
  const [avatarHovered, setAvatarHovered] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

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
        top: 0, left: 0, right: 0,
        height: "56px",
        backgroundColor: "var(--nav-bg)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        zIndex: 1000,
        gap: "6px",
        transition: "background-color 0.25s ease, border-color 0.25s ease",
      }}
    >
      {/* ── Logo ── */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          marginRight: "20px",
          flexShrink: 0,
        }}
      >
        <img
          src="/image.png"
          alt="AptiCode"
          style={{ width: "28px", height: "28px", borderRadius: "6px" }}
        />
        <span style={{ fontSize: "17px", fontWeight: "700", color: "var(--primary)", letterSpacing: "-0.2px" }}>
          AptiCode
        </span>
      </div>

      {/* ── Nav Links ── */}
      <div style={{ display: "flex", height: "100%", alignItems: "center" }}>
        <NavItem to="/" label="Explore" end />
        <NavItem to="/problems" label="Problems" />
        <NavItem to="/target" label="Target" />
      </div>

      {/* ── Right ── */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>

        {/* Theme toggle */}
        <IconBtn
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark"
            ? <Sun size={16} strokeWidth={2} />
            : <Moon size={16} strokeWidth={2} />}
        </IconBtn>

        {user ? (
          /* ── Avatar Dropdown ── */
          <div
            ref={dropdownRef}
            style={{ position: "relative" }}
          >
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              onMouseEnter={() => setAvatarHovered(true)}
              onMouseLeave={() => setAvatarHovered(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: avatarHovered ? "var(--row-hover)" : "transparent",
                border: `1px solid ${avatarHovered || dropdownOpen ? "var(--border-hover)" : "var(--border)"}`,
                borderRadius: "20px",
                padding: "3px 8px 3px 4px",
                cursor: "pointer",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
            >
              <Avatar user={user} />
              <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name?.split(" ")[0]}
              </span>
              <ChevronDown
                size={13}
                style={{
                  color: "var(--muted-text)",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            <DropdownMenu
              user={user}
              isOpen={dropdownOpen}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </div>
        ) : (
          /* ── Auth ── */
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <NavLink
              to="/login"
              style={({ isActive }) => ({
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "500",
                color: isActive ? "var(--text-primary)" : "var(--muted-text)",
                padding: "5px 12px",
                borderRadius: "7px",
                transition: "color 0.15s ease",
              })}
            >
              Log in
            </NavLink>
            <NavLink
              to="/signup"
              style={{
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                color: "#fff",
                backgroundColor: "var(--primary)",
                padding: "6px 14px",
                borderRadius: "7px",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Sign up
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        textDecoration: "none",
        color: isActive ? "var(--text-primary)" : "var(--muted-text)",
        fontWeight: isActive ? "600" : "400",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        height: "100%",
        padding: "0 10px",
        borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
        transition: "color 0.15s ease, border-color 0.15s ease",
      })}
    >
      {label}
    </NavLink>
  );
}

function IconBtn({ onClick, title, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--row-hover)" : "transparent",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        color: "var(--text-secondary)",
        width: "34px",
        height: "34px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s ease, color 0.15s ease",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}