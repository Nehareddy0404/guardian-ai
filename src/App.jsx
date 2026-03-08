import { useState } from "react";
import initialData from "./data/sample_incidents.json";
import { ruleBasedFilter, ruleBasedScamCheck, calcSafetyScore, getTrendData, getAIDigest, detectScamAI, askAssistant, getAIForecast, ruleBasedForecast } from "./helpers";
import { colors, glass, input, label, sevConfig } from "./styles";

const LOCS = ["Elmwood Village", "Allentown", "North Buffalo", "South Buffalo", "Hertel Ave", "Canalside", "University Heights", "Delaware District", "Larkinville", "Black Rock"];
const INIT_CIRCLES = [
  { id: 1, name: "Family Circle", members: ["Mom", "Dad", "Sister"], updates: [{ from: "Mom", message: "All safe at home ✅", time: "10:32 AM", encrypted: true }] },
  { id: 2, name: "Neighbors Watch", members: ["Alice", "Bob", "Carol"], updates: [{ from: "Bob", message: "Noticed suspicious car on Oak St", time: "9:15 AM", encrypted: true }] }
];

const scanKeyframes = `@keyframes scan{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,255,136,0.3)}50%{box-shadow:0 0 40px rgba(0,255,136,0.6)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-20px) rotate(5deg)}}
@keyframes drift{0%{transform:translateY(100vh) rotate(0deg);opacity:0}10%{opacity:0.25}90%{opacity:0.25}100%{transform:translateY(-100px) rotate(360deg);opacity:0}}
@keyframes binaryRain{0%{transform:translateY(-100%);opacity:0}10%{opacity:0.4}90%{opacity:0.4}100%{transform:translateY(100vh);opacity:0}}
@keyframes hexPulse{0%,100%{stroke-opacity:0.06}50%{stroke-opacity:0.15}}
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;600;700;800;900&display=swap');`;

const securityIcons = ["🔒", "🛡", "🔑", "⚿", "🔐", "🗝", "⛨", "☢"];
const binaryCols = Array.from({ length: 12 }, (_, i) => ({ left: Math.round(i * 8.5 + Math.random() * 4) + "%", delay: Math.round(Math.random() * 15 * 10) / 10 + "s", dur: Math.round((12 + Math.random() * 10) * 10) / 10 + "s", content: Array.from({ length: 20 }, () => Math.random() > 0.5 ? "1" : "0").join("\n") }));
const floatingIcons = securityIcons.map((icon, i) => ({ icon, left: Math.round(5 + i * 12) + "%", delay: i * 2.5 + "s", dur: Math.round(18 + Math.random() * 14) + "s" }));

function SafetyGauge({ score }) {
  const pct = score / 100;
  const color = score > 70 ? colors.green : score > 40 ? colors.amber : colors.red;
  const r = 54, circ = 2 * Math.PI * r, offset = circ * (1 - pct * 0.75);
  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <svg width="140" height="140" style={{ transform: "rotate(135deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(0,255,136,0.1)" strokeWidth="10" strokeDasharray={circ * 0.75 + " " + circ * 0.25} strokeLinecap="round" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ * 0.75 + " " + circ * 0.25} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "all 1s ease", filter: "drop-shadow(0 0 8px " + color + ")" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: "'JetBrains Mono',monospace" }}>{score}</div>
        <div style={{ fontSize: 9, color: colors.textDim, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Safety Score</div>
      </div>
    </div>
  );
}

