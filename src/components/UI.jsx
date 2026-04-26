// src/components/UI.jsx
// Shared reusable components

// ── Button ─────────────────────────────────────────────────────────
export function Button({ children, onClick, variant = "primary", loading, style, disabled }) {
  const base = {
    width: "100%", borderRadius: "12px", padding: "15px 20px",
    fontSize: "15px", fontWeight: 700, cursor: loading || disabled ? "not-allowed" : "pointer",
    border: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.3px",
    transition: "all 0.2s", position: "relative", overflow: "hidden",
    opacity: loading || disabled ? 0.75 : 1,
  };

  const variants = {
    primary: {
      background: "linear-gradient(135deg, var(--primary), var(--secondary))",
      color: "#fff",
      boxShadow: "0 4px 16px rgba(47,47,228,0.28)",
    },
    ghost: {
      background: "var(--surface)",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    danger: {
      background: "rgba(255,77,106,0.1)",
      color: "var(--red)",
      border: "1px solid rgba(255,77,106,0.25)",
    },
  };

  return (
    <button
      onClick={!loading && !disabled ? onClick : undefined}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {loading && (
        <span
          style={{
            display: "inline-block", width: 16, height: 16,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff", borderRadius: "50%",
            animation: "spin 0.7s linear infinite", marginRight: 8,
            verticalAlign: "middle",
          }}
        />
      )}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────
export function Input({ label, type = "text", placeholder, value, onChange, error, style }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 11, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.8px",
          color: "var(--subtle)", marginBottom: 8,
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%", background: "var(--surface)",
          border: `1px solid ${error ? "rgba(255,77,106,0.5)" : "var(--border)"}`,
          borderRadius: 12, padding: "14px 16px",
          color: "var(--text)", fontSize: 15, outline: "none",
          transition: "all 0.2s", ...style,
        }}
        onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--glow)"; }}
        onBlur={e => { e.target.style.borderColor = error ? "rgba(255,77,106,0.5)" : "var(--border)"; e.target.style.boxShadow = "none"; }}
      />
      {error && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 11, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.8px",
          color: "var(--subtle)", marginBottom: 8,
        }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 12,
          padding: "14px 16px", color: "var(--text)",
          fontSize: 15, outline: "none", appearance: "none",
          cursor: "pointer",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: "var(--surface2)" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Error Box ─────────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.25)",
      borderRadius: 10, padding: "12px 14px", fontSize: 13,
      color: "var(--red)", marginBottom: 16, lineHeight: 1.5,
    }}>
      ⚠ {message}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 32 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div style={{
        width: size, height: size,
        border: "3px solid rgba(47,47,228,0.2)",
        borderTopColor: "var(--primary)", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

// ── Status Pill ───────────────────────────────────────────────────
export function StatusPill({ status }) {
  const map = {
    online:  { bg: "rgba(16,245,149,0.12)", color: "var(--green)" },
    offline: { bg: "rgba(255,77,106,0.12)", color: "var(--red)" },
    syncing: { bg: "rgba(47,47,228,0.12)",  color: "var(--purple)" },
    warning: { bg: "rgba(255,184,48,0.12)", color: "var(--amber)" },
  };
  const s = map[status] || map.offline;
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 100, fontSize: 11,
      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
      background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

// ── Live Badge ────────────────────────────────────────────────────
export function LiveBadge() {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(16,245,149,0.1)", border: "1px solid rgba(16,245,149,0.2)",
      borderRadius: 100, padding: "4px 10px", fontSize: 11,
      fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.5px",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse 1.5s infinite" }} />
      Live
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────
export function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: on ? "var(--primary)" : "var(--surface2)",
        border: `1px solid ${on ? "var(--primary)" : "var(--border)"}`,
        position: "relative", cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <div style={{
        position: "absolute", width: 18, height: 18, borderRadius: 9,
        background: "#fff", top: 2, left: 2,
        transform: on ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s",
      }} />
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────────────────
export function Logo({ size = "md" }) {
  const sizes = { sm: { icon: 28, font: 14 }, md: { icon: 36, font: 18 }, lg: { icon: 48, font: 24 } };
  const s = sizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: s.icon, height: s.icon,
        background: "linear-gradient(135deg, #7B2FFF, var(--primary))",
        borderRadius: Math.round(s.icon * 0.28),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(s.icon * 0.46), flexShrink: 0,
        boxShadow: "0 4px 12px rgba(47,47,228,0.3)",
      }}>
        ⬡
      </div>
      <span style={{ fontFamily: "Syne, sans-serif", fontSize: s.font, fontWeight: 800, letterSpacing: "-0.3px" }}>
        hakex<span style={{ color: "#9B7AFF" }}>sync</span>
      </span>
    </div>
  );
}
