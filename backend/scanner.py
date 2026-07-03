import socket
import concurrent.futures
import ipaddress

def parse_target_list(raw_input):
    """
    Takes a string of comma-separated targets or subnets and expands them into a clean list.
    Example Input: "amazon.com, 192.168.1.0/29"
    Example Output: ["amazon.com", "192.168.1.1", "192.168.1.2", ... "192.168.1.6"]
    """
    clean_targets = []
    
    # Split the input by commas and remove extra spaces
    items = [item.strip() for item in raw_input.split(',')]
    
    for item in items:
        # Check if the user entered a subnet (indicated by a '/')
        if '/' in item:
            try:
                # ipaddress expands the subnet into all its usable IP addresses
                network = ipaddress.ip_network(item, strict=False)
                for ip in network.hosts():
                    clean_targets.append(str(ip))
            except ValueError:
                # If the user typed an invalid subnet, skip it to prevent crashing
                pass
        else:
            # If it's a standard IP or domain, just add it directly
            clean_targets.append(item)
            
    return clean_targets

def scan_port(target_ip, port):
    """
    Worker function: Probes a single port on a single target.
    """
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        probe.settimeout(0.5) 
        
        result = probe.connect_ex((target_ip, port))
        
        if result == 0:
            banner_info = "No banner received"
            try:
                probe.settimeout(0.3)
                banner_bytes = probe.recv(1024)
                if banner_bytes:
                    banner_info = banner_bytes.decode('utf-8', errors='ignore').strip().split('\n')[0]
                else:
                    probe.sendall(b"HEAD / HTTP/1.1\r\nHost: target\r\n\r\n")
                    banner_bytes = probe.recv(1024)
                    banner_text = banner_bytes.decode('utf-8', errors='ignore').strip()
                    if banner_text:
                        banner_info = banner_text.split('\n')[0]
            except Exception:
                try:
                    banner_info = f"Active standard service ({socket.getservbyport(port)})"
                except Exception:
                    banner_info = "Active unidentified custom protocol"
                    
            probe.close()
            # NEW: We now return the target_ip so the dashboard knows who this belongs to
            return {
                "target": target_ip,
                "port": port,
                "state": "OPEN",
                "banner": banner_info
            }
            
        probe.close()
        return None
    except Exception:
        return None

def scan_multiple_targets(raw_input, port_list):
    """
    Manager function: Takes the raw user input, expands it, and deploys the worker threads.
    """
    targets = parse_target_list(raw_input)
    scan_report = []
    
    # We will generate a list of (target, port) pairs to feed the workers
    tasks = []
    for target in targets:
        for port in port_list:
            tasks.append((target, port))
            
    # Deploy a massive thread pool to process all targets and ports simultaneously
    with concurrent.futures.ThreadPoolExecutor(max_workers=200) as executor:
        # Submit all tasks to the pool
        futures = [executor.submit(scan_port, task[0], task[1]) for task in tasks]
        
        # Collect results as they finish
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                scan_report.append(result)
                
    # Sort the results by Target first, then by Port, for a clean report
    scan_report.sort(key=lambda x: (x['target'], x['port']))
    return scan_report