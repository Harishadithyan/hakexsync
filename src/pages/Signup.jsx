// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp, parseAuthError } from "../services/authService";
import { Button, Input, ErrorBox, Logo } from "../components/UI";

export default function Signup() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const nav = useNavigate();

  function validate() {
    const e = {};
    if (!name.trim())         e.name     = "Full name is required";
    if (!email.trim())        e.email    = "Email is required";
    if (!email.includes("@")) e.email    = "Enter a valid email";
    if (password.length < 6)  e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try { await signUp(name.trim(), email.trim(), password); nav("/dashboard", { replace: true }); }
    catch (err) { setError(parseAuthError(err.code)); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page" style={{ position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, backgroundImage:"linear-gradient(rgba(47,47,228,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(47,47,228,0.05) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none" }} />
      <div style={{ position:"fixed", width:320, height:320, borderRadius:"50%", filter:"blur(90px)", background:"rgba(155,122,255,0.1)", top:-80, left:-70, pointerEvents:"none" }} />

      <div className="auth-card" style={{ position:"relative", zIndex:1 }}>
        <div style={{ marginBottom:40 }}><Logo size="md" /></div>

        <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(28px,5vw,40px)", fontWeight:800, lineHeight:1.1, marginBottom:8 }}>
          Create<br />account
        </h1>
        <p style={{ color:"var(--muted)", fontSize:14, marginBottom:32, lineHeight:1.7 }}>
          Join HakexSync and start managing your devices in real-time.
        </p>

        <ErrorBox message={error} />

        <form onSubmit={handleSubmit}>
          <Input label="Full Name"      placeholder="Alex Johnson"       value={name}     onChange={e => setName(e.target.value)}     error={errors.name} />
          <Input label="Email address"  type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
          <Input label="Password"       type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />
          <Button loading={loading} onClick={handleSubmit} style={{ marginTop:8 }}>Create Account →</Button>
        </form>

        <p style={{ textAlign:"center", marginTop:24, fontSize:14, color:"var(--muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:"var(--primary)", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
