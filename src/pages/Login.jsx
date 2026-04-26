// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn, parseAuthError } from "../services/authService";
import { Button, Input, ErrorBox, Logo } from "../components/UI";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const nav = useNavigate();

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try { await signIn(email.trim(), password); nav("/dashboard", { replace: true }); }
    catch (err) { setError(parseAuthError(err.code)); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page" style={{ position:"relative", overflow:"hidden" }}>
      {/* BG decorations */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(47,47,228,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(47,47,228,0.05) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:380, height:380, borderRadius:"50%", filter:"blur(100px)", background:"rgba(47,47,228,0.11)", top:-100, right:-80, pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:260, height:260, borderRadius:"50%", filter:"blur(90px)", background:"rgba(155,122,255,0.08)", bottom:60, left:-70, pointerEvents:"none" }} />

      <div className="auth-card" style={{ position:"relative", zIndex:1 }}>
        <div style={{ marginBottom:44 }}><Logo size="md" /></div>

        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:800, lineHeight:1.1, marginBottom:8 }}>
          Welcome<br />back
        </h1>
        <p style={{ color:"var(--muted)", fontSize:14, marginBottom:36, lineHeight:1.7 }}>
          Sign in to monitor and sync your connected devices in real-time.
        </p>

        <ErrorBox message={error} />

        <form onSubmit={handleSubmit}>
          <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          <Button loading={loading} onClick={handleSubmit} style={{ marginTop:8 }}>Sign In →</Button>
        </form>

        <p style={{ textAlign:"center", marginTop:24, fontSize:14, color:"var(--muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color:"var(--primary)", fontWeight:600, textDecoration:"none" }}>Create one</Link>
        </p>

        <div style={{ marginTop:32, padding:"12px 14px", background:"rgba(47,47,228,0.06)", border:"1px solid var(--border)", borderRadius:10, fontSize:12, color:"var(--muted)", lineHeight:1.7 }}>
          <strong style={{ color:"var(--subtle)" }}>Setup:</strong> Add your Firebase config to{" "}
          <code style={{ color:"var(--purple)", fontSize:11 }}>src/services/firebase.js</code> then sign up.
        </div>
      </div>
    </div>
  );
}
