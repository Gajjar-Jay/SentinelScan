import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Inline schematic icons — stroke-only, technical-drawing style      */
/* ------------------------------------------------------------------ */
const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IconHub = (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="2.5" /><circle cx="12" cy="3.5" r="1.6" /><circle cx="19.5" cy="16.5" r="1.6" /><circle cx="4.5" cy="16.5" r="1.6" /><path d="M12 6v3.3M17.3 15.2l-2.8-1.6M6.7 15.2l2.8-1.6" /></svg>);
const IconCode = (p) => (<svg {...iconProps} {...p}><path d="M9 8 4.5 12 9 16M15 8l4.5 4-4.5 4M13.5 6.5l-3 11" /></svg>);
const IconLock = (p) => (<svg {...iconProps} {...p}><rect x="5.5" y="10.5" width="13" height="9" rx="1.2" /><path d="M8 10.5V7.8A4 4 0 0 1 16 7.8v2.7" /><circle cx="12" cy="15" r="1.2" /></svg>);
const IconSearch = (p) => (<svg {...iconProps} {...p}><circle cx="10.5" cy="10.5" r="6" /><path d="M15.2 15.2 20 20" /></svg>);
const IconDoc = (p) => (<svg {...iconProps} {...p}><path d="M7 3.5h7l4 4V20a.6.6 0 0 1-.6.6H7A.6.6 0 0 1 6.4 20V4.1A.6.6 0 0 1 7 3.5Z" /><path d="M14 3.5V8h4M9 12.5h6M9 15.8h6M9 9.2h2.5" /></svg>);
const IconRadar = (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.4" /><path d="M12 12 18.2 7" /></svg>);
const IconMask = (p) => (<svg {...iconProps} {...p}><path d="M4.5 12c1.6-4.2 4.7-6.3 7.5-6.3s5.9 2.1 7.5 6.3c-1.6 4.2-4.7 6.3-7.5 6.3S6.1 16.2 4.5 12Z" /><circle cx="12" cy="12" r="2" /><path d="M4 5 20 19" opacity="0" /></svg>);
const IconArrow = (p) => (<svg {...iconProps} {...p}><path d="M5 12h13M13 6l6 6-6 6" /></svg>);
const IconFeedback = (p) => (<svg {...iconProps} {...p}><path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5.5 20.5V16.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" /><path d="M8 9.5h8M8 12.5h5" /></svg>);
const IconClose = (p) => (<svg {...iconProps} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);

/* ------------------------------------------------------------------ */
/*  Wordmark — shield-and-radar mark drawn in the same linework as the  */
/*  rest of the schematic, so the brand reads as part of the drawing    */
/* ------------------------------------------------------------------ */
function Logo({ size = 30, showWord = true, wordSize = 'md' }) {
  return (
    <div className="ss-logo">
      <svg viewBox="0 0 48 48" width={size} height={size} className="logo-mark" aria-hidden="true"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4 L40 10.5 V22.5 C40 32.5 33 39.5 24 43 C15 39.5 8 32.5 8 22.5 V10.5 Z" />
        <circle cx="24" cy="23" r="8" strokeDasharray="2 3" opacity="0.7" />
        <circle cx="24" cy="23" r="2.4" fill="currentColor" stroke="none" />
        <path d="M24 15v-3M24 34v-3M12 23H9M39 23h-3" strokeWidth="1.2" />
      </svg>
      {showWord && (
        <span className={`logo-word display ${wordSize}`}>
          SENTINEL<span className="accent">SCAN</span>
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable "drawing sheet" panel with corner registration marks       */
/* ------------------------------------------------------------------ */
function BpPanel({ children, label, className = '' }) {
  return (
    <div className={`bp-panel ${className}`}>
      {label && <span className="bp-panel-label">{label}</span>}
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live scan log — cycles synthetic findings in the hero terminal     */
/* ------------------------------------------------------------------ */
const LOG_POOL = [
  { t: 'TCP', s: 'ok', m: '203.0.113.42:443 OPEN — TLS 1.3' },
  { t: 'TCP', s: 'ok', m: '203.0.113.42:22 OPEN — OpenSSH 9.6' },
  { t: 'HTTP', s: 'warn', m: 'Missing header — Content-Security-Policy' },
  { t: 'HTTP', s: 'warn', m: 'Missing header — Strict-Transport-Security' },
  { t: 'ENUM', s: 'ok', m: '/.env → 404 NOT FOUND' },
  { t: 'ENUM', s: 'warn', m: '/.git/config → 200 EXPOSED' },
  { t: 'CORS', s: 'warn', m: 'Wildcard origin on /api/v1/users' },
  { t: 'TCP', s: 'ok', m: '203.0.113.42:8080 CLOSED' },
  { t: 'REPORT', s: 'info', m: 'Compiling mitigation plan…' },
];

function useScanLog(limit = 6) {
  const [lines, setLines] = useState(() => LOG_POOL.slice(0, 3).map((l, i) => ({ ...l, id: i })));
  const idx = useRef(3);
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const iv = setInterval(() => {
      setLines((prev) => {
        const next = LOG_POOL[idx.current % LOG_POOL.length];
        idx.current += 1;
        const line = { ...next, id: idx.current };
        return [...prev, line].slice(-limit);
      });
    }, 1700);
    return () => clearInterval(iv);
  }, [limit]);
  return lines;
}

/* ------------------------------------------------------------------ */
/*  Hero schematic — target host + five probed ports, radar sweep      */
/* ------------------------------------------------------------------ */
const NODES = [
  { x: 220, y: 40, port: 443, flag: false },
  { x: 334.1, y: 122.9, port: 22, flag: false },
  { x: 290.5, y: 257.1, port: 8080, flag: true },
  { x: 149.5, y: 257.1, port: 3306, flag: false },
  { x: 105.9, y: 122.9, port: 80, flag: true },
];

function ScanSchematic() {
  return (
    <div className="bp-schematic">
      <div className="sweep" aria-hidden="true" />
      <svg viewBox="0 0 440 320" className="schematic-svg" role="img" aria-label="Network scan diagram of a target host and its open ports">
        {NODES.map((n, i) => (
          <line key={i} x1="220" y1="160" x2={n.x} y2={n.y} className="link" />
        ))}
        <circle cx="220" cy="160" r="26" className="node-target" />
        <text x="220" y="165" textAnchor="middle" className="node-target-label">HOST</text>
        {NODES.map((n, i) => (
          <g key={i} style={{ animationDelay: `${i * 0.35}s` }} className="node-group">
            <circle cx={n.x} cy={n.y} r="14" className={`node ${n.flag ? 'node-flag' : 'node-ok'}`} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" className="node-label">{n.port}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feedback modal — posts straight to Web3Forms, no backend needed    */
/* ------------------------------------------------------------------ */
const WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';

function FeedbackModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. UPDATED: We only require the message now. Name and Email can be blank!
    if (!form.message) return; 
    
    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'New Feedback — SentinelScan',
          
          // 2. UPDATED: Add fallbacks if the user chooses to remain anonymous
          from_name: form.name || 'Anonymous User',
          name: form.name || 'Anonymous User',
          email: form.email || 'anonymous@sentinelscan.local', 
          message: form.message,
        }),
      });
      const data = await res.json();
      setStatus(data.success ? 'success' : 'error');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose} aria-label="Close feedback form"><IconClose /></button>
        <span className="bp-panel-label">Feedback</span>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />

        {status === 'success' ? (
          <div className="feedback-success">
            <IconFeedback />
            <h3>Thanks for the feedback!</h3>
            <p>Your message has been sent — we read every one.</p>
            <button className="cta" type="button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="feedback-title display">Share your feedback</h3>
            <p className="feedback-sub">Found a bug, or have an idea? Let us know — it goes straight to the team.</p>
            
            {/* 3. UPDATED: Removed 'required' and added '(Optional)' to the labels */}
            <label className="feedback-field">
              <span>Name (Optional)</span>
              <input className="bp-input mono" type="text" value={form.name} onChange={update('name')} disabled={status === 'sending'} />
            </label>
            <label className="feedback-field">
              <span>Email (Optional)</span>
              <input className="bp-input mono" type="email" value={form.email} onChange={update('email')} disabled={status === 'sending'} />
            </label>
            
            {/* Message is the only required field left */}
            <label className="feedback-field">
              <span>Message</span>
              <textarea className="bp-input mono feedback-textarea" rows={4} value={form.message} onChange={update('message')} required disabled={status === 'sending'} />
            </label>
            
            {status === 'error' && <p className="feedback-error">Something went wrong — please try again in a moment.</p>}
            <button className="cta" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */
function Landing() {
  const navigate = useNavigate();
  const log = useScanLog();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const details = [
    { key: 'A', icon: IconSearch, title: 'Target Input', body: 'Enter a hostname or IP. No install, no agent — the console runs entirely in your browser.' },
    { key: 'B', icon: IconHub, title: 'Concurrent Scan', body: 'The async engine walks ports and web headers in parallel, capped at 100 workers so the target is never flooded.' },
    { key: 'C', icon: IconDoc, title: 'Report Generation', body: 'Findings compile into a color-coded mitigation report — ready to hand to engineering or leadership.' },
  ];

  const legend = [
    { icon: IconHub, title: 'Deep Network Mapping', body: 'Maps exposed standard and non-standard ports across the external perimeter in milliseconds.' },
    { icon: IconCode, title: 'DAST Vulnerability Analysis', body: 'Probes live application layers for missing CSP/HSTS headers and risky CORS configuration.' },
    { icon: IconMask, title: 'WAF-Resilient Probing', body: 'User-agent rotation and raw TCP fallbacks keep scans working behind strict WAFs and TLS handshakes.' },
    { icon: IconDoc, title: 'Executive Threat Reporting', body: 'One click renders the live console into a client-ready, color-coded PDF mitigation plan.' },
    { icon: IconLock, title: 'Zero-Telemetry Guarantee', body: 'Findings live in RAM only for the duration of the scan — nothing is logged, stored, or retained.' },
  ];

  return (
    <div className="ss-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500&display=swap');

        :root {
          --bp-bg: #0c2338;
          --bp-bg-2: #091a2a;
          --bp-panel: #0e2a42;
          --bp-line: rgba(148, 205, 226, 0.16);
          --bp-line-strong: rgba(148, 205, 226, 0.34);
          --bp-cyan: #5eead4;
          --bp-blue: #38bdf8;
          --bp-amber: #fbbf24;
          --bp-text: #e7f1f7;
          --bp-dim: #7f9db3;
        }
        * { box-sizing: border-box; }
        html, body { max-width: 100%; overflow-x: hidden; }
        .ss-root {
          background: var(--bp-bg);
          background-image:
            linear-gradient(var(--bp-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--bp-line) 1px, transparent 1px);
          background-size: 32px 32px;
          color: var(--bp-text);
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          width: 100%;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Space Grotesk', sans-serif; }

        img, svg { max-width: 100%; }

        .ss-sheet { max-width: 1180px; margin: 0 auto; width: 100%; padding: 0 clamp(16px, 4.5vw, 28px); }
        .sheet-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 0 14px; border-bottom: 1px solid var(--bp-line-strong);
          font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.08em;
          color: var(--bp-dim); text-transform: uppercase;
          flex-wrap: wrap; row-gap: 8px; column-gap: 16px;
        }
        .sheet-head strong { color: var(--bp-cyan); }
        .sheet-head-brand { display: flex; align-items: center; gap: 8px; }
        .sheet-head-brand .divider { color: var(--bp-line-strong); margin: 0 1px; }

        .ss-logo { display: flex; align-items: center; gap: 9px; }
        .logo-mark { color: var(--bp-cyan); flex-shrink: 0; }
        .logo-word { font-weight: 800; letter-spacing: 0.01em; color: var(--bp-text); font-size: 17px; white-space: nowrap; }
        .logo-word.sm { font-size: 12px; letter-spacing: 0.1em; }
        .logo-word.lg { font-size: 22px; }
        .logo-word .accent { color: var(--bp-cyan); }

        /* ---------- Panels with corner registration marks ---------- */
        .bp-panel { position: relative; border: 1px solid var(--bp-line-strong); background: rgba(9, 26, 42, 0.55); border-radius: 2px; padding: 26px; }
        .bp-panel-label {
          position: absolute; top: -11px; left: 18px; background: var(--bp-bg);
          padding: 0 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px;
          letter-spacing: 0.12em; color: var(--bp-cyan); text-transform: uppercase;
        }
        .corner { position: absolute; width: 14px; height: 14px; pointer-events: none; }
        .corner::before, .corner::after { content: ''; position: absolute; background: var(--bp-blue); }
        .corner.tl { top: -1px; left: -1px; } .corner.tl::before { width: 14px; height: 1.5px; top: 0; left: 0; } .corner.tl::after { width: 1.5px; height: 14px; top: 0; left: 0; }
        .corner.tr { top: -1px; right: -1px; } .corner.tr::before { width: 14px; height: 1.5px; top: 0; right: 0; } .corner.tr::after { width: 1.5px; height: 14px; top: 0; right: 0; }
        .corner.bl { bottom: -1px; left: -1px; } .corner.bl::before { width: 14px; height: 1.5px; bottom: 0; left: 0; } .corner.bl::after { width: 1.5px; height: 14px; bottom: 0; left: 0; }
        .corner.br { bottom: -1px; right: -1px; } .corner.br::before { width: 14px; height: 1.5px; bottom: 0; right: 0; } .corner.br::after { width: 1.5px; height: 14px; bottom: 0; right: 0; }

        /* ---------------------- Hero ---------------------- */
        .hero { padding: clamp(28px, 6vw, 44px) 0 clamp(40px, 8vw, 70px); }
        .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: clamp(24px, 5vw, 40px); align-items: center; margin-top: 34px; }
        .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: var(--bp-cyan); text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
        .eyebrow::before { content: ''; width: 22px; height: 1px; background: var(--bp-cyan); display: inline-block; }
        .hero-title { font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: clamp(2.6rem, 5vw, 4rem); line-height: 1.02; letter-spacing: -0.02em; margin: 18px 0 20px; }
        .hero-title .accent { color: var(--bp-cyan); }
        .hero-sub { color: var(--bp-dim); font-size: 1.05rem; line-height: 1.65; max-width: 480px; margin-bottom: 26px; }
        .tag-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px; }
        .tag { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 0.06em; padding: 6px 10px; border: 1px solid var(--bp-line-strong); border-radius: 2px; color: var(--bp-blue); }
        .tag.amber { color: var(--bp-amber); }

        .cta {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 14px; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--bp-bg); background: var(--bp-cyan);
          border: 1px solid var(--bp-cyan); padding: 14px 22px; border-radius: 2px; cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
        }
        .cta:hover { background: transparent; color: var(--bp-cyan); transform: translateY(-1px); }
        .cta:focus-visible { outline: 2px solid var(--bp-amber); outline-offset: 3px; }
        .cta svg { width: 16px; height: 16px; }

        /* --------------- Hero schematic diagram --------------- */
        .bp-schematic { position: relative; aspect-ratio: 440 / 320; }
        .schematic-svg { width: 100%; height: 100%; overflow: visible; }
        .link { stroke: var(--bp-line-strong); stroke-width: 1; stroke-dasharray: 3 4; }
        .node-target { fill: rgba(94,234,212,0.08); stroke: var(--bp-cyan); stroke-width: 1.5; }
        .node-target-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: var(--bp-cyan); letter-spacing: 0.05em; }
        .node { fill: var(--bp-bg-2); stroke-width: 1.5; }
        .node-ok { stroke: var(--bp-blue); }
        .node-flag { stroke: var(--bp-amber); }
        .node-label { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; fill: var(--bp-text); }
        .node-group { animation: ping 3.6s ease-in-out infinite; transform-origin: center; }
        .sweep {
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(from 0deg, rgba(94,234,212,0.28), transparent 32%, transparent 100%);
          animation: spin 4.2s linear infinite; mix-blend-mode: screen;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }

        /* --------------- Terminal / live log --------------- */
        .terminal { background: var(--bp-bg-2); border: 1px solid var(--bp-line-strong); border-radius: 2px; }
        .terminal-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--bp-line); }
        .terminal-head span:first-child { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.1em; color: var(--bp-dim); text-transform: uppercase; }
        .pill { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; color: var(--bp-amber); border: 1px solid rgba(251,191,36,0.4); padding: 2px 8px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; }
        .pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--bp-amber); animation: ping 1.4s ease-in-out infinite; }
        .terminal-body { padding: 14px 16px 16px; min-height: 168px; display: flex; flex-direction: column; gap: 7px; }
        .log-line { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; display: flex; gap: 9px; animation: fadeUp 0.4s ease; }
        .log-line .lt { color: var(--bp-dim); width: 52px; flex-shrink: 0; }
        .log-line.ok .lt, .log-line.info .lt { color: var(--bp-blue); }
        .log-line.warn .lt { color: var(--bp-amber); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        /* ---------------------- How it works ---------------------- */
        .section { padding: 60px 0; border-top: 1px solid var(--bp-line-strong); }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 40px; flex-wrap: wrap; gap: 10px; }
        .section-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.7rem; letter-spacing: -0.01em; }
        .section-note { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--bp-dim); letter-spacing: 0.06em; }

        .detail-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; position: relative; }
        .detail-row::before {
          content: ''; position: absolute; top: 44px; left: 8%; right: 8%; height: 1px;
          background-image: linear-gradient(90deg, var(--bp-line-strong) 0 6px, transparent 6px 12px);
          background-size: 12px 1px; z-index: 0;
        }
        .detail-cell { position: relative; z-index: 1; padding: 0 22px; text-align: left; }
        .detail-mark { width: 44px; height: 44px; border: 1px solid var(--bp-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 600; color: var(--bp-blue); background: var(--bp-bg); margin-bottom: 18px; }
        .detail-cell svg { width: 22px; height: 22px; color: var(--bp-cyan); margin-bottom: 12px; }
        .detail-cell h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; margin: 0 0 8px; }
        .detail-cell p { color: var(--bp-dim); font-size: 0.92rem; line-height: 1.6; margin: 0; }

        /* ---------------------- Feature legend ---------------------- */
        .legend { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .legend-row { display: flex; gap: 16px; align-items: flex-start; border: 1px solid var(--bp-line); border-radius: 2px; padding: 18px; background: rgba(9,26,42,0.4); }
        .legend-sym { width: 40px; height: 40px; flex-shrink: 0; border: 1px solid var(--bp-line-strong); border-radius: 2px; display: flex; align-items: center; justify-content: center; }
        .legend-sym svg { width: 20px; height: 20px; color: var(--bp-cyan); }
        .legend-row h4 { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; margin: 2px 0 6px; }
        .legend-row p { color: var(--bp-dim); font-size: 0.88rem; line-height: 1.55; margin: 0; }
        .legend-row.wide { grid-column: 1 / -1; }

        /* ---------------------- Title block footer ---------------------- */
        .titleblock { border-top: 1px solid var(--bp-line-strong); background: var(--bp-bg-2); margin-top: auto; }
        .tb-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding: 34px 0 26px; flex-wrap: wrap; }
        .tb-tagline { color: var(--bp-dim); font-size: 0.92rem; max-width: 380px; margin-top: 10px; line-height: 1.6; }

        .stamp {
          width: 96px; height: 96px; border-radius: 50%; border: 1.5px dashed rgba(251,191,36,0.55);
          display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px;
          transform: rotate(-9deg); color: var(--bp-amber); font-family: 'JetBrains Mono', monospace;
          text-align: center; flex-shrink: 0; opacity: 0.85;
        }
        .stamp span:first-child { font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; }
        .stamp span:last-child { font-size: 8.5px; letter-spacing: 0.06em; color: rgba(251,191,36,0.75); }

        .scalebar { display: flex; align-items: center; gap: 12px; padding: 4px 0 26px; color: var(--bp-dim); }
        .scalebar svg { flex-shrink: 0; }
        .scalebar span { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }

        .tb-mid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 40px; padding: 26px 0; border-top: 1px solid var(--bp-line); }
        .notes-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--bp-cyan); text-transform: uppercase; margin-bottom: 12px; }
        .notes-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; counter-reset: note; }
        .notes-list li { counter-increment: note; font-size: 0.87rem; color: var(--bp-dim); line-height: 1.55; padding-left: 22px; position: relative; }
        .notes-list li::before { content: counter(note) '.'; position: absolute; left: 0; color: var(--bp-blue); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }

        .status-list { display: flex; flex-direction: column; gap: 11px; }
        .status-row { display: flex; align-items: center; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 12px; border-bottom: 1px solid var(--bp-line); padding-bottom: 9px; }
        .status-row:last-child { border-bottom: none; }
        .status-row .label { color: var(--bp-dim); letter-spacing: 0.06em; text-transform: uppercase; }
        .status-row .val { display: flex; align-items: center; gap: 7px; color: var(--bp-text); }
        .dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
        .dot.on { background: var(--bp-cyan); }
        .dot.ready { background: var(--bp-blue); }
        .dot.off { background: var(--bp-dim); }

        .tb-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--bp-line-strong); }
        .tb-cell { border-right: 1px solid var(--bp-line); border-top: 1px solid var(--bp-line); padding: 14px 20px; font-family: 'JetBrains Mono', monospace; }
        .tb-cell:nth-child(3n) { border-right: none; }
        .tb-cell:nth-child(-n+3) { border-top: none; }
        .tb-cell .k { display: block; font-size: 10px; letter-spacing: 0.1em; color: var(--bp-dim); text-transform: uppercase; margin-bottom: 4px; }
        .tb-cell .v { font-size: 13px; color: var(--bp-text); }
        .tb-cell .v.ok { color: var(--bp-cyan); }

        .tb-bottom { text-align: center; padding: 16px 0 26px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.05em; color: var(--bp-dim); }

        @media (max-width: 860px) {
          .tb-mid { grid-template-columns: 1fr; gap: 24px; }
          .hero-grid { grid-template-columns: 1fr; }
          .detail-row { grid-template-columns: 1fr; gap: 34px; }
          .detail-row::before { display: none; }
          .legend { grid-template-columns: 1fr; }
          .tb-grid { grid-template-columns: 1fr; }
          .tb-cell { border-right: none; }
          .bp-panel { padding: 20px; }
          .section { padding: 48px 0; }
        }

        /* ---------------------- Tablet / large phone ---------------------- */
        @media (max-width: 640px) {
          .sheet-head { font-size: 10.5px; }
          .sheet-head .logo-word.sm { font-size: 10.5px; }
          .eyebrow { font-size: 10.5px; }
          .hero-sub { max-width: 100%; font-size: 1rem; }
          .tag-row { margin-bottom: 24px; }
          .cta { width: 100%; justify-content: center; }
          .terminal-body { min-height: 140px; }
          .section-head { margin-bottom: 28px; }
          .section-title { font-size: 1.4rem; }
          .detail-cell { padding: 0; }
          .legend-row { padding: 16px; }
          .tb-top { gap: 20px; }
          .tb-tagline { max-width: 100%; }
          .stamp { width: 76px; height: 76px; }
          .stamp span:first-child { font-size: 9px; }
          .stamp span:last-child { font-size: 7.5px; }
        }

        /* ---------------------- Small phone ---------------------- */
        @media (max-width: 420px) {
          .ss-sheet { padding: 0 14px; }
          .sheet-head { padding: 14px 0 10px; gap: 6px 10px; }
          .logo-word { font-size: 15px; }
          .logo-word.lg { font-size: 19px; }
          .hero-title { font-size: clamp(1.9rem, 9vw, 2.4rem); margin: 14px 0 16px; }
          .tag { font-size: 10px; padding: 5px 8px; }
          .cta { padding: 13px 18px; font-size: 12.5px; }
          .bp-schematic { max-width: 320px; margin: 0 auto; }
          .terminal-head span:first-child { font-size: 10px; }
          .detail-mark { width: 38px; height: 38px; }
          .detail-cell h3 { font-size: 1rem; }
          .legend-row { flex-direction: column; gap: 10px; padding: 14px; }
          .legend-sym { width: 34px; height: 34px; }
          .tb-grid .tb-cell { padding: 12px 14px; }
          .tb-cell .v { font-size: 12px; }
          .scalebar { flex-wrap: wrap; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sweep, .node-group, .pill::before { animation: none; }
        }

        /* ---------------------- Feedback ---------------------- */
        .feedback-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--bp-cyan); background: transparent;
          border: 1px solid var(--bp-line-strong); border-radius: 2px; padding: 6px 10px;
          cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease;
        }
        .feedback-btn svg { width: 14px; height: 14px; }
        .feedback-btn:hover { border-color: var(--bp-cyan); background: rgba(94,234,212,0.08); }
        .feedback-btn:focus-visible { outline: 2px solid var(--bp-amber); outline-offset: 2px; }

        .feedback-overlay {
          position: fixed; inset: 0; background: rgba(4,12,20,0.72); backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
        }
        .feedback-modal {
          position: relative; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto;
          background: var(--bp-bg); border: 1px solid var(--bp-line-strong); border-radius: 2px;
          padding: 30px 26px 26px;
        }
        .feedback-close {
          position: absolute; top: 12px; right: 12px; background: transparent; border: none;
          color: var(--bp-dim); cursor: pointer; padding: 6px; line-height: 0;
        }
        .feedback-close svg { width: 18px; height: 18px; }
        .feedback-close:hover { color: var(--bp-text); }
        .feedback-title { font-size: 1.3rem; font-weight: 700; margin: 4px 0 8px; }
        .feedback-sub { color: var(--bp-dim); font-size: 0.88rem; line-height: 1.55; margin: 0 0 20px; }
        .feedback-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; font-size: 12px; }
        .feedback-field span { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; color: var(--bp-dim); font-size: 11px; }
        .feedback-field .bp-input { width: 100%; background: var(--bp-bg-2); border: 1px solid var(--bp-line-strong); color: var(--bp-text); font-size: 13.5px; padding: 11px 13px; border-radius: 2px; outline: none; }
        .feedback-field .bp-input:focus-visible { border-color: var(--bp-cyan); }
        .feedback-textarea { resize: vertical; min-height: 90px; font-family: 'Inter', system-ui, sans-serif; }
        .feedback-error { color: var(--bp-amber); font-size: 0.85rem; margin: 0 0 14px; }
        .feedback-modal .cta { width: 100%; justify-content: center; margin-top: 4px; }
        .feedback-success { text-align: center; padding: 10px 0 4px; }
        .feedback-success svg { width: 34px; height: 34px; color: var(--bp-cyan); margin-bottom: 10px; }
        .feedback-success h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.15rem; margin: 0 0 8px; }
        .feedback-success p { color: var(--bp-dim); font-size: 0.9rem; margin: 0 0 20px; }

        @media (max-width: 420px) {
          .feedback-btn { font-size: 10.5px; }
          .feedback-modal { padding: 24px 18px 20px; }
        }
      `}</style>

      {/* SHEET 01 — HERO */}
      <div className="ss-sheet">
        <div className="sheet-head">
          <span className="sheet-head-brand">
            <Logo size={19} wordSize="sm" />
            <span className="divider">/</span> INFRASTRUCTURE AUDIT SYSTEM
          </span>
          <button className="feedback-btn" onClick={() => setFeedbackOpen(true)}>
            <IconFeedback /> Feedback
          </button>
          <span>SHEET 01 OF 04</span>
        </div>

        <div className="hero">
          <div className="eyebrow">Zero-Telemetry · Async Engine</div>
          <div className="hero-grid">
            <div>
              <h1 className="hero-title display">
                Map the attack<br />surface <span className="accent">before</span><br />someone else does.
              </h1>
              <p className="hero-sub">
                SentinelScan audits network infrastructure and live web applications side by side —
                open ports, missing headers, exposed paths — and lays every finding out like a set of
                engineering drawings: precise, annotated, easy to hand off.
              </p>
              <div className="tag-row">
                <span className="tag">[ ZERO-TELEMETRY ]</span>
                <span className="tag amber">[ ASYNC ENGINE · 100 WORKERS ]</span>
              </div>
              <button className="cta" onClick={() => navigate('/app')}>
                Launch Security Console <IconArrow />
              </button>
            </div>

            <div>
              <ScanSchematic />
              <div className="terminal">
                <div className="terminal-head">
                  <span>Live Scan Output</span>
                  <span className="pill">Running</span>
                </div>
                <div className="terminal-body">
                  {log.map((l) => (
                    <div key={l.id} className={`log-line ${l.s}`}>
                      <span className="lt">[{l.t}]</span><span>{l.m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHEET 02 — HOW IT WORKS */}
      <div className="ss-sheet section">
        <div className="section-head">
          <h2 className="section-title display">Automated Threat Intelligence — Process</h2>
          <span className="section-note">SHEET 02 OF 04 · DETAIL A–C</span>
        </div>
        <div className="detail-row">
          {details.map((d) => (
            <div className="detail-cell" key={d.key}>
              <div className="detail-mark">{d.key}</div>
              <d.icon />
              <h3>{d.title}</h3>
              <p>{d.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SHEET 03 — FEATURE LEGEND */}
      <div className="ss-sheet section">
        <div className="section-head">
          <h2 className="section-title display">Capability Legend</h2>
          <span className="section-note">SHEET 03 OF 04</span>
        </div>
        <div className="legend">
          {legend.map((f, i) => (
            <div className={`legend-row ${i === legend.length - 1 ? 'wide' : ''}`} key={f.title}>
              <div className="legend-sym"><f.icon /></div>
              <div>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SHEET 04 — TITLE BLOCK FOOTER */}
      <div className="titleblock">
        <div className="ss-sheet">
          <div className="section-note" style={{ marginTop: 22 }}>SHEET 04 OF 04</div>

          <div className="tb-top">
            <div>
              <Logo size={32} wordSize="lg" />
              <p className="tb-tagline">
                Infrastructure auditing and DAST, run entirely client-side. No agents to install,
                no findings retained after the report is generated.
              </p>
            </div>
            <div className="stamp">
              <span>VERIFIED</span>
              <span>ZERO-TELEMETRY</span>
            </div>
          </div>

          <div className="scalebar" aria-hidden="true">
            <svg width="180" height="12" viewBox="0 0 180 12">
              <line x1="0" y1="6" x2="180" y2="6" stroke="currentColor" strokeWidth="1" />
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={i} x1={i * 18} y1={i % 2 === 0 ? 2 : 4} x2={i * 18} y2={10} stroke="currentColor" strokeWidth="1" />
              ))}
            </svg>
            <span>Scale 1:1 — every finding shown is a real check, not a mock-up</span>
          </div>

          <div className="tb-mid">
            <div>
              <div className="notes-title">General Notes</div>
              <ul className="notes-list">
                <li>Scans run through an asynchronous engine capped at 100 concurrent workers, so the target is probed quickly without being flooded.</li>
                <li>Every report renders client-side from the live console — nothing is queued or stored server-side.</li>
                <li>User-agent rotation and raw TCP fallbacks keep results accurate behind WAFs and strict TLS configurations.</li>
              </ul>
            </div>
            <div>
              <div className="notes-title">System Status</div>
              <div className="status-list">
                <div className="status-row"><span className="label">Scan Engine</span><span className="val"><span className="dot on" />Online</span></div>
                <div className="status-row"><span className="label">Console</span><span className="val"><span className="dot ready" />Ready</span></div>
                <div className="status-row"><span className="label">Telemetry</span><span className="val"><span className="dot off" />Disabled by design</span></div>
              </div>
            </div>
          </div>

          <div className="tb-grid">
            <div className="tb-cell"><span className="k">Project</span><span className="v ok">SentinelScan Core</span></div>
            <div className="tb-cell"><span className="k">Dwg No.</span><span className="v">SS-2.0-LANDING</span></div>
            <div className="tb-cell"><span className="k">Scale</span><span className="v">NOT TO SCALE</span></div>
            <div className="tb-cell"><span className="k">Drawn By</span><span className="v">Async Engine</span></div>
            <div className="tb-cell"><span className="k">Checked By</span><span className="v">DAST Module</span></div>
            <div className="tb-cell"><span className="k">Approved</span><span className="v ok">Zero-Telemetry Policy</span></div>
            <div className="tb-cell"><span className="k">Revision</span><span className="v">Rev. 02</span></div>
            <div className="tb-cell"><span className="k">Status</span><span className="v ok">Operational</span></div>
            <div className="tb-cell"><span className="k">Sheet</span><span className="v">04 of 04</span></div>
          </div>

          <div className="tb-bottom">
            © 2026 SENTINELSCAN CORE — DRAWING FOR REFERENCE ONLY, NOT FOR CONSTRUCTION.
          </div>
        </div>
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}

export default Landing;