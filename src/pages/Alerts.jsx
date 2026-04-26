// src/pages/Alerts.jsx
import { useDevices } from "../hooks/useDevices";
import { StatusPill } from "../components/UI";

// ✅ React Icons
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiThermometer,
  FiCheckCircle,
  FiBell
} from "react-icons/fi";

export default function Alerts() {
  const { devices } = useDevices();

  const alerts = devices.flatMap((d) => {
    const a = [];

    if (d.status === "offline")
      a.push({
        device: d,
        msg: "Device is offline",
        color: "var(--red)",
        icon: FiAlertCircle,
        sev: "Critical",
        time: "2h ago",
      });

    if (d.telemetry?.cpu > 80)
      a.push({
        device: d,
        msg: `CPU at ${Math.round(d.telemetry.cpu)}%`,
        color: "var(--amber)",
        icon: FiAlertTriangle,
        sev: "Warning",
        time: "5m ago",
      });

    if (d.telemetry?.mem > 85)
      a.push({
        device: d,
        msg: `Memory at ${Math.round(d.telemetry.mem)}%`,
        color: "var(--amber)",
        icon: FiAlertTriangle,
        sev: "Warning",
        time: "8m ago",
      });

    if (d.telemetry?.temp > 65)
      a.push({
        device: d,
        msg: `Temp at ${Math.round(d.telemetry.temp)}°C`,
        color: "var(--red)",
        icon: FiThermometer,
        sev: "Critical",
        time: "1m ago",
      });

    return a;
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Syne,sans-serif",
              fontSize: "clamp(20px,3vw,28px)",
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            Alerts
          </h1>

          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            {alerts.length > 0
              ? `${alerts.length} active alert${
                  alerts.length > 1 ? "s" : ""
                }`
              : "All systems normal"}
          </p>
        </div>

        {alerts.length > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,77,106,0.1)",
              border: "1px solid rgba(255,77,106,0.25)",
              borderRadius: 100,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--red)",
            }}
          >
            <FiAlertCircle />
            {alerts.length} Active
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <style>{`@media(min-width:900px){.alerts-layout{grid-template-columns:1fr 300px!important;}}`}</style>

        <div
          className="alerts-layout"
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}
        >
          {/* Alert list */}
          <div>
            {alerts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "72px 20px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--card-radius)",
                }}
              >
                <div style={{ fontSize: 52, marginBottom: 16 }}>
                  <FiCheckCircle size={52} />
                </div>

                <h3
                  style={{
                    fontFamily: "Syne,sans-serif",
                    fontSize: 18,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  All Clear
                </h3>

                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  No alerts — all devices are within normal thresholds.
                </p>
              </div>
            ) : (
              alerts.map((a, i) => {
                const Icon = a.icon;

                return (
                  <div
                    key={i}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderLeft: `3px solid ${a.color}`,
                      borderRadius: "var(--card-radius)",
                      padding: 16,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      animation: "fadeUp 0.3s ease",
                    }}
                  >
                    <div style={{ fontSize: 22, flexShrink: 0 }}>
                      <Icon />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 3,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Syne,sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {a.device.name}
                        </span>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            padding: "2px 8px",
                            borderRadius: 100,
                            background:
                              a.sev === "Critical"
                                ? "rgba(255,77,106,0.12)"
                                : "rgba(255,184,48,0.12)",
                            color: a.color,
                          }}
                        >
                          {a.sev}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: a.color,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        {a.msg}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                        }}
                      >
                        {a.device.location} · {a.time}
                      </div>
                    </div>

                    <StatusPill status={a.device.status} />
                  </div>
                );
              })
            )}
          </div>

          {/* Right */}
          <div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--card-radius)",
                padding: 20,
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Alert Thresholds
              </h3>

              {[
                { label: "CPU Usage", threshold: "> 80%", color: "var(--amber)" },
                { label: "Memory", threshold: "> 85%", color: "var(--amber)" },
                { label: "Temperature", threshold: "> 65°C", color: "var(--red)" },
                { label: "Device Offline", threshold: "Any", color: "var(--red)" },
              ].map((t, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom:
                      i < arr.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--subtle)" }}>
                    {t.label}
                  </span>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.color,
                    }}
                  >
                    {t.threshold}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "rgba(47,47,228,0.06)",
                border: "1px solid var(--border)",
                borderRadius: "var(--card-radius)",
                padding: 18,
              }}
            >
              <div
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiBell />
                FCM Integration
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                Connect Firebase Cloud Messaging to receive push notifications when devices go offline or exceed thresholds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}