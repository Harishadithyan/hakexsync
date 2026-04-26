// src/pages/AddDevice.jsx
// Step-by-step wizard:
//   Step 1 → Enter device info (name, type, location)
//   Step 2 → Show QR code with MQTT credentials
//   Step 3 → Wait for MQTT ping (device goes online)

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { addDevice } from "../services/deviceService";
import { buildPairingPayload, renderQRToCanvas } from "../services/qrService";
import { mqttPublish } from "../services/mqttService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, Input, Select, Spinner } from "../components/UI";

const TYPE_OPTIONS = [
  { value: "sensor",  label: "📡  Temperature / Humidity Sensor" },
  { value: "server",  label: "🖥️  Server / Controller" },
  { value: "iot",     label: "🔌  Generic IoT Node" },
  { value: "camera",  label: "📷  Camera / Vision Module" },
  { value: "gateway", label: "🌐  Gateway / Hub" },
];

const STEPS = ["Device Info", "Scan QR", "Waiting…"];

export default function AddDevice() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const nav           = useNavigate();

  const [step,     setStep]     = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [device,   setDevice]   = useState(null);   // { id, token }
  const [payload,  setPayload]  = useState(null);   // QR payload
  const [paired,   setPaired]   = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const canvasRef = useRef(null);

  // Form fields
  const [name,     setName]     = useState("");
  const [type,     setType]     = useState("sensor");
  const [location, setLocation] = useState("");
  const [errors,   setErrors]   = useState({});

  // ── Step 1 → Step 2: create Firestore doc + render QR ────────────
  async function handleCreate() {
    const e = {};
    if (!name.trim())     e.name     = "Device name is required";
    if (!location.trim()) e.location = "Location is required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const result = await addDevice(user.uid, { name: name.trim(), type, location: location.trim() });
      const p = buildPairingPayload({
        uid:        user.uid,
        deviceId:   result.id,
        deviceName: name.trim(),
        token:      result.token,
      });
      setDevice(result);
      setPayload(p);
      setStep(1);
    } catch (err) {
      console.error(err);
      showToast("Failed to create device", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Render QR once canvas is available ───────────────────────────
  useEffect(() => {
    if (step === 1 && canvasRef.current && payload) {
      renderQRToCanvas(canvasRef.current, payload).catch(console.error);
    }
  }, [step, payload]);

  // ── Step 2 → Step 3: start listening for first MQTT ping ─────────
  function startWaiting() {
    setStep(2);
  }

  // ── Step 3: Firestore listener — watches for paired: true ─────────
  useEffect(() => {
    if (step !== 2 || !device) return;

    const unsub = onSnapshot(doc(db, "devices", device.id), (snap) => {
      if (snap.exists() && snap.data().paired === true) {
        setPaired(true);
        unsub();
      }
    });

    return unsub;
  }, [step, device]);

  // Auto-navigate after pairing
  useEffect(() => {
    if (paired) {
      showToast("✓ Device connected!", "success");
      setTimeout(() => nav(`/device/${device.id}`), 1800);
    }
  }, [paired]);

  // ── Copy payload as JSON ──────────────────────────────────────────
  function copyCredentials() {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 2000);
  }

  // ── Send a test ping command to device ────────────────────────────
  function sendTestPing() {
    if (!device) return;
    mqttPublish(user.uid, device.id, "cmd", { action: "ping" });
    showToast("Ping sent to device", "info");
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={() => nav("/dashboard")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", marginBottom: 28, fontFamily: "DM Sans,sans-serif" }}>
        ‹ Back to Dashboard
      </button>

      {/* Title */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, marginBottom: 6 }}>
          Connect ESP32 Device
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          3-step wizard — create · scan QR · device goes live
        </p>
      </div>

      {/* Step indicator */}
      <StepBar steps={STEPS} current={step} />

      {/* ── STEP 0: Device info ── */}
      {step === 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, animation: "fadeUp 0.3s ease" }}>
          <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Device Information</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
            Give your ESP32 a name. After creating, you'll get a QR code to scan.
          </p>
          <Input label="Device Name" placeholder="e.g. Living Room Sensor" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
          <Select label="Device Type" value={type} onChange={e => setType(e.target.value)} options={TYPE_OPTIONS} />
          <Input label="Location / Tag" placeholder="e.g. Lab A, Shelf 3" value={location} onChange={e => setLocation(e.target.value)} error={errors.location} />

          <div style={{ marginTop: 8, padding: "14px 16px", background: "rgba(47,47,228,0.06)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
            💡 <strong style={{ color: "var(--subtle)" }}>How it works:</strong> We'll create a Firestore record and generate a unique MQTT topic + token for your ESP32.
          </div>

          <Button loading={loading} onClick={handleCreate} style={{ marginTop: 20 }}>
            Create Device & Generate QR →
          </Button>
        </div>
      )}

      {/* ── STEP 1: QR Code ── */}
      {step === 1 && payload && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Scan with Your ESP32</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Flash the firmware below, then boot your ESP32 into provisioning mode and scan this QR code with the captive-portal page it hosts.
            </p>

            {/* QR */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ background: "var(--surface2)", border: "2px solid var(--border2)", borderRadius: 16, padding: 16, display: "inline-block" }}>
                <canvas ref={canvasRef} style={{ display: "block", borderRadius: 8 }} />
              </div>
            </div>

            {/* Device credentials summary */}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)", marginBottom: 10 }}>Encoded Credentials</p>
             {[
  { label: "MQTT Broker",  value: `${payload.mqtt.host}:${payload.mqtt.port}` },
  { label: "Topic Root",   value: payload.mqtt.base_topic },
  { label: "Device ID",    value: payload.device.id },
  { label: "Pairing Token",value: payload.device.token },
  { label: "Interval",     value: `${payload.settings.interval_ms / 1000}s` },
].map(({ label, value }) => (
  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
    <span>{label}</span>
    <code>{value}</code>
  </div>
))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Button variant="ghost" onClick={copyCredentials}>
                {copyDone ? "✓ Copied!" : "📋 Copy JSON"}
              </Button>
              <Button onClick={startWaiting}>
                I've Scanned It →
              </Button>
            </div>
          </div>

          {/* Firmware reminder */}
          <FirmwareReminder deviceId={device?.id} uid={user.uid} topicRoot={payload?.mqtt_topic} />
        </div>
      )}

      {/* ── STEP 2: Waiting for connection ── */}
      {step === 2 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 40, textAlign: "center", animation: "fadeUp 0.3s ease" }}>
          {paired ? (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8, color: "var(--green)" }}>Device Online!</h2>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Your ESP32 is connected and sending telemetry. Redirecting…</p>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid rgba(47,47,228,0.2)", borderTopColor: "var(--primary)", animation: "spin 1s linear infinite" }} />
              </div>
              <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Waiting for ESP32…</h2>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                Listening on <code style={{ color: "var(--purple)", fontSize: 12 }}>{payload?.mqtt_topic}/ping</code>
                <br />Make sure your ESP32 is powered, has WiFi, and the firmware is flashed.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 360, margin: "0 auto" }}>
                <Button variant="ghost" onClick={() => setStep(1)}>← Back to QR</Button>
                <Button variant="ghost" onClick={sendTestPing}>🔔 Send Ping</Button>
              </div>

              {/* Live MQTT status */}
              <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(47,47,228,0.06)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13, color: "var(--muted)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", animation: "pulse 1.5s infinite" }} />
                  Listening on HiveMQ broker…
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step bar ─────────────────────────────────────────────────────
function StepBar({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
      {steps.map((label, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, fontFamily: "Syne,sans-serif",
              background: i < current ? "var(--green)" : i === current ? "var(--primary)" : "var(--surface2)",
              color: i <= current ? "#fff" : "var(--muted)",
              border: i === current ? "2px solid rgba(47,47,228,0.5)" : "2px solid transparent",
              boxShadow: i === current ? "0 0 16px rgba(47,47,228,0.3)" : "none",
              transition: "all 0.3s",
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i === current ? "var(--text)" : "var(--muted)", fontWeight: i === current ? 600 : 400, whiteSpace: "nowrap" }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? "var(--green)" : "var(--border)", margin: "0 8px", marginBottom: 22, transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Firmware quick-reference card ────────────────────────────────
function FirmwareReminder({ deviceId, uid, topicRoot }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 24 }}>
      <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
        📟 ESP32 Quick Reference
      </h3>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
        Flash <code style={{ color: "var(--purple)" }}>hakexsync_esp32.ino</code> (included in the firmware/ folder).
        After boot, connect to the <strong style={{ color: "var(--text)" }}>HakexSync-Setup</strong> WiFi access point,
        then open <code style={{ color: "var(--purple)" }}>192.168.4.1</code> and scan / paste the QR data.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
        {[
          { icon: "1️⃣", title: "Flash firmware",      sub: "hakexsync_esp32.ino via Arduino IDE or PlatformIO" },
          { icon: "2️⃣", title: "Connect to AP",       sub: 'Join "HakexSync-Setup" WiFi from your phone/laptop' },
          { icon: "3️⃣", title: "Open captive portal", sub: "Navigate to 192.168.4.1 in your browser" },
          { icon: "4️⃣", title: "Scan or paste QR",    sub: "Camera scan or paste JSON — device configures itself" },
        ].map(s => (
          <div key={s.title} style={{ background: "var(--surface2)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
