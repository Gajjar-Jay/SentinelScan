import socket
import concurrent.futures

def scan_port(target_ip, port):
    """Worker function: Scans a single port and grabs its banner."""
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        probe.settimeout(0.5) 
        
        result = probe.connect_ex((target_ip, port))
        
        if result == 0:
            banner_info = "No banner received"
            try:
                probe.sendall(b"GET / HTTP/1.0\r\n\r\n")
                banner_bytes = probe.recv(1024)
                banner_text = banner_bytes.decode('utf-8', errors='ignore').strip()
                if banner_text:
                    banner_info = banner_text.split('\n')[0]
            except Exception:
                pass 
                
            probe.close()
            return {
                "port": port,
                "state": "OPEN",
                "banner": banner_info
            }
            
        probe.close()
        return None
        
    except Exception:
        return None

def scan_and_grab_banner(target_ip, port_list):
    """Manager function: Deploys multiple threads to scan a list of ports instantly."""
    scan_report = []
    
    # Spawn 50 concurrent workers to handle the port list
    with concurrent.futures.ThreadPoolExecutor(max_workers=200) as executor:
        # Submit all the ports to the workers
        futures = [executor.submit(scan_port, target_ip, port) for port in port_list]
        
        # As each worker finishes, collect the result if the port was open
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                scan_report.append(result)
                
    # Sort the final report numerically so it looks clean on the frontend
    scan_report.sort(key=lambda x: x['port'])
    return scan_report