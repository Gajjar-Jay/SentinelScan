import socket

def scan_and_grab_banner(target_ip, port_list):
    # Create an empty list to store our findings
    scan_report = [] 
    
    for port in port_list:
        try:
            probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            probe.settimeout(1.0) 
            
            result = probe.connect_ex((target_ip, port))
            
            # If the door is open...
            if result == 0:
                banner_info = "No banner received"
                
                # Try to grab the banner
                try:
                    probe.sendall(b"GET / HTTP/1.0\r\n\r\n")
                    banner_bytes = probe.recv(1024)
                    banner_text = banner_bytes.decode('utf-8', errors='ignore').strip()
                    
                    if banner_text:
                        banner_info = banner_text.split('\n')[0]
                except Exception:
                    pass # If the banner grab fails, we just keep going
                    
                # Save the finding to our report as a dictionary
                scan_report.append({
                    "port": port,
                    "state": "OPEN",
                    "banner": banner_info
                })
                
            probe.close()

        except Exception as error:
            pass # Ignore errors like network timeouts so the scan doesn't crash
            
    # Hand the final report back to whoever asked for it (the API!)
    return scan_report