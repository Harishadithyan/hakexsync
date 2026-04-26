// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDevices } from "../hooks/useDevices";
import { addDevice, updateDevice } from "../services/deviceService";
import { useToast } from "../context/ToastContext";
import DeviceCard from "../components/DeviceCard";
import DeviceModal from "../components/DeviceModal";
import { LiveBadge, Spinner } from "../components/UI";

// ✅ React Icons
import {
  FiSmartphone,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiPlus,
  FiRadio
} from "react-icons/fi";

export default function Dashboard() {
  const { user, displayName } = useAuth();
  const { devices, loading, onlineCount, offlineCount } = useDevices();
  const { showToast } = useToast();
  const nav = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const firstName = displayName.split(" ")[0] || "there";

  const filtered = devices.filter((d) => {
    const matchSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase()) ||
      d.location.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "All" ||
      (filter === "Online" && d.status === "online") ||
      (filter === "Offline" && d.status === "offline");

    return matchSearch && matchFilter;
  });

  async function handleSave(data) {
    try {
      if (editDevice) {
        await updateDevice(editDevice.id, data);
        showToast("Device updated", "success");
      } else {
        await addDevice(user.uid, data);
        showToast("Device added", "success");
      }
      setEditDevice(null);
    } catch {
      showToast("Failed to save device", "error");
      throw new Error("save failed");
    }
  }

  return (
    <>
      {/* Page title */}
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
            Hey, {firstName} 👋
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            Real-time sync status across all your devices
          </p>
        </div>
        <LiveBadge />
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          label="Total"
          value={devices.length}
          color="var(--purple)"
          icon={FiSmartphone}
        />
        <StatCard
          label="Online"
          value={onlineCount}
          color="var(--green)"
          icon={FiCheckCircle}
        />
        <StatCard
          label="Offline"
          value={offlineCount}
          color="var(--red)"
          icon={FiXCircle}
        />
        <StatCard
          label="Sync"
          value="98.2%"
          color="var(--cyan)"
          icon={FiRefreshCw}
        />
      </div>

      {/* Controls row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 200px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "10px 16px",
          }}
        >
          <FiSearch style={{ color: "var(--muted)" }} />

          <input
            placeholder="Search devices…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text)",
              fontSize: 14,
              flex: 1,
              outline: "none",
            }}
          />

          {search && (
            <span
              onClick={() => setSearch("")}
              style={{ color: "var(--muted)", cursor: "pointer" }}
            >
              ×
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {["All", "Online", "Offline"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                cursor: "pointer",
                background:
                  filter === f
                    ? "rgba(47,47,228,0.15)"
                    : "var(--surface)",
                color:
                  filter === f
                    ? "var(--purple)"
                    : "var(--muted)",
                fontSize: 13,
                fontFamily: "DM Sans,sans-serif",
                fontWeight: filter === f ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditDevice(null);
            setModalOpen(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 10,
            border: "1px solid var(--border2)",
            background: "rgba(47,47,228,0.1)",
            color: "var(--purple)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "DM Sans,sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          <FiPlus size={16} />
          Add Device
        </button>
      </div>

      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2
          style={{
            fontFamily: "Syne,sans-serif",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Connected Devices{" "}
          <span
            style={{
              fontSize: 13,
              color: "var(--muted)",
              fontWeight: 400,
            }}
          >
            ({filtered.length})
          </span>
        </h2>
      </div>

      {/* Device grid */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "64px 20px",
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 14 }}>
            <FiRadio size={48} />
          </div>

          <p
            style={{
              fontFamily: "Syne,sans-serif",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 6,
            }}
          >
            {search
              ? "No devices match your search"
              : "No devices yet"}
          </p>

          {!search && (
            <span
              onClick={() => setModalOpen(true)}
              style={{
                color: "var(--primary)",
                cursor: "pointer",
              }}
            >
              Add your first device →
            </span>
          )}
        </div>
      ) : (
        <div className="device-grid">
          {filtered.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              onClick={() => nav(`/device/${d.id}`)}
            />
          ))}
        </div>
      )}

      <DeviceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditDevice(null);
        }}
        onSave={handleSave}
        editDevice={editDevice}
      />
    </>
  );
}

function StatCard({ label, value, color, icon }) {
  const Icon = icon;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--card-radius)",
        padding: "18px 20px",
        animation: "fadeUp 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            color: "var(--muted)",
          }}
        >
          {label}
        </span>

        <span style={{ fontSize: 18 }}>
          <Icon />
        </span>
      </div>

      <div
        style={{
          fontFamily: "Syne,sans-serif",
          fontSize: "clamp(22px,3vw,34px)",
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}