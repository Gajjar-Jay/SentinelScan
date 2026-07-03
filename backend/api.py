from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import scanner 

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

# --- THE SCAN ENDPOINT ---
# --- THE SCAN ENDPOINT ---
@app.route('/api/scan', methods=['POST'])
def run_scan():
    data = request.get_json()
    target_input = data.get('target')
    
    if not target_input:
        return jsonify({"error": "No target provided!"}), 400
        
    print(f"[*] API received multi-target scan request for: {target_input}")
    
   # Reverting to the full standard port range for accurate reporting
    ports_to_test = range(1, 1025)
    
    # Send the raw input to our new multi-target manager
    results = scanner.scan_multiple_targets(target_input, ports_to_test)
    
    # Save the scan history (Using the original input string to represent the scan)
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
    
    # Send results back to the dashboard
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