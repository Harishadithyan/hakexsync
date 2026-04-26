// src/pages/Profile.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logOut } from "../services/authService";
import { useDevices } from "../hooks/useDevices";
import { useToast } from "../context/ToastContext";
import { Toggle, Button } from "../components/UI";

// ✅ React Icons
import {
  FiBell,
  FiRefreshCw,
  FiRadio,
  FiLock,
  FiSettings,
  FiBarChart2,
  FiChevronRight,
  FiHexagon
} from "react-icons/fi";

export default function Profile() {
  const { displayName, initials, user } = useAuth();
  const { devices, onlineCount, offlineCount } = useDevices();
  const { showToast } = useToast();
  const nav = useNavigate();

  const [notif, setNotif] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [bgRef, setBgRef] = useState(false);

  async function handleLogout() {
    try {
      await logOut();
      nav("/login", { replace: true });
    } catch {
      showToast("Failed to sign out", "error");
    }
  }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, marginBottom: 4 }}>
          Profile & Settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Manage your account and preferences
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
        <style>{`@media(min-width:900px){.profile-grid{grid-template-columns:320px 1fr!important;}}`}</style>

        <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          
          {/* Left */}
          <div>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--card-radius)",
              padding: 28,
              textAlign: "center",
              marginBottom: 16,
              animation: "fadeUp 0.3s ease"
            }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                background: "linear-gradient(135deg,#7B2FFF,var(--primary))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Syne,sans-serif",
                fontSize: 28,
                fontWeight: 800,
                margin: "0 auto 16px",
                boxShadow: "0 8px 24px rgba(47,47,228,0.3)"
              }}>
                {initials || "?"}
              </div>

              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                {displayName}
              </h2>

              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
                {user?.email}
              </p>

              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(47,47,228,0.1)",
                border: "1px solid var(--border2)",
                borderRadius: 100,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--purple)"
              }}>
                <FiHexagon size={14} />
                Pro Sync Plan
              </div>
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <MiniStat label="Total" value={devices.length} />
              <MiniStat label="Online" value={onlineCount} color="var(--green)" />
              <MiniStat label="Offline" value={offlineCount} color={offlineCount > 0 ? "var(--red)" : "var(--muted)"} />
            </div>

            <Button variant="danger" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>

          {/* Right */}
          <div>
            <Section title="Preferences">
              <SettingRow
                icon={FiBell}
                title="Push Notifications"
                sub="Alerts for offline devices"
                right={<Toggle on={notif} onToggle={() => {
                  setNotif(!notif);
                  showToast(notif ? "Notifications off" : "Notifications on");
                }} />}
              />

              <SettingRow
                icon={FiRefreshCw}
                title="Auto-Sync"
                sub="Sync every 30 seconds"
                right={<Toggle on={autoSync} onToggle={() => {
                  setAutoSync(!autoSync);
                  showToast(autoSync ? "Auto-sync off" : "Auto-sync on");
                }} />}
              />

              <SettingRow
                icon={FiRadio}
                title="Background Refresh"
                sub="Keep data fresh when idle"
                right={<Toggle on={bgRef} onToggle={() => {
                  setBgRef(!bgRef);
                  showToast(bgRef ? "BG refresh off" : "BG refresh on");
                }} />}
                last
              />
            </Section>

            <Section title="Account">
              <SettingRow icon={FiLock} title="Security & Privacy" sub="2FA, session management" right={<Chevron />} onClick={() => showToast("Coming soon", "info")} />
              <SettingRow icon={FiSettings} title="API Configuration" sub="Firebase project settings" right={<Chevron />} onClick={() => showToast("Coming soon", "info")} />
              <SettingRow icon={FiBarChart2} title="Usage & Analytics" sub="Sync usage this month" right={<Chevron />} onClick={() => showToast("Coming soon", "info")} last />
            </Section>

            <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 24 }}>
              HakexSync v1.0.0 · Firebase-powered
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-radius)", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon, title, sub, right, onClick, last }) {
  const Icon = icon;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "15px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: last ? "none" : "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "var(--surface2)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = ""; }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "rgba(47,47,228,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0
      }}>
        <Icon />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{sub}</div>
      </div>

      {right}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "12px 10px",
      textAlign: "center"
    }}>
      <div style={{
        fontFamily: "Syne,sans-serif",
        fontSize: 24,
        fontWeight: 800,
        color: color || "var(--text)"
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <span style={{ color: "var(--muted)", fontSize: 18 }}>
      <FiChevronRight />
    </span>
  );
}