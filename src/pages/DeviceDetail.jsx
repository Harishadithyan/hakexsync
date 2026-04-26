// src/pages/DeviceDetail.jsx — with MQTT command panel
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { listenTelemetry, deleteDevice, updateDevice } from "../services/deviceService";
import { useToast } from "../context/ToastContext";
import { useMQTT } from "../hooks/useMQTT";
import { StatusPill, LiveBadge, Button, Spinner } from "../components/UI";
import DeviceModal from "../components/DeviceModal";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const ICONS = { server:"🖥️", sensor:"📡", iot:"🔌", camera:"📷", gateway:"🌐" };
const BG    = { server:"rgba(47,47,228,0.15)", sensor:"rgba(16,245,149,0.10)", iot:"rgba(255,184,48,0.10)", camera:"rgba(255,77,106,0.10)", gateway:"rgba(0,212,255,0.10)" };

export default function DeviceDetail() {
  const { id }        = useParams();
  const nav           = useNavigate();
  const { showToast } = useToast();
  const { publish, isConnected } = useMQTT();

  const [device,   setDevice]   = useState(null);
  const [telemetry,setTelemetry]= useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [delModal, setDelModal] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db,"devices",id), snap => {
      if (snap.exists()) setDevice({ id:snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    return listenTelemetry(id, data => {
      if (!data) return;
      setTelemetry(data);
      const ts = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
      setHistory(prev => [...prev, { ts, cpu:data.cpu, mem:data.mem, temp:data.temp }].slice(-20));
    });
  }, [id]);

  function sendCommand(action, extra = {}) {
    publish(id, "cmd", { action, ...extra });
    showToast(`Command "${action}" sent`, "info");
  }

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:60 }}><Spinner /></div>;
  if (!device) return <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>Device not found. <span onClick={() => nav("/dashboard")} style={{ color:"var(--primary)", cursor:"pointer" }}>← Back</span></div>;

  const hasCPU  = telemetry?.cpu  != null;
  const hasMem  = telemetry?.mem  != null;
  const hasTemp = telemetry?.temp != null;

  return (
    <>
      <button onClick={() => nav("/dashboard")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:"var(--muted)", fontSize:14, cursor:"pointer", marginBottom:24, fontFamily:"DM Sans,sans-serif" }}>
        ‹ Back to Dashboard
      </button>

      <div className="detail-layout">
        {/* Left */}
        <div>
          {/* Hero card */}
          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:28, textAlign:"center", marginBottom:16, animation:"fadeUp 0.3s ease" }}>
            <div style={{ width:72, height:72, borderRadius:20, background:BG[device.type]||BG.server, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px", boxShadow:`0 0 32px ${BG[device.type]||BG.server}` }}>
              {ICONS[device.type]||"📱"}
            </div>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>{device.name}</h2>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:12 }}>{device.location} · {device.type?.toUpperCase()}</p>
            <StatusPill status={device.status} />
            {device.paired && (
              <div style={{ marginTop:10, fontSize:12, color:"var(--green)" }}>✓ MQTT Paired</div>
            )}
            {device.lastSeen && (
              <div style={{ marginTop:4, fontSize:11, color:"var(--muted)" }}>
                Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Metrics */}
          {(hasCPU||hasMem||hasTemp) && (
            <div className="grid-2" style={{ marginBottom:16 }}>
              {hasCPU  && <BigMetric label="CPU"   value={`${Math.round(telemetry.cpu)}%`}   color={telemetry.cpu >80?"var(--red)":"var(--cyan)"}  />}
              {hasMem  && <BigMetric label="Mem"   value={`${Math.round(telemetry.mem)}%`}   color={telemetry.mem >80?"var(--red)":"var(--purple)"} />}
              {hasTemp && <BigMetric label="Temp"  value={`${Math.round(telemetry.temp)}°C`} color="var(--amber)" />}
              {telemetry?.rssi && <BigMetric label="RSSI" value={`${telemetry.rssi} dBm`} color={telemetry.rssi>-60?"var(--green)":"var(--amber)"} />}
            </div>
          )}

          {/* MQTT command panel */}
          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:18, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:14, fontWeight:700 }}>Remote Commands</h3>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color: isConnected?"var(--green)":"var(--muted)" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background: isConnected?"var(--green)":"var(--muted)", animation: isConnected?"pulse 1.5s infinite":"none" }} />
                {isConnected ? "MQTT connected" : "MQTT offline"}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { label:"🔔 Ping",          action:"ping" },
                { label:"🔄 Restart",       action:"restart" },
                { label:"⏱ 5s Interval",    action:"interval", extra:{ value:5000 } },
                { label:"⏱ 30s Interval",   action:"interval", extra:{ value:30000 } },
              ].map(cmd => (
                <button key={cmd.label} onClick={() => sendCommand(cmd.action, cmd.extra||{})} disabled={!isConnected}
                  style={{ padding:"9px 10px", borderRadius:10, border:"1px solid var(--border)", background:"var(--surface2)", color: isConnected?"var(--text)":"var(--muted)", cursor: isConnected?"pointer":"not-allowed", fontSize:12, fontFamily:"DM Sans,sans-serif", transition:"all 0.2s" }}>
                  {cmd.label}
                </button>
              ))}
            </div>
            {!isConnected && (
              <p style={{ fontSize:11, color:"var(--muted)", marginTop:10, textAlign:"center" }}>Connect to MQTT broker to send commands</p>
            )}
          </div>

          {/* MQTT topic info */}
          {device.mqttTopic && (
            <div style={{ background:"rgba(47,47,228,0.06)", border:"1px solid var(--border)", borderRadius:12, padding:14 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--muted)", marginBottom:8 }}>MQTT Topic</p>
              <code style={{ fontSize:11, color:"var(--purple)", wordBreak:"break-all", lineHeight:1.6 }}>{device.mqttTopic}</code>
            </div>
          )}

          {/* Edit / Delete */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
            <Button variant="ghost" onClick={() => setEditOpen(true)}>✏️ Edit</Button>
            <Button variant="danger" onClick={() => setDelModal(true)}>🗑️ Remove</Button>
          </div>
        </div>

        {/* Right */}
        <div>
          {/* Live chart */}
          {history.length > 2 && (hasCPU||hasMem) && (
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, padding:"20px 12px 12px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 8px", marginBottom:16 }}>
                <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:700 }}>Live Telemetry (MQTT)</h3>
                <LiveBadge />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={history}>
                  <CartesianGrid stroke="rgba(47,47,228,0.08)" strokeDasharray="3 3" />
                  <XAxis dataKey="ts" hide />
                  <YAxis domain={[0,100]} hide />
                  <Tooltip contentStyle={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }} labelStyle={{ color:"var(--muted)" }} />
                  {hasCPU && <Line type="monotone" dataKey="cpu" stroke="var(--cyan)"   dot={false} strokeWidth={2} name="CPU %" />}
                  {hasMem && <Line type="monotone" dataKey="mem" stroke="var(--purple)" dot={false} strokeWidth={2} name="Mem %" />}
                  {hasTemp && <Line type="monotone" dataKey="temp" stroke="var(--amber)" dot={false} strokeWidth={1.5} name="Temp °C" />}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:8 }}>
                {hasCPU  && <Legend color="var(--cyan)"   label="CPU %" />}
                {hasMem  && <Legend color="var(--purple)" label="Memory %" />}
                {hasTemp && <Legend color="var(--amber)"  label="Temp °C" />}
              </div>
            </div>
          )}

          {/* Activity */}
          <div style={{ marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:15, fontWeight:700 }}>Activity Log</h3>
              <LiveBadge />
            </div>
            <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden" }}>
              {ACTIVITY(device).map((a,i,arr) => (
                <div key={i} style={{ padding:"13px 16px", borderBottom: i<arr.length-1?"1px solid var(--border)":"none", display:"flex", alignItems:"flex-start", gap:12 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:a.color, flexShrink:0, marginTop:5 }} />
                  <div style={{ flex:1, fontSize:13, color:"var(--subtle)", lineHeight:1.5 }}>{a.text}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", flexShrink:0 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DeviceModal open={editOpen} onClose={() => setEditOpen(false)} onSave={async d => { await updateDevice(id,d); showToast("Updated","success"); }} editDevice={device} />

      {delModal && (
        <div onClick={e => { if(e.target===e.currentTarget) setDelModal(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", backdropFilter:"blur(8px)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"var(--surface2)", borderRadius:"24px 24px 0 0", border:"1px solid var(--border)", padding:"28px 24px 40px", width:"100%", maxWidth:480, animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ width:40, height:4, background:"var(--border2)", borderRadius:2, margin:"0 auto 24px" }} />
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:20, fontWeight:800, marginBottom:10 }}>Remove Device?</h2>
            <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.6, marginBottom:24 }}>Permanently removes <strong style={{ color:"var(--text)" }}>{device.name}</strong> and all MQTT + telemetry data.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Button variant="ghost" onClick={() => setDelModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={async () => { await deleteDevice(id); showToast("Removed","info"); nav("/dashboard"); }}>Remove</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BigMetric({ label, value, color }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"14px 16px" }}>
      <div style={{ fontFamily:"Syne,sans-serif", fontSize:28, fontWeight:800, color, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.8px" }}>{label}</div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)" }}>
      <div style={{ width:10, height:3, borderRadius:2, background:color }} />
      {label}
    </div>
  );
}

function ACTIVITY(device) {
  return [
    { color:"var(--green)",  text:"MQTT telemetry received",                     time:"just now" },
    { color:"#7B7FFF",       text:"Subscribed to cmd topic",                     time:"5 min ago" },
    { color: device.status==="offline"?"var(--red)":"var(--green)",
             text: device.status==="offline"?"LWT: device offline":"Heartbeat ping received", time:"12 min ago" },
    { color:"var(--amber)",  text:"CPU threshold warning",                        time:"1h ago" },
    { color:"var(--green)",  text:"Device paired via QR provisioning",            time:"6h ago" },
  ];
}
