// src/components/MQTTStatus.jsx
// Shows broker connection state in the top bar.

export default function MQTTStatus({ state }) {
  const map = {
    connected:    { color: "var(--green)",  dot: true,  label: "MQTT Live" },
    connecting:   { color: "var(--amber)",  dot: true,  label: "Connecting…" },
    reconnecting: { color: "var(--amber)",  dot: true,  label: "Reconnecting…" },
    disconnected: { color: "var(--muted)",  dot: false, label: "MQTT Off" },
    error:        { color: "var(--red)",    dot: false, label: "Broker Error" },
  };
  const s = map[state] || map.disconnected;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 100, padding: "5px 12px",
      fontSize: 11, fontWeight: 600, color: s.color,
      textTransform: "uppercase", letterSpacing: "0.5px",
      userSelect: "none",
    }}>
      {s.dot && (
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, animation: "pulse 1.5s infinite" }} />
      )}
      {s.label}
    </div>
  );
}
