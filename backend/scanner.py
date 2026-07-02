import socket

def scan_multiple_ports(target_ip, port_list):
    """
    This function takes an IP and a LIST of ports. 
    It loops through each port to see if it is open.
    """
    print(f"[*] Starting multi-port scan on {target_ip}...\n")

    # This loop goes through our list one by one
    for port in port_list:
        try:
            probe = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            # We lowered the timeout to 0.5 seconds so the scan goes faster!
            probe.settimeout(0.5) 
            
            result = probe.connect_ex((target_ip, port))
            
            if result == 0:
                print(f"[+] ALERT: Port {port} is OPEN!")
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

# A list of the most common ports used in cyber attacks
# 21 (File Transfer), 22 (Remote Login), 80 (Web), 443 (Secure Web), 3306 (Database)
ports_to_test = [21, 22, 80, 443, 3306, 8080]

# Trigger the upgraded function
scan_multiple_ports(target, ports_to_test)