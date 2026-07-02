from flask import Flask, request, jsonify
from flask_cors import CORS
import scanner # This imports your scanner.py file!

# Create the Flask application (The Waiter)
app = Flask(__name__)

# Enable CORS so your HTML frontend is allowed to talk to this backend safely
CORS(app) 

# Create the route (The endpoint your frontend will connect to)
@app.route('/api/scan', methods=['POST'])
def run_scan():
    # 1. Get the target IP the user typed in the dashboard
    data = request.get_json()
    target = data.get('target')
    
    if not target:
        return jsonify({"error": "No target provided!"}), 400
        
    print(f"[*] API received scan request for: {target}")
    
    # The ports we want to test
    ports_to_test = [21, 22, 80, 443, 3306, 8080]
    
    # 2. Hand the target to your scanner engine
    # We are calling the function from your scanner.py file!
    results = scanner.scan_and_grab_banner(target, ports_to_test)
    
    # 3. Send the results back to the frontend as JSON
    return jsonify({
        "status": "success",
        "target": target,
        "scan_data": results
    })

# Start the server on Port 5000
if __name__ == '__main__':
    print("[*] SentinelScan API Bridge is starting on Port 5000...")
    app.run(port=5000, debug=True)