// src/pages/Sync.jsx
import { useState } from "react";
import { useDevices } from "../hooks/useDevices";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { pushTelemetry } from "../services/deviceService";
import { db } from "../services/firebase";
import { useToast } from "../context/ToastContext";
import { LiveBadge, Button, StatusPill } from "../components/UI";

// ✅ React Icons
import { FiRefreshCw, FiZap } from "react-icons/fi";

export default function Sync() {
  const { devices } = useDevices();
  const { showToast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState({});

  async function syncAll() {
    setSyncing(true);
    showToast("🔄 Syncing all devices…", "info");

    const updates = devices
      .filter((d) => d.status !== "offline")
      .map(async (d) => {
        setProgress((p) => ({ ...p, [d.id]: 0 }));

        await updateDoc(doc(db, "devices", d.id), {
          status: "syncing",
          syncProgress: 30,
          lastSeen: serverTimestamp(),
        });

        setProgress((p) => ({ ...p, [d.id]: 30 }));

        await delay(600 + Math.random() * 800);

        const curr = d.telemetry;

        await pushTelemetry(d.id, {
          cpu:
            curr?.cpu != null
              ? clamp(curr.cpu + rand(-5, 5), 5, 95)
              : null,
          mem:
            curr?.mem != null
              ? clamp(curr.mem + rand(-3, 3), 10, 95)
              : null,
          temp:
            curr?.temp != null
              ? clamp(curr.temp + rand(-1, 1), 20, 75)
              : null,
        });

        setProgress((p) => ({ ...p, [d.id]: 70 }));

        await delay(300);

        await updateDoc(doc(db, "devices", d.id), {
          status: "online",
          syncProgress: 100,
          lastSeen: serverTimestamp(),
        });

        setProgress((p) => ({ ...p, [d.id]: 100 }));
      });

    await Promise.all(updates);

    setSyncing(false);
    showToast("✓ All devices synced", "success");
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
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
              Sync Center
            </h1>

            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Manage real-time device synchronization via Firebase RTDB
            </p>
          </div>

          <LiveBadge />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <style>{`@media(min-width:900px){.sync-layout{grid-template-columns:320px 1fr!important;}}`}</style>

        <div
          className="sync-layout"
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--card-radius)",
                padding: 28,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 14 }}>
                <FiRefreshCw size={48} />
              </div>

              <h3
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                Sync All Devices
              </h3>

              <p
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Push latest telemetry and update all device states via Firebase Realtime Database
              </p>

              <Button loading={syncing} onClick={syncAll}>
                {syncing ? "Syncing…" : "Start Full Sync"}
              </Button>
            </div>

            {/* RTDB info */}
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
                <FiZap />
                Realtime Architecture
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.7,
                }}
              >
                All telemetry streams live via{" "}
                <code style={{ color: "var(--purple)", fontSize: 12 }}>
                  onValue()
                </code>{" "}
                on{" "}
                <code style={{ color: "var(--purple)", fontSize: 12 }}>
                  rtdb/telemetry/{"{deviceId}"}
                </code>
                . Zero manual refresh.
              </p>
            </div>
          </div>

          {/* Right */}
          <div>
            <h3
              style={{
                fontFamily: "Syne,sans-serif",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Device Status
            </h3>

            {devices.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                No devices to sync.
              </p>
            ) : (
              devices.map((d) => {
                const prog = progress[d.id] ?? d.syncProgress ?? 0;

                return (
                  <div
                    key={d.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--card-radius)",
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "Syne,sans-serif",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {d.name}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--muted)",
                          }}
                        >
                          {d.location}
                        </div>
                      </div>

                      <StatusPill status={d.status} />

                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          minWidth: 32,
                          textAlign: "right",
                        }}
                      >
                        {prog}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: 4,
                        background: "var(--border)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          width: `${prog}%`,
                          background:
                            d.status === "offline"
                              ? "var(--red)"
                              : d.status === "syncing"
                              ? "linear-gradient(90deg,var(--primary),var(--purple))"
                              : "linear-gradient(90deg,var(--green),#00FF94)",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));