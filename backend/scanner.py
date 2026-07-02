import socket

def scan_and_grab_banner(target_ip, port_list):
    """
    Scans a list of ports and attempts to read the software banner
    from any port that is open.
    """
    print(f"[*] Starting Banner Grab scan on {target_ip}...\n")

    for port in port_list:
        try:
            probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # We increased the timeout slightly because reading messages takes time
            probe.settimeout(1.0) 
            
            result = probe.connect_ex((target_ip, port))
            
            if result == 0:
                print(f"[+] ALERT: Port {port} is OPEN!")
                
                try:
                    # Step 1: Send a generic "Hello" (an HTTP GET request) to wake the server up
                    probe.sendall(b"GET / HTTP/1.0\r\n\r\n")
                    
                    # Step 2: Listen for the server's reply (up to 1024 bytes of data)
                    banner_bytes = probe.recv(1024)
                    
                    # Step 3: Decode the raw computer bytes back into readable English text
                    banner_text = banner_bytes.decode('utf-8', errors='ignore').strip()
                    
                    if banner_text:
                        # Servers send long messages. We just want the very first line!
                        first_line = banner_text.split('\n')[0]
                        print(f"    -> BANNER CAUGHT: {first_line}")
                    else:
                        print("    -> No banner received.")
                        
                except Exception as e:
                    print("    -> Port open, but server stayed silent.")
            else:
                print(f"[-] SAFE: Port {port} is closed.")
                
            probe.close()

        except Exception as error:
            print(f"[!] Error on port {port}: {error}")
            
    print("\n[*] Scan Complete!")

# ==========================================
# RUNNING THE SCRIPT
# ==========================================

target = "127.0.0.1"
ports_to_test = [21, 22, 80, 443, 3306, 8080]

scan_and_grab_banner(target, ports_to_test)