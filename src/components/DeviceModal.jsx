// src/components/DeviceModal.jsx
import { useState, useEffect } from "react";
import { Button, Input, Select } from "./UI";

const TYPE_OPTIONS = [
  { value: "server",  label: "🖥️  Server" },
  { value: "sensor",  label: "📡  Sensor" },
  { value: "iot",     label: "🔌  IoT Device" },
  { value: "camera",  label: "📷  Camera" },
  { value: "gateway", label: "🌐  Gateway" },
];

export default function DeviceModal({ open, onClose, onSave, editDevice }) {
  const [name,     setName]     = useState("");
  const [type,     setType]     = useState("server");
  const [location, setLocation] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  useEffect(() => {
    if (editDevice) {
      setName(editDevice.name);
      setType(editDevice.type);
      setLocation(editDevice.location);
    } else {
      setName(""); setType("server"); setLocation("");
    }
    setErrors({});
  }, [editDevice, open]);

  function validate() {
    const e = {};
    if (!name.trim())     e.name     = "Device name is required";
    if (!location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), type, location: location.trim() });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)", zIndex: 200,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "fadeIn 0.2s",
      }}
    >
      <div style={{
        background: "var(--surface2)", borderRadius: "24px 24px 0 0",
        border: "1px solid var(--border)", padding: "28px 24px 40px",
        width: "100%", maxWidth: 430,
        animation: "slideUp 0.32s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{ width: 40, height: 4, background: "var(--border2)", borderRadius: 2, margin: "0 auto 24px" }} />
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
          {editDevice ? "Edit Device" : "Add New Device"}
        </h2>

        <Input label="Device Name" placeholder="e.g. Raspberry Pi Server" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
        <Select label="Device Type" value={type} onChange={e => setType(e.target.value)} options={TYPE_OPTIONS} />
        <Input label="Location / Tag" placeholder="e.g. Lab A, Floor 2" value={location} onChange={e => setLocation(e.target.value)} error={errors.location} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={handleSave}>
            {editDevice ? "Update" : "Add Device"}
          </Button>
        </div>
      </div>
    </div>
  );
}
