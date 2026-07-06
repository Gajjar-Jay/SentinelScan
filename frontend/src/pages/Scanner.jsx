import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

/* ------------------------------------------------------------------ */
/* Inline schematic icons */
/* ------------------------------------------------------------------ */
const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconArrow = (p) => (<svg {...iconProps} {...p}><path d="M5 12h13M13 6l6 6-6 6" /></svg>);
const IconTerminal = (p) => (<svg {...iconProps} {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="1.4" /><path d="M7 9.5 10.5 12 7 14.5M12 14.5h5" /></svg>);
const IconDownload = (p) => (<svg {...iconProps} {...p}><path d="M12 4v11M8 11.5 12 15.5 16 11.5" /><path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5" /></svg>);
const IconServer = (p) => (<svg {...iconProps} {...p}><rect x="4" y="4.5" width="16" height="6" rx="1.2" /><rect x="4" y="13.5" width="16" height="6" rx="1.2" /><circle cx="7.3" cy="7.5" r="0.9" fill="currentColor" stroke="none" /><circle cx="7.3" cy="16.5" r="0.9" fill="currentColor" stroke="none" /></svg>);
const IconGlobe = (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.4 2.3 3.6 5 3.6 8s-1.2 5.7-3.6 8c-2.4-2.3-3.6-5-3.6-8s1.2-5.7 3.6-8Z" /></svg>);
const IconCheck = (p) => (<svg {...iconProps} {...p}><circle cx="12" cy="12" r="8" /><path d="m8.5 12.3 2.4 2.4 4.6-5.4" /></svg>);
const IconAlert = (p) => (<svg {...iconProps} {...p}><path d="M12 4 21 19.5H3Z" /><path d="M12 10v4" /><circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" /></svg>);
const IconFeedback = (p) => (<svg {...iconProps} {...p}><path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5.5 20.5V16.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" /><path d="M8 9.5h8M8 12.5h5" /></svg>);
const IconClose = (p) => (<svg {...iconProps} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>);

function Logo({ size = 28, wordSize = 'md' }) {
  return (
    <div className="ss-logo">
      <svg viewBox="0 0 48 48" width={size} height={size} className="logo-mark" aria-hidden="true"
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4 L40 10.5 V22.5 C40 32.5 33 39.5 24 43 C15 39.5 8 32.5 8 22.5 V10.5 Z" />
        <circle cx="24" cy="23" r="8" strokeDasharray="2 3" opacity="0.7" />
        <circle cx="24" cy="23" r="2.4" fill="currentColor" stroke="none" />
        <path d="M24 15v-3M24 34v-3M12 23H9M39 23h-3" strokeWidth="1.2" />
      </svg>
      <span className={`logo-word display ${wordSize}`}>SENTINEL<span className="accent">SCAN</span></span>
    </div>
  );
}

function BpPanel({ children, label, className = '', style }) {
  return (
    <div className={`bp-panel ${className}`} style={style}>
      {label && <span className="bp-panel-label">{label}</span>}
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      {children}
    </div>
  );
}

const logTone = (line) => {
  if (line.includes('[!]')) return 'warn';
  if (line.includes('[\u2714]') || line.includes('[-]')) return 'ok';
  return 'info';
};

// UPDATED: Added handlers for Warning and Notice
const sevClass = (sev) => {
  if (sev === 'Critical' || sev === 'High') return 'sev-critical';
  if (sev === 'Medium' || sev === 'Warning') return 'sev-medium'; 
  if (sev === 'Secure') return 'sev-secure';
  return 'sev-info'; // Covers Notice and Info
};

const WEB3FORMS_ACCESS_KEY = 'ad2cb2fd-071f-4b86-8438-0f38c26194b9';

function FeedbackModal({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); 

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message) return;
    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'New Feedback — SentinelScan',
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
            <label className="feedback-field">
              <span>Name (Optional)</span>
              <input className="bp-input mono" type="text" value={form.name} onChange={update('name')} disabled={status === 'sending'} />
            </label>
            <label className="feedback-field">
              <span>Email (Optional)</span>
              <input className="bp-input mono" type="email" value={form.email} onChange={update('email')} disabled={status === 'sending'} />
            </label>
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

function Scanner() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  // NEW: State to manage the active tab/step
  const [activeTab, setActiveTab] = useState('infrastructure');

  const handleAudit = async () => {
    if (!target) return;
    setLoading(true);
    setReportData(null);
    setActiveTab('infrastructure'); // Reset tab on new scan
    setLogs([
      `[*] Initializing dual-layer matrix audit for: ${target}`,
      `[*] Deploying concurrent network and DAST swarms...`
    ]);

    try {
      const response = await fetch('https://sentinelscan-8kn9.onrender.com/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setReportData({ network: data.scan_data, web: data.web_data });
        setLogs(prev => [
          ...prev,
          `[-] Diagnostics completed cleanly.`,
          `[\u2714] Dual-Layer Data acquired. Transferring to Executive Dashboard...`
        ]);
      } else {
        setLogs(prev => [...prev, `[!] FATAL ERROR: ${data.error}`]);
      }
    } catch (error) {
      setLogs(prev => [...prev, `[!] CONNECTION FAILED: Unable to reach SentinelScan API.`]);
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;
    const currentTime = new Date().toLocaleString();

    let networkHTML = reportData.network.length === 0
      ? `<p style="color: #64748b;">No exposed standard ports detected.</p>`
      : reportData.network.map(port => `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${port.severity === 'Secure' || port.severity === 'Info' ? '#94a3b8' : '#ef4444'}; border-radius: 6px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              <strong style="font-size: 16px; color: #0f172a;">PORT ${port.port}</strong>
              <span style="font-size: 11px; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; background: ${port.severity === 'Secure' ? '#f0fdf4' : '#f8fafc'}; color: ${port.severity === 'Secure' ? '#166534' : '#475569'}; font-weight: bold;">
                ${port.severity}
              </span>
            </div>
            <p style="margin: 0 0 8px 0; color: #334155; font-size: 13px;"><strong>Service:</strong> ${port.banner}</p>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #475569; line-height: 1.5;"><strong>Impact:</strong> ${port.description}</p>
            <div style="background: #f8fafc; padding: 10px; border-radius: 4px; font-size: 12px; color: #475569; font-weight: 500;">
              <strong>Action Required:</strong> ${port.remediation}
            </div>
          </div>
        `).join('');

    let webHTML = reportData.web.map(finding => {
      let color = "#475569"; let bg = "#f8fafc"; let border = "#e2e8f0";
      // UPDATED: Handle Warning and Notice colors
      if (finding.severity === 'Critical' || finding.severity === 'High') { color = "#991b1b"; bg = "#fef2f2"; border = "#fca5a5"; }
      else if (finding.severity === 'Medium' || finding.severity === 'Warning') { color = "#c2410c"; bg = "#fff7ed"; border = "#fdba74"; }
      else if (finding.severity === 'Secure') { color = "#166534"; bg = "#f0fdf4"; border = "#86efac"; }
      else { color = "#854d0e"; bg = "#fefce8"; border = "#fde047"; }

      return `
        <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid ${border}; padding-bottom: 8px;">
            <strong style="font-size: 16px; color: ${color};">${finding.title}</strong>
            <span style="font-size: 11px; font-weight: bold; background: white; padding: 3px 8px; border-radius: 4px; color: ${color}; border: 1px solid ${border};">Severity: ${finding.severity}</span>
          </div>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: ${color}; line-height: 1.5;"><strong>Context:</strong><br/>${finding.description}</p>
          <div style="background: rgba(255,255,255,0.6); padding: 10px; border-radius: 4px; font-size: 13px; color: ${color}; font-weight: 500;">
            <strong>Recommendation:</strong><br/>${finding.remediation}
          </div>
        </div>
      `;
    }).join('');

    const fullHTML = `
        <div style="padding: 30px; font-family: 'Inter', Helvetica, Arial, sans-serif; background: white; color: #0f172a; width: 100%; box-sizing: border-box;">
            <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 30px; margin-bottom: 40px;">
                <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 900; color: #0f172a;">Executive Security Audit</h1>
                <h2 style="margin: 0; font-size: 18px; color: #2563eb; font-weight: 600;">Confidential Threat Intelligence Report</h2>
                <div style="margin-top: 20px; display: inline-block; text-align: left; background: #f8fafc; padding: 15px 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Target Scope:</strong> ${target}</p>
                    <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Audit Timestamp:</strong> ${currentTime}</p>
                </div>
            </div>
            <h3 style="font-size: 20px; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">1. Infrastructure Perimeter</h3>
            ${networkHTML}
            
            {/* UPDATED: Changed Header Label for PDF */}
            <h3 style="font-size: 20px; color: #0f172a; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">2. Configuration & Header Audit</h3>
            ${webHTML}
            <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px; page-break-inside: avoid;">
                Generated by SentinelScan Core \u2022 This report was processed ephemerally with Zero-Telemetry.
            </div>
        </div>
    `;

    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `SentinelScan_Audit_${target}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(fullHTML).save();
  };

  return (
    <div className="ss-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500&display=swap');

        :root {
          --bp-bg: #0c2338;
          --bp-bg-2: #091a2a;
          --bp-line: rgba(148, 205, 226, 0.16);
          --bp-line-strong: rgba(148, 205, 226, 0.34);
          --bp-cyan: #5eead4;
          --bp-blue: #38bdf8;
          --bp-amber: #fbbf24;
          --bp-red: #f87171;
          --bp-text: #e7f1f7;
          --bp-dim: #7f9db3;
        }
        * { box-sizing: border-box; }
        html, body { max-width: 100%; overflow-x: hidden; }
        .ss-root {
          background: var(--bp-bg);
          background-image: linear-gradient(var(--bp-line) 1px, transparent 1px), linear-gradient(90deg, var(--bp-line) 1px, transparent 1px);
          background-size: 32px 32px;
          color: var(--bp-text);
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          width: 100%;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        img, svg { max-width: 100%; }
        .ss-sheet { max-width: 1180px; margin: 0 auto; width: 100%; padding: 0 clamp(16px, 4.5vw, 28px); }

        .ss-logo { display: flex; align-items: center; gap: 9px; }
        .logo-mark { color: var(--bp-cyan); flex-shrink: 0; }
        .logo-word { font-weight: 800; letter-spacing: 0.01em; color: var(--bp-text); font-size: 17px; white-space: nowrap; }
        .logo-word.sm { font-size: 13px; letter-spacing: 0.08em; }
        .logo-word .accent { color: var(--bp-cyan); }

        .topbar { position: sticky; top: 0; z-index: 20; background: rgba(9,26,42,0.88); backdrop-filter: blur(6px); border-bottom: 1px solid var(--bp-line-strong); }
        .topbar-inner { display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(16px, 4.5vw, 28px); flex-wrap: wrap; gap: 8px; }
        .brand-link { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .brand-sub { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--bp-dim); letter-spacing: 0.1em; }
        .note { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 0.1em; color: var(--bp-dim); text-transform: uppercase; }

        .bp-panel { position: relative; border: 1px solid var(--bp-line-strong); background: rgba(9,26,42,0.55); border-radius: 2px; padding: 30px; }
        .bp-panel-label { position: absolute; top: -11px; left: 22px; background: var(--bp-bg); padding: 0 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--bp-cyan); text-transform: uppercase; }
        .corner { position: absolute; width: 14px; height: 14px; pointer-events: none; }
        .corner::before, .corner::after { content: ''; position: absolute; background: var(--bp-blue); }
        .corner.tl { top: -1px; left: -1px; } .corner.tl::before { width: 14px; height: 1.5px; top: 0; left: 0; } .corner.tl::after { width: 1.5px; height: 14px; top: 0; left: 0; }
        .corner.tr { top: -1px; right: -1px; } .corner.tr::before { width: 14px; height: 1.5px; top: 0; right: 0; } .corner.tr::after { width: 1.5px; height: 14px; top: 0; right: 0; }
        .corner.bl { bottom: -1px; left: -1px; } .corner.bl::before { width: 14px; height: 1.5px; bottom: 0; left: 0; } .corner.bl::after { width: 1.5px; height: 14px; bottom: 0; left: 0; }
        .corner.br { bottom: -1px; right: -1px; } .corner.br::before { width: 14px; height: 1.5px; bottom: 0; right: 0; } .corner.br::after { width: 1.5px; height: 14px; bottom: 0; right: 0; }

        .panel-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 8px; }
        .panel-sub { color: var(--bp-dim); font-size: 0.92rem; line-height: 1.6; margin: 0 0 24px; max-width: 560px; }
        .input-row { display: flex; gap: 12px; flex-direction: column; }
        @media (min-width: 640px) { .input-row { flex-direction: row; } }
        .bp-input { flex: 1; background: var(--bp-bg-2); border: 1px solid var(--bp-line-strong); color: var(--bp-text); font-size: 14px; padding: 14px 16px; border-radius: 2px; outline: none; transition: border-color 0.15s ease; }
        .bp-input::placeholder { color: var(--bp-dim); }
        .bp-input:focus-visible { border-color: var(--bp-cyan); }
        .bp-input:disabled { opacity: 0.6; }

        .cta { display: inline-flex; align-items: center; justify-content: center; gap: 10px; font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 13.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--bp-bg); background: var(--bp-cyan); border: 1px solid var(--bp-cyan); padding: 14px 22px; border-radius: 2px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease; min-width: 168px; }
        .cta:hover:not(:disabled) { background: transparent; color: var(--bp-cyan); }
        .cta:disabled { opacity: 0.65; cursor: not-allowed; }
        .cta:focus-visible { outline: 2px solid var(--bp-amber); outline-offset: 3px; }
        .cta svg { width: 16px; height: 16px; }
        .cta.ghost { background: transparent; color: var(--bp-cyan); min-width: 0; }
        .cta.ghost:hover:not(:disabled) { background: var(--bp-cyan); color: var(--bp-bg); }

        .spinner { width: 15px; height: 15px; border: 2px solid rgba(12,35,56,0.35); border-top-color: var(--bp-bg); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }

        .terminal { background: var(--bp-bg-2); border: 1px solid var(--bp-line-strong); border-radius: 2px; }
        .terminal-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 1px solid var(--bp-line); }
        .terminal-head span:first-child { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; letter-spacing: 0.1em; color: var(--bp-dim); text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
        .terminal-head svg { width: 15px; height: 15px; color: var(--bp-cyan); }
        .pill { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; color: var(--bp-amber); border: 1px solid rgba(251,191,36,0.4); padding: 2px 8px; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; }
        .pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--bp-amber); animation: ping 1.4s ease-in-out infinite; }
        .terminal-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 8px; max-height: 360px; overflow-y: auto; }
        .log-line { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; white-space: pre-wrap; line-height: 1.5; animation: fadeUp 0.3s ease; }
        .log-line.info { color: var(--bp-dim); }
        .log-line.ok { color: var(--bp-cyan); }
        .log-line.warn { color: var(--bp-red); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

        /* ---------- Tabbed Interface Styles ---------- */
        .tabs-nav { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid var(--bp-line); overflow-x: auto; padding-bottom: 2px; }
        .tab-btn { background: transparent; border: none; font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.06em; color: var(--bp-dim); padding: 12px 20px; cursor: pointer; text-transform: uppercase; transition: color 0.2s, border 0.2s; border-bottom: 2px solid transparent; white-space: nowrap; }
        .tab-btn:hover { color: var(--bp-text); }
        .tab-btn.active { color: var(--bp-cyan); border-bottom-color: var(--bp-cyan); font-weight: 600; }
        
        .report-head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; margin-bottom: 30px; }
        .section-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.6rem; letter-spacing: -0.01em; margin: 0 0 6px; }
        .hl { color: var(--bp-cyan); }
        .panel-eyebrow { display: flex; align-items: center; gap: 10px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.05rem; margin-bottom: 22px; }
        .panel-eyebrow svg { width: 20px; height: 20px; color: var(--bp-cyan); }
        .empty-note { color: var(--bp-dim); font-style: italic; font-size: 0.92rem; }

        .badge { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 9px; border-radius: 10px; border: 1px solid var(--bp-line-strong); color: var(--bp-dim); flex-shrink: 0; }
        .badge-safe { color: var(--bp-blue); border-color: rgba(56,189,248,0.4); }
        .badge-risk { color: var(--bp-red); border-color: rgba(248,113,113,0.45); }

        .port-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
        .port-card { border: 1px solid var(--bp-line); border-radius: 2px; padding: 20px; background: rgba(9,26,42,0.4); display: flex; flex-direction: column; gap: 10px; }
        .port-card.risk { border-color: rgba(248,113,113,0.4); }
        .port-card-head { display: flex; justify-content: space-between; align-items: center; }
        .port-num { font-size: 1.05rem; font-weight: 600; letter-spacing: 0.02em; }
        .port-banner { font-weight: 600; font-size: 0.9rem; margin: 0; color: var(--bp-text); }
        .port-desc, .port-action, .finding-desc, .finding-action { font-size: 0.86rem; color: var(--bp-dim); line-height: 1.6; margin: 0; }
        .port-action, .finding-action { background: rgba(148,205,226,0.06); padding: 10px 12px; border-radius: 2px; color: var(--bp-text); }

        .finding-list { display: flex; flex-direction: column; gap: 16px; }
        .finding-row { border: 1px solid var(--bp-line); border-radius: 2px; padding: 20px; background: rgba(9,26,42,0.4); }
        .finding-row.sev-critical { border-color: rgba(248,113,113,0.45); }
        .finding-row.sev-medium { border-color: rgba(251,191,36,0.4); }
        .finding-row.sev-secure { border-color: rgba(94,234,212,0.4); }
        .finding-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .finding-head svg { width: 18px; height: 18px; flex-shrink: 0; }
        .sev-critical .finding-head svg, .sev-critical .finding-title { color: var(--bp-red); }
        .sev-medium .finding-head svg, .sev-medium .finding-title { color: var(--bp-amber); }
        .sev-secure .finding-head svg, .sev-secure .finding-title { color: var(--bp-cyan); }
        .sev-info .finding-head svg, .sev-info .finding-title { color: var(--bp-blue); }
        .finding-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1rem; flex: 1; }
        .sev-critical .badge { color: var(--bp-red); border-color: rgba(248,113,113,0.45); }
        .sev-medium .badge { color: var(--bp-amber); border-color: rgba(251,191,36,0.4); }
        .sev-secure .badge { color: var(--bp-cyan); border-color: rgba(94,234,212,0.4); }
        .finding-desc { margin-bottom: 10px; }

        @media (max-width: 860px) {
          .bp-panel { padding: 20px; }
          .port-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        }

        @media (max-width: 640px) {
          .topbar-inner { padding: 12px 16px; }
          .panel-title { font-size: 1.2rem; }
          .cta { width: 100%; min-width: 0; }
          .input-row { gap: 10px; }
          .section-title, .report-head .section-title { font-size: 1.3rem; }
          .report-head { align-items: flex-start; }
          .report-head .cta.ghost { width: auto; }
          .port-grid { grid-template-columns: 1fr; }
          .finding-head { flex-wrap: wrap; }
          .finding-title { flex-basis: 100%; }
        }

        @media (max-width: 420px) {
          .ss-sheet { padding: 0 14px; }
          .bp-panel { padding: 16px; }
          .bp-panel-label { left: 14px; font-size: 10px; }
          .panel-title { font-size: 1.05rem; }
          .panel-sub { font-size: 0.85rem; }
          .bp-input { font-size: 13px; padding: 12px 14px; }
          .cta { padding: 12px 16px; font-size: 12px; }
          .terminal-body { max-height: 260px; }
          .port-card, .finding-row { padding: 16px; }
          .badge { font-size: 9.5px; padding: 3px 7px; }
        }

        @media (prefers-reduced-motion: reduce) { .pill::before { animation: none; } }

        /* ---------------------- Feedback ---------------------- */
        .topbar-right { display: flex; align-items: center; gap: 14px; }
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

        .feedback-overlay { position: fixed; inset: 0; background: rgba(4,12,20,0.72); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
        .feedback-modal { position: relative; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto; background: var(--bp-bg); border: 1px solid var(--bp-line-strong); border-radius: 2px; padding: 30px 26px 26px; }
        .feedback-close { position: absolute; top: 12px; right: 12px; background: transparent; border: none; color: var(--bp-dim); cursor: pointer; padding: 6px; line-height: 0; }
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
        .feedback-modal .cta { width: 100%; justify-content: center; margin-top: 4px; min-width: 0; }
        .feedback-success { text-align: center; padding: 10px 0 4px; }
        .feedback-success svg { width: 34px; height: 34px; color: var(--bp-cyan); margin-bottom: 10px; }
        .feedback-success h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.15rem; margin: 0 0 8px; }
        .feedback-success p { color: var(--bp-dim); font-size: 0.9rem; margin: 0 0 20px; }
      `}</style>

      <div className="topbar">
        <div className="ss-sheet topbar-inner">
          <div className="brand-link" onClick={() => navigate('/')}>
            <Logo size={26} wordSize="sm" />
            <span className="brand-sub">// CORE</span>
          </div>
          <div className="topbar-right">
           <button className="feedback-btn" onClick={() => setFeedbackOpen(true)}>
            <IconFeedback /> FEEDBACK
          </button>
            <span className="note">Live Console</span>
          </div>
        </div>
      </div>

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}

      <div className="ss-sheet" style={{ paddingTop: 40, paddingBottom: 70 }}>
        <BpPanel label="Target Acquisition">
          <h2 className="panel-title display">Infrastructure &amp; Perimeter Security Audit</h2>
          <p className="panel-sub">
            Provide a remote hostname or public target identifier to execute standard vulnerability
            fingerprint matching across network and application layers.
          </p>
          <div className="input-row">
            <input
              className="bp-input mono"
              placeholder="e.g., scanme.nmap.org"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={loading}
            />
            <button className="cta" onClick={handleAudit} disabled={loading}>
              {loading ? (<><span className="spinner" />Scanning</>) : (<>Deploy Audit<IconArrow /></>)}
            </button>
          </div>
        </BpPanel>

        {loading && logs.length > 0 && (
          <div className="terminal" style={{ marginTop: 28 }}>
            <div className="terminal-head">
              <span><IconTerminal />Active Scan Matrix</span>
              <span className="pill">Running</span>
            </div>
            <div className="terminal-body">
              {logs.map((log, index) => (
                <div key={index} className={`log-line ${logTone(log)}`}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* UPDATED: Added Tabbed Navigation Interface */}
        {!loading && reportData && (
          <div style={{ marginTop: 48 }}>
            <div className="report-head">
              <div>
                <h2 className="section-title display">Threat Intelligence Report</h2>
                <span className="note">Target <span className="hl">{target}</span> &middot; Scanned {new Date().toLocaleString()}</span>
              </div>
              <button className="cta ghost" onClick={handleDownloadPDF}>
                <IconDownload />Export PDF
              </button>
            </div>

            <div className="tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'infrastructure' ? 'active' : ''}`}
                onClick={() => setActiveTab('infrastructure')}
              >
                1. Network Infrastructure
              </button>
              <button 
                className={`tab-btn ${activeTab === 'application' ? 'active' : ''}`}
                onClick={() => setActiveTab('application')}
              >
                2. Security Posture
              </button>
            </div>

            {/* TAB 1: Infrastructure */}
            {activeTab === 'infrastructure' && (
              <BpPanel label="01 — Infrastructure Perimeter" className="report-panel fade-in">
                <div className="panel-eyebrow"><IconServer />Network Infrastructure Exposure</div>
                {reportData.network.length === 0 ? (
                  <p className="empty-note">No exposed standard ports detected.</p>
                ) : (
                  <div className="port-grid">
                    {reportData.network.map((port, idx) => {
                      const safe = port.severity === 'Secure' || port.severity === 'Info';
                      return (
                        <div key={idx} className={`port-card ${safe ? 'safe' : 'risk'}`}>
                          <div className="port-card-head">
                            <span className="port-num mono">PORT {port.port}</span>
                            <span className={`badge ${safe ? 'badge-safe' : 'badge-risk'}`}>{port.severity}</span>
                          </div>
                          <p className="port-banner">{port.banner}</p>
                          <p className="port-desc"><strong>Impact —</strong> {port.description}</p>
                          <p className="port-action"><strong>Action —</strong> {port.remediation}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </BpPanel>
            )}

            {/* TAB 2: Application Layer (Updated wording) */}
            {activeTab === 'application' && (
              <BpPanel label="02 — Security Header Posture" className="report-panel fade-in">
                <div className="panel-eyebrow"><IconGlobe />Configuration &amp; Header Audit</div>
                <div className="finding-list">
                  {reportData.web.map((finding, idx) => {
                    const sev = sevClass(finding.severity);
                    return (
                      <div key={idx} className={`finding-row ${sev}`}>
                        <div className="finding-head">
                          {finding.severity === 'Secure' ? <IconCheck /> : <IconAlert />}
                          <span className="finding-title">{finding.title}</span>
                          <span className="badge">{finding.severity}</span>
                        </div>
                        <p className="finding-desc"><strong>Context —</strong> {finding.description}</p>
                        <p className="finding-action"><strong>Recommendation —</strong> {finding.remediation}</p>
                      </div>
                    );
                  })}
                </div>
              </BpPanel>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default Scanner;