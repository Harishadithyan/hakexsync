// src/components/AppLayout.jsx — ONLY icons updated

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMQTT } from "../hooks/useMQTT";
import MQTTStatus from "./MQTTStatus";
import { Logo } from "./UI";

// ✅ React Icons
import {
  FiHome,
  FiRefreshCw,
  FiAlertTriangle,
  FiUser,
  FiPlus,
  FiMenu,
  FiBell,
  FiSettings,
} from "react-icons/fi";

const NAV_ITEMS = [
  { path: "/dashboard", icon: FiHome, label: "Dashboard" },
  { path: "/sync", icon: FiRefreshCw, label: "Sync" },
  { path: "/alerts", icon: FiAlertTriangle, label: "Alerts" },
  { path: "/profile", icon: FiUser, label: "Profile" },
];

export default function AppLayout({ onAddDevice }) {
  const nav = useNavigate();
  const location = useLocation();
  const { displayName, initials } = useAuth();
  const { brokerState } = useMQTT();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  function navigate(path) {
    nav(path);
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      {/* BG grid */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"linear-gradient(rgba(47,47,228,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(47,47,228,0.04) 1px,transparent 1px)",
        backgroundSize:"44px 44px" }} />

      <div style={{ position:"fixed", width:400, height:400, borderRadius:"50%", filter:"blur(100px)", background:"rgba(47,47,228,0.08)", top:-120, right:-100, pointerEvents:"none", zIndex:0 }} />

      <div style={{ position:"fixed", width:300, height:300, borderRadius:"50%", filter:"blur(90px)", background:"rgba(22,46,147,0.07)", bottom:80, left:-80, pointerEvents:"none", zIndex:0 }} />

      {/* Mobile sidebar backdrop */}
      <div className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div style={{ padding:"22px 20px 16px", borderBottom:"1px solid var(--border)" }}>
          <Logo size="sm" />
          <div style={{ marginTop:12 }}>
            <MQTTStatus state={brokerState} />
          </div>
        </div>

        <nav style={{ flex:1, padding:"12px 10px" }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"var(--muted)", padding:"8px 12px 6px" }}>Navigation</p>

          {NAV_ITEMS.map(item => (
            <SidebarLink
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={active(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}

          <div style={{ height:1, background:"var(--border)", margin:"12px 8px" }} />

          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"1px", color:"var(--muted)", padding:"8px 12px 6px" }}>Devices</p>

          <button onClick={() => navigate("/add-device")} style={{
            width:"100%", display:"flex", alignItems:"center", gap:12,
            padding:"11px 14px", borderRadius:12, border:"none",
            background:"linear-gradient(135deg,var(--primary),var(--secondary))",
            color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600,
            fontFamily:"DM Sans,sans-serif",
            boxShadow:"0 4px 14px rgba(47,47,228,0.28)",
          }}>
            <FiPlus />
            Connect New Device
          </button>
        </nav>

        <div style={{ padding:"14px 16px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#7B2FFF,var(--primary))", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne,sans-serif", fontSize:13, fontWeight:800, flexShrink:0 }}>
            {initials||"?"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{displayName}</div>
            <div style={{ fontSize:11, color:"var(--purple)" }}>Pro Plan</div>
          </div>
          <button onClick={() => navigate("/profile")} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16, padding:4 }}>
            <FiSettings />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area" style={{ position:"relative", zIndex:1 }}>
        <header className="topbar">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg-hidden" style={{ background:"none", border:"none", color:"var(--text)", cursor:"pointer", fontSize:22, padding:4, lineHeight:1 }}>
            <FiMenu />
          </button>

          <div className="lg-hidden"><Logo size="sm" /></div>

          <div className="lg-only" style={{ fontFamily:"Syne,sans-serif", fontWeight:700, fontSize:18 }}>
            {NAV_ITEMS.find(i => active(i.path))?.label || "HakexSync"}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginLeft:"auto" }}>
            <div className="lg-only"><MQTTStatus state={brokerState} /></div>

            <button onClick={() => navigate("/add-device")} className="lg-only" style={{
              display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10,
              border:"1px solid var(--border2)", background:"rgba(47,47,228,0.1)",
              color:"var(--purple)", cursor:"pointer", fontSize:13, fontWeight:600,
              fontFamily:"DM Sans,sans-serif",
            }}>
              <FiPlus size={16} />
              Connect Device
            </button>

            <button style={{
              width:38, height:38, borderRadius:10, background:"var(--surface)",
              border:"1px solid var(--border)", display:"flex",
              alignItems:"center", justifyContent:"center",
              fontSize:16, cursor:"pointer", position:"relative",color:'white'
            }}>
              <FiBell />
              <span style={{
                position:"absolute", top:7, right:7,
                width:7, height:7, background:"var(--red)",
                borderRadius:"50%", border:"2px solid var(--dark)"
              }} />
            </button>

            <div onClick={() => navigate("/profile")} style={{
              width:38, height:38, borderRadius:10,
              background:"linear-gradient(135deg,#7B2FFF,var(--primary))",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"Syne,sans-serif", fontSize:13,
              fontWeight:800, cursor:"pointer"
            }}>
              {initials||"?"}
            </div>
          </div>
        </header>

        <main className="page-body">
          <div className="page-inner"><Outlet /></div>
        </main>

        {/* Bottom nav */}
        <nav className="bottom-nav">
          {NAV_ITEMS.slice(0,2).map(item => (
            <BottomNavItem key={item.path} icon={item.icon} label={item.label} active={active(item.path)} onClick={() => navigate(item.path)} />
          ))}

          <button onClick={() => navigate("/add-device")} style={{
            width:52, height:52, borderRadius:16,
            border:"2px solid rgba(47,47,228,0.35)",
            background:"linear-gradient(135deg,var(--primary),var(--secondary))",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, color:"#fff", cursor:"pointer",
            boxShadow:"0 4px 16px rgba(47,47,228,0.35)", marginBottom:4
          }}>
            <FiPlus />
          </button>

          {NAV_ITEMS.slice(2).map(item => (
            <BottomNavItem key={item.path} icon={item.icon} label={item.label} active={active(item.path)} onClick={() => navigate(item.path)} />
          ))}
        </nav>
      </div>

      <style>{`
        .lg-hidden { display:flex !important; }
        .lg-only   { display:none !important; }
        @media(min-width:1024px){
          .lg-hidden { display:none !important; }
          .lg-only   { display:flex !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }) {
  const Icon = icon;
  return (
    <button onClick={onClick} style={{
      width:"100%", display:"flex", alignItems:"center", gap:12,
      padding:"11px 14px", borderRadius:12, border:"none", cursor:"pointer",
      background: active?"rgba(47,47,228,0.14)":"transparent",
      color: active?"var(--text)":"var(--muted)",
      fontSize:14, fontWeight: active?600:400,
      fontFamily:"DM Sans,sans-serif", transition:"all 0.15s",
      borderLeft: active?"3px solid var(--primary)":"3px solid transparent",
      marginBottom:2,
    }}>
      <span style={{ fontSize:18, width:22, textAlign:"center" }}>
        <Icon />
      </span>
      {label}
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }) {
  const Icon = icon;
  return (
    <button onClick={onClick} style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      gap:3, padding:"4px 12px", background:"none",
      border:"none", cursor:"pointer"
    }}>
      <span style={{ fontSize:20,color:'white' }}>
        <Icon />
      </span>
      <span style={{
        fontSize:10, fontWeight:600, textTransform:"uppercase",
        letterSpacing:"0.5px",
        color: active?"var(--primary)":"var(--muted)"
      }}>
        {label}
      </span>
    </button>
  );
}