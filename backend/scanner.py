import socket
import concurrent.futures
import ipaddress
import re

def parse_target_list(raw_input):
    clean_targets = []
    items = [item.strip() for item in raw_input.split(',')]
    for item in items:
        if '/' in item:
            try:
                network = ipaddress.ip_network(item, strict=False)
                for ip in network.hosts():
                    clean_targets.append(str(ip))
            except ValueError:
                pass
        else:
            clean_targets.append(item)
    return clean_targets

def scan_port(target_ip, port):
    """
    Upgraded Worker: Sends aggressive probes to extract exact software versions.
    """
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        probe.settimeout(0.5) 
        result = probe.connect_ex((target_ip, port))
        
        if result == 0:
            banner_info = "No banner received"
            fingerprint = "Unknown" # NEW: Our exact version tracker
            
            try:
                probe.settimeout(0.5)
                banner_bytes = probe.recv(1024)
                
                if banner_bytes:
                    raw_banner = banner_bytes.decode('utf-8', errors='ignore').strip()
                    banner_info = raw_banner.split('\n')[0]
                    
                    # Fingerprint SSH Servers
                    if "SSH" in raw_banner:
                        fingerprint = raw_banner.split()[0]
                else:
                    # AGGRESSIVE PROBE: Force web servers to reveal their identity
                    probe.sendall(b"GET / HTTP/1.1\r\nHost: target\r\nUser-Agent: SentinelScan/2.0\r\nAccept: */*\r\n\r\n")
                    banner_bytes = probe.recv(1024)
                    raw_banner = banner_bytes.decode('utf-8', errors='ignore').strip()
                    
                    if raw_banner:
                        banner_info = raw_banner.split('\n')[0]
                        # Extract the exact server version using Regex
                        server_match = re.search(r'Server:\s*(.+)', raw_banner, re.IGNORECASE)
                        if server_match:
                            fingerprint = server_match.group(1).strip()
            except Exception:
                try:
                    banner_info = f"Active standard service ({socket.getservbyport(port)})"
                except Exception:
                    banner_info = "Active unidentified custom protocol"
                    
            probe.close()
            return {
                "target": target_ip,
                "port": port,
                "state": "OPEN",
                "banner": banner_info,
                "fingerprint": fingerprint # Sending the fingerprint back to the API
            }
            
        probe.close()
        return None
    except Exception:
        return None

def scan_multiple_targets(raw_input, port_list):
    targets = parse_target_list(raw_input)
    scan_report = []
    
    tasks = []
    for target in targets:
        for port in port_list:
            tasks.append((target, port))
            
    with concurrent.futures.ThreadPoolExecutor(max_workers=70) as executor:
        futures = [executor.submit(scan_port, task[0], task[1]) for task in tasks]
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                scan_report.append(result)
                
    scan_report.sort(key=lambda x: (x['target'], x['port']))
    return scan_report