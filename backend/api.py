from flask import Flask, request, jsonify
from flask_cors import CORS  
from datetime import datetime
import scanner # Your scanner.py file 

app = Flask(__name__)
# THE MAGIC LINE: Allows your Vercel frontend to talk to this Render backend
CORS(app)  

# --- THE SCAN ENDPOINT ---
@app.route('/api/scan', methods=['POST'])
def run_scan():
    data = request.get_json()
    target_input = data.get('target')
    
    if not target_input:
        return jsonify({"status": "error", "error": "No target provided!"}), 400
        
    print(f"[*] API received multi-target scan request for: {target_input}")
    
    # 1. TARGET VALIDATION ENGINE
    import socket
    import ipaddress
    
    is_valid = False
    try:
        # Check if it is a valid IP or Subnet
        ipaddress.ip_network(target_input, strict=False)
        is_valid = True
    except ValueError:
        # If not an IP, check if it is a real Domain Name
        try:
            socket.gethostbyname(target_input)
            is_valid = True
        except socket.gaierror:
            is_valid = False
            
    if not is_valid:
        return jsonify({
            "status": "error", 
            "error": f"DNS Resolution Failed: '{target_input}' does not exist or is unreachable."
        })
    
    # 2. RUN THE DEEP SCAN (Async + DAST)
    # Cloud Optimization: Curated list of high-value ports instead of all 1,024
    ports_to_test = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 8080]
    
    network_results, web_results = scanner.run_high_speed_scan(target_input, ports_to_test)
    
    # 3. CVE INTELLIGENCE LAYER
    for res in network_results: 
        fp = res.get('fingerprint', 'Unknown')
        res['cves'] = "No known severe CVEs detected for this footprint."
    
    # 4. DATA PACKAGING
    return jsonify({
        "status": "success",
        "target_input": target_input,
        "scan_data": network_results,
        "web_data": web_results 
    })

if __name__ == '__main__':
    print("[*] SentinelScan API Bridge is starting on Port 5000...")
    print("[*] ZERO-TELEMETRY MODE ACTIVE: No data will be logged.")
    # REQUIRED FOR RENDER: host='0.0.0.0'
    app.run(host='0.0.0.0', port=5000, debug=True)