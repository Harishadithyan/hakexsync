// src/components/DeviceCard.jsx
import { StatusPill } from "./UI";

const ICONS  = { server: "🖥️", sensor: "📡", iot: "🔌", camera: "📷", gateway: "🌐" };
const COLORS = { server: "#2F2FE4", sensor: "#10F595", iot: "#FFB830", camera: "#FF4D6A", gateway: "#00D4FF" };
const BG     = { server: "rgba(47,47,228,0.12)", sensor: "rgba(16,245,149,0.10)", iot: "rgba(255,184,48,0.10)", camera: "rgba(255,77,106,0.10)", gateway: "rgba(0,212,255,0.10)" };

export default function DeviceCard({ device, onClick }) {
  const t    = device.telemetry;
  const left = device.status === "online" ? "var(--green)" : device.status === "syncing" ? "var(--purple)" : device.status === "warning" ? "var(--amber)" : "var(--red)";
  const prog = device.syncProgress ?? (device.status === "online" ? 95 : device.status === "offline" ? 0 : 50);

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderLeft: `3px solid ${left}`, borderRadius: 16,
        padding: 16, marginBottom: 12, cursor: "pointer",
        transition: "all 0.2s", position: "relative", overflow: "hidden",
        animation: "fadeUp 0.3s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = ""; e.currentTarget.style.borderLeftColor = left; }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: t ? 12 : 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: BG[device.type] || BG.server, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {ICONS[device.type] || "📱"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {device.name}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {device.location} · {device.type}
          </div>
        </div>
        <StatusPill status={device.status} />
      </div>

      {/* Metrics */}
      {t && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
          {t.cpu != null && (
            <Metric label="CPU" value={`${Math.round(t.cpu)}%`} color={t.cpu > 80 ? "var(--red)" : t.cpu > 60 ? "var(--amber)" : "var(--cyan)"} />
          )}
          {t.mem != null && (
            <Metric label="Memory" value={`${Math.round(t.mem)}%`} color={t.mem > 80 ? "var(--red)" : "var(--subtle)"} />
          )}
          {t.temp != null && (
            <Metric label="Temp" value={`${Math.round(t.temp)}°C`} color="var(--amber)" />
          )}
          {t.cpu == null && t.temp != null && (
            <Metric label="Temp" value={`${Math.round(t.temp)}°C`} color="var(--cyan)" style={{ gridColumn: "1/4" }} />
          )}
        </div>
      )}

      {/* Sync bar */}
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2, width: `${prog}%`,
          background: device.status === "online" ? "linear-gradient(90deg,var(--green),#00FF94)"
                    : device.status === "syncing" ? "linear-gradient(90deg,var(--primary),var(--purple))"
                    : "var(--border)",
          transition: "width 0.6s ease",
          ...(device.status === "syncing" ? { animation: "shimmer 2s infinite" } : {}),
        }} />
      </div>
    </div>
  );
}

function Metric({ label, value, color, style }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "8px 10px", textAlign: "center", ...style }}>
      <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
