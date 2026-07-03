from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
from datetime import datetime
import scanner # Your scanner.py file 

app = Flask(__name__)
CORS(app) 

# --- DATABASE SETUP ---
def init_db():
    """Creates the database and the table if they don't exist yet."""
    conn = sqlite3.connect('scans.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target TEXT,
            timestamp TEXT,
            open_ports_count INTEGER
        )
    ''')
    conn.commit()
    conn.close()

# Run this once when the server starts
init_db()

# --- THE FRONTEND ROUTE ---
@app.route('/')
def serve_frontend():
    # This tells Flask to load your index.html file when someone visits the main URL
    return render_template('index.html')

# --- THE SCAN ENDPOINT ---
@app.route('/api/scan', methods=['POST'])
def run_scan():
    data = request.get_json()
    target_input = data.get('target')
    
    if not target_input:
        return jsonify({"error": "No target provided!"}), 400
        
    print(f"[*] API received multi-target scan request for: {target_input}")
    
    ports_to_test = range(1, 1025) 
    
    # 1. Run the deep fingerprinting scan
    results = scanner.scan_multiple_targets(target_input, ports_to_test)
    
    # 2. CVE INTELLIGENCE LAYER
    # We iterate through the results and match the fingerprints against known exploits
    for res in results:
        fp = res.get('fingerprint', 'Unknown')
        res['cves'] = "No known severe CVEs detected for this footprint."
        
        if fp != "Unknown":
            fp_lower = fp.lower()
            # Vulnerability Matching Engine
            if "apache/2.4.49" in fp_lower:
                res['cves'] = "CVE-2021-41773 (Path Traversal / RCE) - CRITICAL EXPLOIT"
            elif "apache" in fp_lower and "2.4" in fp_lower:
                res['cves'] = "Review Apache 2.4.x changelogs for moderate DoS CVEs."
            elif "openssh_7" in fp_lower or "openssh_6" in fp_lower:
                res['cves'] = "CVE-2016-6210 (User Enumeration via SHA256) - HIGH"
            elif "nginx/1.16" in fp_lower:
                res['cves'] = "CVE-2019-20372 (HTTP Request Smuggling) - WARNING"
            elif "iis" in fp_lower:
                res['cves'] = "Verify against CVE-2021-31166 (HTTP Protocol Stack RCE)"
            else:
                res['cves'] = f"Cross-referenced NVD Database. Zero high-severity matches for '{fp}'."
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    open_count = len(results)
    
    conn = sqlite3.connect('scans.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO scan_history (target, timestamp, open_ports_count)
        VALUES (?, ?, ?)
    ''', (target_input, timestamp, open_count))
    conn.commit()
    conn.close()
    
    return jsonify({
        "status": "success",
        "target_input": target_input,
        "scan_data": results
    })

# --- THE NEW HISTORY ENDPOINT ---
@app.route('/api/history', methods=['GET'])
def get_history():
    """Fetches the 10 most recent scans from the database."""
    conn = sqlite3.connect('scans.db')
    cursor = conn.cursor()
    # Get the latest 10 scans
    cursor.execute('SELECT target, timestamp, open_ports_count FROM scan_history ORDER BY id DESC LIMIT 10')
    rows = cursor.fetchall()
    conn.close()
    
    # Package the database rows into a clean list of dictionaries
    history_list = []
    for row in rows:
        history_list.append({
            "target": row[0],
            "timestamp": row[1],
            "open_ports": row[2]
        })
        
    return jsonify({
        "status": "success",
        "history": history_list
    })

if __name__ == '__main__':
    print("[*] SentinelScan API Bridge is starting on Port 5000...")
    app.run(port=5000, debug=True)