function TrendChart({ data }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, padding: "8px 0" }}>
      {data.map(d => (
        <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 1, justifyContent: "flex-end", height: 60 }}>
            {d.digital > 0 && <div style={{ height: Math.max(4, (d.digital / max) * 55), background: colors.cyan, borderRadius: 3, transition: "height 0.5s" }} />}
            {d.physical > 0 && <div style={{ height: Math.max(4, (d.physical / max) * 55), background: colors.purple, borderRadius: 3, transition: "height 0.5s" }} />}
            {d.total === 0 && <div style={{ height: 4, background: "rgba(0,255,136,0.1)", borderRadius: 3 }} />}
          </div>
          <span style={{ fontSize: 9, color: colors.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [all, setAll] = useState(initialData);
  const [loc, setLoc] = useState("Elmwood Village");
  const [typeF, setTypeF] = useState("all");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(null);
  const [error, setError] = useState("");
  const [expId, setExpId] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [showReport, setShowReport] = useState(false);
  const [newRep, setNewRep] = useState({ raw: "", type: "digital", location: "Elmwood Village" });
  const [repOk, setRepOk] = useState(false);
  const [customLocs, setCustomLocs] = useState([]);
  const [newLoc, setNewLoc] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ raw: "", type: "", location: "" });
  const [elderly, setElderly] = useState(false);

  const [scamText, setScamText] = useState("");
  const [scamRes, setScamRes] = useState(null);
  const [scamLoad, setScamLoad] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([{ role: "assistant", text: "Hello! I'm your GuardianAI assistant. Ask me anything about safety in your area. 🛡" }]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoad, setChatLoad] = useState(false);

  const [circles, setCircles] = useState(INIT_CIRCLES);
  const [selCircle, setSelCircle] = useState(null);
  const [newCName, setNewCName] = useState("");
  const [newMem, setNewMem] = useState("");
  const [statusUpd, setStatusUpd] = useState("");
  const [sender, setSender] = useState("");

  // Threat Radar / Forecast
  const [forecast, setForecast] = useState(null);
  const [forecastLoad, setForecastLoad] = useState(false);

  const allLocs = [...LOCS, ...customLocs];
  const locInc = all.filter(i => i.location === loc);
  const digCt = locInc.filter(i => i.type === "digital").length;
  const physCt = locInc.filter(i => i.type === "physical").length;
  const score = calcSafetyScore(all, loc);
  const trend = getTrendData(all, loc);
  const noiseC = results.filter(r => r.isNoise).length;
  const signalC = results.filter(r => !r.isNoise).length;
  const fs = elderly ? 18 : 14;

  const filteredAll = all.filter(i => {
    if (search) { const s = search.toLowerCase(); return i.raw.toLowerCase().includes(s) || i.location.toLowerCase().includes(s) || i.type.includes(s); }
    return true;
  });

  function addLoc() { const t = newLoc.trim(); if (!t || allLocs.includes(t)) return; setCustomLocs(p => [...p, t]); setLoc(t); setNewLoc(""); }
  function submitReport() { if (!newRep.raw.trim()) return; setAll(p => [...p, { id: Date.now(), type: newRep.type, raw: newRep.raw.trim(), location: newRep.location, date: new Date().toISOString().split("T")[0] }]); setNewRep({ raw: "", type: "digital", location: "Downtown" }); setRepOk(true); setTimeout(() => { setRepOk(false); setShowReport(false); }, 2000); }
  function deleteReport(id) { if (window.confirm("Delete this report?")) setAll(p => p.filter(i => i.id !== id)); }
  function startEdit(inc) { setEditId(inc.id); setEditData({ raw: inc.raw, type: inc.type, location: inc.location }); }
  function saveEdit() { if (!editData.raw.trim()) return; setAll(p => p.map(i => i.id === editId ? { ...i, ...editData } : i)); setEditId(null); }

  async function analyze() {
    setLoading(true); setError(""); setResults([]); setExpId(null);
    const f = all.filter(i => i.location === loc && (typeF === "all" || i.type === typeF));
    if (!f.length) { setError("No incidents for this location."); setLoading(false); return; }
    try { setResults(await getAIDigest(f)); setAiUsed(true); }
    catch (e) { setResults(ruleBasedFilter(f)); setAiUsed(false); setError("AI unavailable — showing rule-based analysis (fallback)."); }
    setLoading(false);
  }

  async function checkScam() {
    if (!scamText.trim()) return; setScamLoad(true); setScamRes(null);
    try { setScamRes(await detectScamAI(scamText)); }
    catch (e) { setScamRes(ruleBasedScamCheck(scamText)); }
    setScamLoad(false);
  }

  async function sendChat() {
    if (!chatIn.trim()) return; const msg = chatIn.trim(); setChatIn("");
    setChatMsgs(p => [...p, { role: "user", text: msg }]); setChatLoad(true);
    try { const r = await askAssistant(msg, locInc, loc); setChatMsgs(p => [...p, { role: "assistant", text: r }]); }
    catch (e) { setChatMsgs(p => [...p, { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }]); }
    setChatLoad(false);
  }

  function createCircle() { if (!newCName.trim()) return; const c = { id: Date.now(), name: newCName.trim(), members: [], updates: [] }; setCircles(p => [...p, c]); setNewCName(""); setSelCircle(c.id); }
  function addMember() { if (!newMem.trim() || !selCircle) return; setCircles(p => p.map(c => c.id === selCircle && !c.members.includes(newMem.trim()) ? { ...c, members: [...c.members, newMem.trim()] } : c)); setNewMem(""); }
  function sendStatus() { if (!statusUpd.trim() || !sender.trim() || !selCircle) return; setCircles(p => p.map(c => c.id === selCircle ? { ...c, updates: [...c.updates, { from: sender.trim(), message: statusUpd.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), encrypted: true }] } : c)); setStatusUpd(""); }
  function emergencyBroadcast(msg) { setCircles(p => p.map(c => ({ ...c, updates: [...c.updates, { from: sender || "EMERGENCY", message: "🚨 " + msg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), encrypted: true }] }))); }

  async function runForecast() {
    setForecastLoad(true); setForecast(null);
    try { setForecast(await getAIForecast(all, allLocs)); }
    catch (e) { setForecast(ruleBasedForecast(all, allLocs)); }
    setForecastLoad(false);
  }

  const activeC = circles.find(c => c.id === selCircle);
  const tabs = [{ id: "dashboard", label: "◈ Dashboard" }, { id: "radar", label: "⊛ Threat Radar" }, { id: "scam", label: "⬡ Scam Scanner" }, { id: "circles", label: "◉ Safe Circles" }, { id: "incidents", label: "▤ Reports" }, { id: "locations", label: "◎ Locations" }];

  const btn = (active, gradient) => ({
    padding: elderly ? "12px 20px" : "8px 16px", background: active ? gradient : "transparent",
    border: active ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent", borderRadius: 8,
    color: active ? colors.green : colors.textDim, cursor: "pointer", fontSize: elderly ? 14 : 12,
    fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap",
    transition: "all 0.2s",
  });

  const actionBtn = (enabled, grad) => ({
    width: "100%", padding: elderly ? "14px" : "11px", background: enabled ? grad : "rgba(60,80,70,0.3)",
    border: "1px solid " + (enabled ? "rgba(0,255,136,0.3)" : "rgba(60,80,70,0.3)"), borderRadius: 10,
    color: "white", fontSize: elderly ? 16 : 14, fontWeight: 700, cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "'Inter',sans-serif", transition: "all 0.3s",
    boxShadow: enabled ? "0 4px 24px rgba(0,255,136,0.2)" : "none",
  });

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: "'Inter',sans-serif", color: colors.text, fontSize: fs }}>
      <style>{scanKeyframes}</style>

      <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "5%", left: "10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: "100%", background: "linear-gradient(transparent,rgba(0,255,136,0.06),transparent)" }} />
        <div style={{ position: "absolute", width: "100%", height: 2, background: "linear-gradient(90deg,transparent,rgba(0,255,136,0.15),transparent)", animation: "scan 8s linear infinite", opacity: 0.5 }} />
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => {
              const x = col * 180 + (row % 2 ? 90 : 0);
              const y = row * 160;
              return <polygon key={row + "-" + col} points={x + "," + (y + 40) + " " + (x + 45) + "," + (y) + " " + (x + 90) + "," + (y + 40) + " " + (x + 90) + "," + (y + 90) + " " + (x + 45) + "," + (y + 130) + " " + x + "," + (y + 90)} fill="none" stroke="rgba(0,255,136,0.1)" strokeWidth="1" style={{ animation: "hexPulse " + (6 + row % 3 * 2) + "s ease infinite", animationDelay: col * 0.5 + "s" }} />;
            })
          )}
        </svg>
        {binaryCols.map((col, i) => (
          <div key={"bin" + i} style={{ position: "absolute", left: col.left, top: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(0,255,136,0.25)", whiteSpace: "pre", lineHeight: "1.8", animation: "binaryRain " + col.dur + " linear infinite", animationDelay: col.delay, letterSpacing: 2 }}>{col.content}</div>
        ))}
        {floatingIcons.map((fi, i) => (
          <div key={"icon" + i} style={{ position: "absolute", left: fi.left, bottom: "-40px", fontSize: 28, opacity: 0, animation: "drift " + fi.dur + " linear infinite", animationDelay: fi.delay }}>{fi.icon}</div>
        ))}
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 200, opacity: 0.15 }}>
          <line x1="0" y1="180" x2="200" y2="180" stroke="#00ff88" strokeWidth="1" />
          <line x1="200" y1="180" x2="200" y2="120" stroke="#00ff88" strokeWidth="1" />
          <line x1="200" y1="120" x2="400" y2="120" stroke="#00ff88" strokeWidth="1" />
          <circle cx="400" cy="120" r="4" fill="#00ff88" />
          <line x1="400" y1="120" x2="400" y2="60" stroke="#00ff88" strokeWidth="1" />
          <line x1="400" y1="60" x2="600" y2="60" stroke="#00ff88" strokeWidth="1" />
          <circle cx="200" cy="180" r="3" fill="#00e5ff" />
          <line x1="600" y1="60" x2="800" y2="60" stroke="#00e5ff" strokeWidth="1" />
          <line x1="800" y1="60" x2="800" y2="140" stroke="#00e5ff" strokeWidth="1" />
          <line x1="800" y1="140" x2="1000" y2="140" stroke="#00e5ff" strokeWidth="1" />
          <circle cx="800" cy="60" r="3" fill="#00ff88" />
          <line x1="1000" y1="140" x2="1000" y2="40" stroke="#00ff88" strokeWidth="1" />
          <line x1="1000" y1="40" x2="1400" y2="40" stroke="#00ff88" strokeWidth="1" />
          <circle cx="1000" cy="140" r="4" fill="#00e5ff" />
          <line x1="1400" y1="40" x2="1400" y2="180" stroke="#00e5ff" strokeWidth="1" />
          <line x1="1400" y1="180" x2="1800" y2="180" stroke="#00e5ff" strokeWidth="1" />
        </svg>
      </div>

      <div style={{ background: "rgba(8,12,24,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid " + colors.border, padding: "0 24px", display: "flex", alignItems: "center", height: elderly ? 72 : 60, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: colors.shield, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, animation: "glow 3s ease infinite" }}>🛡</div>
          <span style={{ fontWeight: 900, fontSize: elderly ? 20 : 17, fontFamily: "'JetBrains Mono',monospace", color: colors.green }}>GuardianAI</span>
          <span style={{ background: colors.greenBg, color: colors.green, fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 700, border: "1px solid rgba(0,255,136,0.2)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>SECURE</span>
        </div>

        <div style={{ display: "flex", gap: 2, marginLeft: 28, overflowX: "auto" }}>
          {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={btn(tab === t.id, "rgba(0,255,136,0.1)")}>{t.label}</button>)}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setElderly(e => !e)} title="Accessibility Mode" style={{ padding: "5px 10px", background: elderly ? colors.greenBg : "transparent", border: "1px solid " + (elderly ? colors.green : colors.border), borderRadius: 8, color: elderly ? colors.green : colors.textDim, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
            {elderly ? "👁 A+" : "👁"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, background: colors.green, borderRadius: "50%", boxShadow: "0 0 8px " + colors.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: colors.textDim, fontFamily: "'JetBrains Mono',monospace" }}>LIVE</span>
          </div>
          <button onClick={() => { setShowReport(true); setTab("dashboard"); }} style={{ padding: "7px 14px", background: colors.shield, border: "none", borderRadius: 8, color: colors.bg, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>+ REPORT</button>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "28px 20px 80px" }}>

        {tab === "dashboard" && (<div>
          {showReport && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div style={{ ...glass, width: "100%", maxWidth: 480, background: "rgba(8,12,24,0.95)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: colors.green, fontFamily: "'JetBrains Mono',monospace" }}>⬡ Report Incident</h3>
                  <button onClick={() => setShowReport(false)} style={{ background: "rgba(0,255,136,0.1)", border: "1px solid " + colors.border, color: colors.green, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                {repOk ? (
                  <div style={{ textAlign: "center", padding: 32 }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><p style={{ color: colors.green, fontWeight: 700 }}>Incident reported successfully!</p></div>
                ) : (<div>
                  <div style={{ marginBottom: 14 }}><label style={label}>Describe the incident</label><textarea id="report-description" value={newRep.raw} onChange={e => setNewRep(p => ({ ...p, raw: e.target.value }))} placeholder="What happened in your area?" rows={4} style={{ ...input, resize: "vertical" }} /></div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1 }}><label style={label}>Type</label><select id="report-type" value={newRep.type} onChange={e => setNewRep(p => ({ ...p, type: e.target.value }))} style={input}><option value="digital" style={{ background: colors.bg }}>🌐 Digital</option><option value="physical" style={{ background: colors.bg }}>📍 Physical</option></select></div>
                    <div style={{ flex: 1 }}><label style={label}>Location</label><select id="report-location" value={newRep.location} onChange={e => setNewRep(p => ({ ...p, location: e.target.value }))} style={input}>{allLocs.map(l => <option key={l} value={l} style={{ background: colors.bg }}>{l}</option>)}</select></div>
                  </div>
                  <button id="submit-report" onClick={submitReport} disabled={!newRep.raw.trim()} style={actionBtn(!!newRep.raw.trim(), colors.shield)}>Submit Report</button>
                </div>)}
              </div>
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-block", background: colors.greenBg, border: "1px solid rgba(0,255,136,0.2)", borderRadius: 30, padding: "5px 16px", fontSize: 11, color: colors.green, marginBottom: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>◈ AI-POWERED THREAT INTELLIGENCE</div>
            <h1 style={{ fontSize: elderly ? 44 : 40, fontWeight: 900, margin: "0 0 10px", background: "linear-gradient(135deg, #00ff88 0%, #00e5ff 50%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Inter',sans-serif" }}>GuardianAI</h1>
            <p style={{ color: colors.textDim, fontSize: elderly ? 16 : 14, maxWidth: 500, margin: "0 auto" }}>AI for community safety — noise filtering delivers calm, verified, actionable intelligence.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ ...glass, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <SafetyGauge score={score} />
              <div style={{ marginTop: 8, fontSize: 10, color: colors.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{loc.toUpperCase()}</div>
            </div>
            <div style={glass}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ ...label, margin: 0 }}>7-Day Trend</span>
                <div style={{ display: "flex", gap: 12, fontSize: 10 }}>
                  <span style={{ color: colors.cyan }}>● Digital</span>
                  <span style={{ color: colors.purple }}>● Physical</span>
                </div>
              </div>
              <TrendChart data={trend} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {[{ l: "Reports", v: locInc.length, c: colors.green, i: "▣" }, { l: "Digital", v: digCt, c: colors.cyan, i: "⬡" }, { l: "Physical", v: physCt, c: colors.purple, i: "◎" }, { l: "Circles", v: circles.length, c: colors.amber, i: "◉" }].map(s => (
              <div key={s.l} style={{ flex: 1, minWidth: 100, ...glass, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 2, color: s.c }}>{s.i}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</div>
                <div style={{ fontSize: 10, color: colors.textDim, textTransform: "uppercase", letterSpacing: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ ...glass, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 140 }}><label style={label}>◎ Location</label><select id="location-filter" value={loc} onChange={e => { setLoc(e.target.value); setResults([]); setAiUsed(null); }} style={input}>{allLocs.map(l => <option key={l} value={l} style={{ background: colors.bg }}>{l}</option>)}</select></div>
              <div style={{ flex: 1, minWidth: 140 }}><label style={label}>⬡ Threat Type</label><select id="type-filter" value={typeF} onChange={e => setTypeF(e.target.value)} style={input}><option value="all" style={{ background: colors.bg }}>All Threats</option><option value="digital" style={{ background: colors.bg }}>Digital Only</option><option value="physical" style={{ background: colors.bg }}>Physical Only</option></select></div>
              <div style={{ minWidth: 180 }}><button id="analyze-button" onClick={analyze} disabled={loading} style={actionBtn(!loading, colors.shield)}>{loading ? "⟳ SCANNING..." : "⬡ ANALYZE THREATS"}</button></div>
            </div>
          </div>

          {aiUsed !== null && (
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", animation: "fadeIn 0.5s ease" }}>
              <div style={{ flex: 1, ...glass, padding: "10px 16px", borderLeft: "3px solid " + colors.green, fontSize: 12, color: colors.green }}>✓ <strong>{signalC}</strong> actionable alert{signalC !== 1 ? "s" : ""} — {aiUsed ? "AI Verified" : "Rule-based"}</div>
              <div style={{ flex: 1, ...glass, padding: "10px 16px", borderLeft: "3px solid " + colors.textMuted, fontSize: 12, color: colors.textDim }}>⊘ <strong>{noiseC}</strong> noise post{noiseC !== 1 ? "s" : ""} filtered</div>
            </div>
          )}

          {error && <div style={{ ...glass, borderLeft: "3px solid " + colors.amber, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: colors.amber }}>⚠ {error}</div>}

          {results.filter(r => !r.isNoise).map(inc => {
            const cfg = sevConfig[inc.severity] || sevConfig.medium;
            const isExp = expId === inc.id;
            return (
              <div key={inc.id} onClick={() => setExpId(isExp ? null : inc.id)} style={{ ...glass, borderLeft: "4px solid " + cfg.color, marginBottom: 14, cursor: "pointer", boxShadow: isExp ? "0 8px 32px rgba(0,255,136,0.15)" : "none", transition: "all 0.3s", animation: "fadeIn 0.5s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, border: "1px solid " + cfg.color, fontFamily: "'JetBrains Mono',monospace" }}>{cfg.label}</span>
                    <span style={{ background: inc.type === "digital" ? colors.cyanBg : colors.purpleBg, color: inc.type === "digital" ? colors.cyan : colors.purple, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{inc.type === "digital" ? "⬡ Digital" : "◎ Physical"}</span>
                    <span style={{ background: inc.isAI ? colors.greenBg : "rgba(100,120,110,0.15)", color: inc.isAI ? colors.green : colors.textDim, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{inc.isAI ? "◈ AI Verified" : "▤ Rule-based"}</span>
                  </div>
                  <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>{inc.date} {isExp ? "▲" : "▼"}</span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: elderly ? 16 : 14, fontWeight: 600, color: colors.text, lineHeight: 1.6 }}>{inc.summary}</p>
                {isExp && (
                  <div style={{ marginTop: 14 }}>
                    {inc.defenseChecklist && inc.defenseChecklist.length > 0 && (
                      <div style={{ ...glass, background: colors.cyanBg, borderColor: "rgba(0,229,255,0.2)", padding: 16, marginBottom: 10 }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 11, color: colors.cyan, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono',monospace" }}>◈ DEFENSE CHECKLIST</p>
                        {inc.defenseChecklist.map((item, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ background: "rgba(0,229,255,0.25)", color: colors.cyan, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 12, color: colors.cyan, lineHeight: 1.5 }}>{item}</span></div>)}
                      </div>
                    )}
                    <div style={{ ...glass, background: "rgba(0,255,136,0.04)", padding: 16 }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 11, color: colors.green, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'JetBrains Mono',monospace" }}>✓ IMMEDIATE ACTIONS</p>
                      {inc.actionSteps.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ background: colors.shield, color: colors.bg, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>{s}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>)}

        {tab === "scam" && (<div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-block", background: colors.redBg, border: "1px solid rgba(255,59,92,0.3)", borderRadius: 30, padding: "5px 16px", fontSize: 11, color: colors.red, marginBottom: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>⬡ AI THREAT SCANNER</div>
            <h2 style={{ fontSize: elderly ? 36 : 32, fontWeight: 900, margin: "0 0 8px", background: "linear-gradient(135deg, #ff3b5c, #ff6b2b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Scam Scanner</h2>
            <p style={{ color: colors.textDim, fontSize: elderly ? 15 : 13, maxWidth: 480, margin: "0 auto" }}>Paste any suspicious text, email, or message for instant AI + rule-based analysis.</p>
          </div>
          <div style={{ ...glass, marginBottom: 20 }}>
            <label style={label}>Paste suspicious message</label>
            <textarea id="scam-input" value={scamText} onChange={e => { setScamText(e.target.value); setScamRes(null); }} placeholder="e.g. 'Congratulations! You've won a $1000 gift card. Click here to claim...'" rows={5} style={{ ...input, resize: "vertical", marginBottom: 14 }} />
            <button id="scam-check" onClick={checkScam} disabled={scamLoad || !scamText.trim()} style={actionBtn(!!scamText.trim() && !scamLoad, colors.danger)}>{scamLoad ? "⟳ SCANNING..." : "⬡ SCAN FOR THREATS"}</button>
          </div>
          {scamRes && scamRes.verdict !== "ERROR" && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{ ...glass, marginBottom: 14, borderLeft: "4px solid " + (scamRes.verdict === "SCAM" ? colors.red : scamRes.verdict === "SUSPICIOUS" ? colors.amber : colors.green), background: scamRes.verdict === "SCAM" ? colors.redBg : scamRes.verdict === "SUSPICIOUS" ? colors.amberBg : colors.greenBg }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 44 }}>{scamRes.verdict === "SCAM" ? "🚨" : scamRes.verdict === "SUSPICIOUS" ? "⚠️" : "✅"}</div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: scamRes.verdict === "SCAM" ? colors.red : scamRes.verdict === "SUSPICIOUS" ? colors.amber : colors.green, fontFamily: "'JetBrains Mono',monospace" }}>{scamRes.verdict}</div>
                    <div style={{ fontSize: 12, color: colors.textDim }}>Confidence: <strong style={{ color: colors.text }}>{scamRes.confidence}</strong>{scamRes.isAI === false && <span style={{ marginLeft: 8, color: colors.amber, fontSize: 10 }}>▤ Rule-based fallback</span>}</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: colors.text, lineHeight: 1.6 }}>{scamRes.explanation}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {scamRes.redFlags && scamRes.redFlags.length > 0 && <div style={{ ...glass, padding: 18 }}><p style={{ margin: "0 0 10px", ...label, color: colors.red }}>⚑ RED FLAGS</p>{scamRes.redFlags.map((f, i) => <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}><span style={{ color: colors.red, flexShrink: 0 }}>•</span><span style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{f}</span></div>)}</div>}
                {scamRes.whatToDo && scamRes.whatToDo.length > 0 && <div style={{ ...glass, padding: 18 }}><p style={{ margin: "0 0 10px", ...label, color: colors.green }}>✓ ACTIONS</p>{scamRes.whatToDo.map((a, i) => <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}><span style={{ background: colors.shield, color: colors.bg, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span><span style={{ fontSize: 12, color: colors.green, lineHeight: 1.5 }}>{a}</span></div>)}</div>}
              </div>
            </div>
          )}
        </div>)}

        {tab === "circles" && (<div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-block", background: colors.amberBg, border: "1px solid rgba(255,176,32,0.3)", borderRadius: 30, padding: "5px 16px", fontSize: 11, color: colors.amber, marginBottom: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>◉ END-TO-END ENCRYPTED</div>
            <h2 style={{ fontSize: elderly ? 36 : 32, fontWeight: 900, margin: "0 0 8px", background: "linear-gradient(135deg, #ffb020, #ff6b2b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Safe Circles</h2>
            <p style={{ color: colors.textDim, fontSize: 13 }}>Share encrypted status updates with trusted people during emergencies.</p>
          </div>

          <div style={{ ...glass, marginBottom: 20, borderLeft: "3px solid " + colors.red, padding: 16 }}>
            <p style={{ margin: "0 0 10px", ...label, color: colors.red }}>⚡ EMERGENCY BROADCAST</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input type="text" value={sender} onChange={e => setSender(e.target.value)} placeholder="Your name (optional)" style={{ ...input, flex: 1 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => emergencyBroadcast("I NEED HELP — please check on me")} style={{ flex: 1, padding: "10px", background: "rgba(255,59,92,0.2)", border: "1px solid " + colors.red, borderRadius: 8, color: colors.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}>🚨 I NEED HELP</button>
              <button onClick={() => emergencyBroadcast("I'm safe and accounted for ✅")} style={{ flex: 1, padding: "10px", background: colors.greenBg, border: "1px solid " + colors.green, borderRadius: 8, color: colors.green, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", transition: "all 0.2s" }}>✅ I'M SAFE</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
            <div>
              <div style={{ ...glass, marginBottom: 14, padding: 18 }}><label style={label}>Create Circle</label><input type="text" value={newCName} onChange={e => setNewCName(e.target.value)} placeholder="Circle name..." style={{ ...input, marginBottom: 10 }} onKeyDown={e => { if (e.key === "Enter") createCircle(); }} /><button onClick={createCircle} disabled={!newCName.trim()} style={actionBtn(!!newCName.trim(), colors.accent)}>Create Circle</button></div>
              {circles.map(c => (
                <div key={c.id} onClick={() => setSelCircle(c.id)} style={{ ...glass, padding: 14, marginBottom: 8, cursor: "pointer", borderColor: selCircle === c.id ? "rgba(255,176,32,0.4)" : colors.border, transition: "all 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: colors.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◉</div>
                    <div><div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div><div style={{ fontSize: 10, color: colors.textDim }}>{c.members.length} members · {c.updates.length} updates</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              {activeC ? (<div>
                <div style={{ ...glass, marginBottom: 14, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.amber, fontFamily: "'JetBrains Mono',monospace" }}>◉ {activeC.name}</h3>
                    <span style={{ background: colors.greenBg, color: colors.green, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>🔒 Encrypted</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                    {activeC.members.map(m => <span key={m} style={{ background: "rgba(0,255,136,0.06)", color: colors.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, border: "1px solid " + colors.border }}>{m}</span>)}
                    {!activeC.members.length && <span style={{ fontSize: 11, color: colors.textMuted }}>No members yet</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}><input type="text" value={newMem} onChange={e => setNewMem(e.target.value)} placeholder="Add member..." style={{ ...input, flex: 1 }} onKeyDown={e => { if (e.key === "Enter") addMember(); }} /><button onClick={addMember} disabled={!newMem.trim()} style={{ padding: "10px 14px", background: newMem.trim() ? "rgba(0,229,255,0.15)" : "rgba(60,80,70,0.2)", border: "1px solid " + (newMem.trim() ? colors.cyan : colors.border), borderRadius: 8, color: newMem.trim() ? colors.cyan : colors.textMuted, fontSize: 12, fontWeight: 700, cursor: newMem.trim() ? "pointer" : "not-allowed" }}>+ Add</button></div>
                </div>
                <div style={{ ...glass, marginBottom: 14, padding: 18 }}>
                  <p style={{ margin: "0 0 12px", ...label }}>◈ ENCRYPTED UPDATES</p>
                  {!activeC.updates.length && <p style={{ color: colors.textMuted, fontSize: 12 }}>No updates yet.</p>}
                  {activeC.updates.map((u, i) => (
                    <div key={i} style={{ ...glass, padding: 12, marginBottom: 8, background: u.message.startsWith("🚨") ? "rgba(255,59,92,0.08)" : "rgba(0,255,136,0.03)", borderColor: u.message.startsWith("🚨") ? "rgba(255,59,92,0.3)" : colors.border }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: colors.cyan }}>{u.from}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontSize: 9, color: colors.green }}>🔒</span><span style={{ fontSize: 10, color: colors.textMuted }}>{u.time}</span></div>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: colors.text }}>{u.message}</p>
                    </div>
                  ))}
                </div>
                <div style={{ ...glass, padding: 18 }}>
                  <p style={{ margin: "0 0 10px", ...label }}>SEND STATUS</p>
                  <input type="text" value={sender} onChange={e => setSender(e.target.value)} placeholder="Your name..." style={{ ...input, marginBottom: 8 }} />
                  <input type="text" value={statusUpd} onChange={e => setStatusUpd(e.target.value)} placeholder="I'm safe / Need help at..." style={{ ...input, marginBottom: 10 }} onKeyDown={e => { if (e.key === "Enter") sendStatus(); }} />
                  <button onClick={sendStatus} disabled={!statusUpd.trim() || !sender.trim()} style={actionBtn(!!statusUpd.trim() && !!sender.trim(), colors.accent)}>◉ Send Encrypted Update</button>
                </div>
              </div>) : (
                <div style={{ ...glass, textAlign: "center", padding: 60 }}><div style={{ fontSize: 44, marginBottom: 14 }}>◉</div><p style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Select a circle</p><p style={{ fontSize: 12, color: colors.textMuted }}>Or create a new one to get started</p></div>
              )}
            </div>
          </div>
        </div>)}

        {tab === "incidents" && (<div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: elderly ? 26 : 22, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: colors.green }}>▤ All Reports</h2>
            <span style={{ background: colors.greenBg, color: colors.green, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{filteredAll.length}</span>
          </div>
          <div style={{ ...glass, marginBottom: 20, padding: 16 }}>
            <input id="search-reports" type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="⌕ Search reports by keyword, location, type..." style={input} />
          </div>
          {filteredAll.map(inc => (
            <div key={inc.id} style={{ ...glass, marginBottom: 10, padding: 16, animation: "fadeIn 0.3s ease" }}>
              {editId === inc.id ? (
                <div>
                  <textarea value={editData.raw} onChange={e => setEditData(p => ({ ...p, raw: e.target.value }))} rows={3} style={{ ...input, marginBottom: 8, resize: "vertical" }} />
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <select value={editData.type} onChange={e => setEditData(p => ({ ...p, type: e.target.value }))} style={{ ...input, flex: 1 }}><option value="digital" style={{ background: colors.bg }}>Digital</option><option value="physical" style={{ background: colors.bg }}>Physical</option></select>
                    <select value={editData.location} onChange={e => setEditData(p => ({ ...p, location: e.target.value }))} style={{ ...input, flex: 1 }}>{allLocs.map(l => <option key={l} value={l} style={{ background: colors.bg }}>{l}</option>)}</select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveEdit} style={{ padding: "7px 16px", background: colors.shield, border: "none", borderRadius: 8, color: colors.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditId(null)} style={{ padding: "7px 16px", background: "transparent", border: "1px solid " + colors.border, borderRadius: 8, color: colors.textDim, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ background: "rgba(0,255,136,0.06)", color: colors.textDim, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>◎ {inc.location}</span>
                      <span style={{ background: inc.type === "digital" ? colors.cyanBg : colors.purpleBg, color: inc.type === "digital" ? colors.cyan : colors.purple, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{inc.type === "digital" ? "⬡ Digital" : "◎ Physical"}</span>
                      <span style={{ background: "rgba(0,255,136,0.04)", color: colors.textMuted, padding: "2px 10px", borderRadius: 20, fontSize: 10 }}>{inc.date}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); startEdit(inc); }} style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 6, color: colors.cyan, padding: "3px 10px", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>Edit</button>
                      <button onClick={e => { e.stopPropagation(); deleteReport(inc.id); }} style={{ background: colors.redBg, border: "1px solid rgba(255,59,92,0.2)", borderRadius: 6, color: colors.red, padding: "3px 10px", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>Delete</button>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: elderly ? 15 : 13, color: colors.text, lineHeight: 1.5 }}>{inc.raw}</p>
                </div>
              )}
            </div>
          ))}
        </div>)}


        {tab === "radar" && (<div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-block", background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 30, padding: "5px 16px", fontSize: 11, color: colors.purple, marginBottom: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>⊛ PREDICTIVE THREAT INTELLIGENCE</div>
            <h2 style={{ fontSize: elderly ? 36 : 32, fontWeight: 900, margin: "0 0 8px", background: "linear-gradient(135deg, #a855f7, #00e5ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Threat Radar</h2>
            <p style={{ color: colors.textDim, fontSize: 13, maxWidth: 500, margin: "0 auto" }}>AI-powered predictive analysis — visualize threat patterns and forecast emerging risks.</p>
          </div>

          <div style={{ ...glass, marginBottom: 20, padding: 20, position: "relative", overflow: "hidden" }}>
            <svg viewBox="0 0 700 400" style={{ width: "100%", height: 400 }}>
              {[160, 120, 80, 40].map(r => <circle key={r} cx="350" cy="200" r={r} fill="none" stroke="rgba(0,255,136,0.08)" strokeWidth="1" />)}
              <line x1="190" y1="200" x2="510" y2="200" stroke="rgba(0,255,136,0.06)" strokeWidth="1" />
              <line x1="350" y1="40" x2="350" y2="360" stroke="rgba(0,255,136,0.06)" strokeWidth="1" />
              <line x1="237" y1="87" x2="463" y2="313" stroke="rgba(0,255,136,0.04)" strokeWidth="1" />
              <line x1="463" y1="87" x2="237" y2="313" stroke="rgba(0,255,136,0.04)" strokeWidth="1" />
              <line x1="350" y1="200" x2="510" y2="200" stroke="rgba(0,255,136,0.4)" strokeWidth="2" style={{ transformOrigin: "350px 200px", animation: "spin 6s linear infinite" }} />
              {allLocs.map((locName, i) => {
                const angle = (i / allLocs.length) * Math.PI * 2 - Math.PI / 2;
                const ct = all.filter(inc => inc.location === locName).length;
                const sc = calcSafetyScore(all, locName);
                const risk = ct >= 4 ? 2 : ct >= 2 ? 1 : 0;
                const nodeColor = risk === 2 ? colors.red : risk === 1 ? colors.amber : colors.green;
                const dist = 60 + Math.min(ct * 12, 100);
                const cx = 350 + Math.cos(angle) * dist;
                const cy = 200 + Math.sin(angle) * dist;
                return (<g key={locName}>
                  <line x1="350" y1="200" x2={cx} y2={cy} stroke={nodeColor} strokeWidth="1" opacity="0.2" />
                  {risk >= 1 && <circle cx={cx} cy={cy} r={risk === 2 ? 28 : 20} fill="none" stroke={nodeColor} strokeWidth="1" opacity="0.3" style={{ animation: "pulse 2s ease infinite", animationDelay: i * 0.3 + "s" }} />}
                  {risk === 2 && <circle cx={cx} cy={cy} r={36} fill="none" stroke={nodeColor} strokeWidth="1" opacity="0.15" style={{ animation: "pulse 3s ease infinite" }} />}
                  <circle cx={cx} cy={cy} r={8 + ct * 1.5} fill={nodeColor} opacity="0.25" />
                  <circle cx={cx} cy={cy} r={5 + ct} fill={nodeColor} opacity="0.5" style={{ filter: "drop-shadow(0 0 6px " + nodeColor + ")" }} />
                  <circle cx={cx} cy={cy} r={3} fill="white" opacity="0.9" />
                  <text x={cx} y={cy - 14 - ct} textAnchor="middle" fill={nodeColor} fontSize="10" fontWeight="700" fontFamily="'JetBrains Mono',monospace">{locName}</text>
                  <text x={cx} y={cy + 20 + ct} textAnchor="middle" fill={colors.textDim} fontSize="9" fontFamily="'JetBrains Mono',monospace">{ct} reports · {sc}/100</text>
                </g>);
              })}
              <circle cx="350" cy="200" r="12" fill="rgba(0,255,136,0.15)" stroke={colors.green} strokeWidth="2" style={{ animation: "pulse 2s ease infinite" }} />
              <circle cx="350" cy="200" r="4" fill={colors.green} />
              <text x="350" y="222" textAnchor="middle" fill={colors.green} fontSize="8" fontWeight="700" fontFamily="'JetBrains Mono',monospace">GUARDIANAI HQ</text>
            </svg>
            <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
          </div>

          <div style={{ ...glass, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div><span style={{ ...label, margin: 0 }}>⊛ AI THREAT FORECAST — NEXT 7 DAYS</span></div>
              <button onClick={runForecast} disabled={forecastLoad} style={{ padding: "8px 20px", background: forecastLoad ? "rgba(60,80,70,0.3)" : colors.accent, border: "none", borderRadius: 8, color: forecastLoad ? colors.textMuted : "white", fontSize: 12, fontWeight: 700, cursor: forecastLoad ? "not-allowed" : "pointer", fontFamily: "'JetBrains Mono',monospace" }}>{forecastLoad ? "⟳ ANALYZING..." : "⊛ RUN FORECAST"}</button>
            </div>

            {!forecast && !forecastLoad && <p style={{ color: colors.textMuted, fontSize: 12, textAlign: "center", padding: 20 }}>Click "Run Forecast" to generate AI-powered threat predictions for all locations.</p>}

            {forecast && (<div style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ ...glass, padding: 14, textAlign: "center", background: forecast.overallTrend === "increasing" ? colors.redBg : forecast.overallTrend === "stable" ? colors.amberBg : colors.greenBg }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{forecast.overallTrend === "increasing" ? "📈" : forecast.overallTrend === "stable" ? "➡️" : "📉"}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: forecast.overallTrend === "increasing" ? colors.red : forecast.overallTrend === "stable" ? colors.amber : colors.green, fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase" }}>{forecast.overallTrend}</div>
                  <div style={{ fontSize: 9, color: colors.textDim, marginTop: 2 }}>OVERALL TREND</div>
                </div>
                <div style={{ ...glass, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
                  <div style={{ fontSize: 11, color: colors.text, lineHeight: 1.4 }}>{forecast.topRisk}</div>
                  <div style={{ fontSize: 9, color: colors.textDim, marginTop: 4 }}>TOP RISK</div>
                </div>
                <div style={{ ...glass, padding: 14, textAlign: "center", background: colors.purpleBg }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>🧠</div>
                  <div style={{ fontSize: 11, color: colors.purple, lineHeight: 1.4 }}>{forecast.aiInsight}</div>
                  <div style={{ fontSize: 9, color: colors.textDim, marginTop: 4 }}>{forecast.isAI ? "AI INSIGHT" : "RULE-BASED"}</div>
                </div>
              </div>
              {forecast.predictions && forecast.predictions.filter(p => p.riskLevel !== "low").map((p, i) => {
                const cfg = p.riskLevel === "high" ? { color: colors.red, bg: colors.redBg, icon: "🔴" } : { color: colors.amber, bg: colors.amberBg, icon: "🟡" };
                return (<div key={i} style={{ ...glass, marginBottom: 10, padding: 16, borderLeft: "3px solid " + cfg.color, background: cfg.bg }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{cfg.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "'JetBrains Mono',monospace" }}>{p.location}</span>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 800, border: "1px solid " + cfg.color, fontFamily: "'JetBrains Mono',monospace" }}>{p.riskLevel.toUpperCase()}</span>
                    </div>
                  </div>
                  {p.predictedThreats && p.predictedThreats.map((t, j) => <div key={j} style={{ display: "flex", gap: 6, marginBottom: 4 }}><span style={{ color: cfg.color, fontSize: 10 }}>▸</span><span style={{ fontSize: 12, color: colors.text, lineHeight: 1.4 }}>{t}</span></div>)}
                  <div style={{ marginTop: 8, fontSize: 11, color: colors.textDim, fontStyle: "italic" }}>💡 {p.recommendation}</div>
                </div>);
              })}
              {forecast.predictions && forecast.predictions.filter(p => p.riskLevel === "low").length > 0 && (
                <div style={{ ...glass, padding: 14, textAlign: "center" }}>
                  <span style={{ color: colors.green, fontSize: 12 }}>✓ {forecast.predictions.filter(p => p.riskLevel === "low").length} locations at LOW risk: </span>
                  <span style={{ color: colors.textDim, fontSize: 12 }}>{forecast.predictions.filter(p => p.riskLevel === "low").map(p => p.location).join(", ")}</span>
                </div>
              )}
            </div>)}
          </div>
        </div>)}

        {tab === "locations" && (<div>
          <h2 style={{ margin: "0 0 20px", fontSize: elderly ? 26 : 22, fontWeight: 900, fontFamily: "'JetBrains Mono',monospace", color: colors.green }}>◎ Locations</h2>
          <div style={{ ...glass, marginBottom: 24 }}>
            <label style={label}>Add New Location</label>
            <div style={{ display: "flex", gap: 10 }}><input type="text" value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder="Neighborhood name..." style={{ ...input, flex: 1 }} onKeyDown={e => { if (e.key === "Enter") addLoc(); }} /><button onClick={addLoc} disabled={!newLoc.trim()} style={{ padding: "11px 20px", background: newLoc.trim() ? colors.shield : "rgba(60,80,70,0.3)", border: "none", borderRadius: 10, color: newLoc.trim() ? colors.bg : colors.textMuted, fontSize: 13, fontWeight: 700, cursor: newLoc.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>Add</button></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
            {allLocs.map(l => {
              const ct = all.filter(i => i.location === l).length;
              const sc = calcSafetyScore(all, l);
              const scColor = sc > 70 ? colors.green : sc > 40 ? colors.amber : colors.red;
              return (
                <div key={l} onClick={() => { setLoc(l); setTab("dashboard"); setResults([]); setAiUsed(null); }} style={{ ...glass, padding: 16, cursor: "pointer", borderColor: loc === l ? "rgba(0,255,136,0.4)" : colors.border, textAlign: "center", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 22, marginBottom: 6, color: scColor }}>◎</div>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2, fontFamily: "'JetBrains Mono',monospace" }}>{l}</div>
                  <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 6 }}>{ct} report{ct !== 1 ? "s" : ""}</div>
                  <span style={{ background: scColor + "22", color: scColor, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, border: "1px solid " + scColor, fontFamily: "'JetBrains Mono',monospace" }}>{sc}/100</span>
                  {customLocs.includes(l) && <div style={{ marginTop: 4, color: colors.cyan, fontSize: 9, fontWeight: 600 }}>CUSTOM</div>}
                </div>
              );
            })}
          </div>
        </div>)}
      </div>

      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}>
        {chatOpen && (
          <div style={{ width: 350, height: 440, background: "rgba(8,12,24,0.97)", backdropFilter: "blur(20px)", border: "1px solid " + colors.border, borderRadius: 20, marginBottom: 12, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid " + colors.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, background: colors.shield, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>◈</div>
                <div><div style={{ fontWeight: 700, fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>Guardian AI</div><div style={{ fontSize: 9, color: colors.green }}>● ONLINE</div></div>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: "rgba(0,255,136,0.1)", border: "1px solid " + colors.border, color: colors.green, width: 24, height: 24, borderRadius: 6, cursor: "pointer", fontSize: 12 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? colors.shield : "rgba(0,255,136,0.06)", fontSize: 12, color: m.role === "user" ? colors.bg : colors.text, lineHeight: 1.5, fontWeight: m.role === "user" ? 600 : 400 }}>{m.text}</div>
                </div>
              ))}
              {chatLoad && <div style={{ display: "flex", justifyContent: "flex-start" }}><div style={{ padding: "9px 13px", borderRadius: "14px 14px 14px 4px", background: "rgba(0,255,136,0.06)", fontSize: 12, color: colors.textDim }}>⟳ Processing...</div></div>}
            </div>
            <div style={{ padding: 10, borderTop: "1px solid " + colors.border, display: "flex", gap: 6 }}>
              <input value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendChat(); }} placeholder="Ask about safety..." style={{ ...input, flex: 1, padding: "7px 11px", fontSize: 12 }} />
              <button onClick={sendChat} disabled={!chatIn.trim() || chatLoad} style={{ padding: "7px 12px", background: chatIn.trim() ? colors.shield : "rgba(60,80,70,0.3)", border: "none", borderRadius: 8, color: chatIn.trim() ? colors.bg : colors.textMuted, cursor: chatIn.trim() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700 }}>➤</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(o => !o)} style={{ width: 52, height: 52, background: colors.shield, border: "none", borderRadius: "50%", color: colors.bg, fontSize: 20, cursor: "pointer", boxShadow: "0 8px 32px rgba(0,255,136,0.4)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", animation: "glow 3s ease infinite", fontWeight: 900 }}>{chatOpen ? "✕" : "◈"}</button>
      </div>
    </div>
  );
}