# 🛡️ SentinelScan Core 

> **Enterprise-grade infrastructure auditing and dynamic web application testing, delivered instantly to your browser.**

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Engine-Python_3.10+-3776AB?logo=python)
![Security](https://img.shields.io/badge/Architecture-Zero_Telemetry-10b981)

SentinelScan Core is a high-speed, dual-layer cybersecurity auditing tool. It combines an asynchronous network mapper with a Dynamic Application Security Testing (DAST) engine to provide instant, actionable threat intelligence via a modern, glassmorphism-inspired React dashboard.

---

## ✨ Enterprise Features

* **⚡ Asynchronous Swarm Engine:** Utilizes Python's `asyncio` and `aiohttp` with strict semaphore concurrency limits (max 100 workers) to map network perimeters and probe application layers in milliseconds without overwhelming the host system.
* **🌐 Deep Network Mapping:** Scans targets for exposed standard web ports (80/443) and warns on non-standard exposed gateways, expanding visibility into the external attack surface.
* **🔒 DAST Vulnerability Analysis:** Actively probes for missing critical security headers (CSP, HSTS, X-Frame-Options) and executes rapid asset enumeration to detect exposed internal directories (e.g., `/.env`, `/.git/config`).
* **🥷 WAF-Resilient Probing:** Implements user-agent spoofing and raw TCP connection fallbacks to gracefully navigate enterprise Web Application Firewalls (WAFs) and strict SSL handshakes.
* **📄 Executive Threat Intelligence Reporting:** One-click PDF compilation seamlessly converts the active React DOM into a professional, color-coded mitigation report suitable for C-level executives and engineering teams.
* **👻 Zero-Telemetry Guarantee:** 100% ephemeral processing. Data exists in RAM just long enough to generate the local report, mathematically guaranteeing audit privacy.

---

## 🛠️ Technology Stack

**Frontend Architecture:**
* React.js (Vite)
* Material-UI (MUI) for Enterprise UI Components
* React Router DOM for Multi-Page SPA Navigation
* `html2pdf.js` for Client-Side Document Rendering

**Backend Architecture:**
* Python (Flask API Bridge)
* `asyncio` for non-blocking I/O tasks
* `aiohttp` for concurrent HTTP request pooling
* `socket` for raw DNS and infrastructure resolution

---

## 🚀 Quick Start Guide

### Prerequisites
* Node.js (v16+)
* Python (3.9+)

### 1. Initialize the Python Scanning Engine (Backend)
Navigate to the backend directory and start the Flask API.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install flask flask-cors aiohttp
python api.py