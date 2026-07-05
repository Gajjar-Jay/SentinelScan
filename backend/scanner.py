import asyncio
import socket
import aiohttp

class SentinelEngine:
    """
    Enterprise-Grade Asynchronous Scanning Engine
    Implements concurrency limits, custom headers, and graceful degradation.
    """
    def __init__(self, target, ports):
        self.target = target
        self.ports = ports
        # THE CONCURRENCY LIMITER: Prevents the server from crashing out of memory
        self.semaphore = asyncio.Semaphore(100) 
        
        # Standard professional User-Agent to prevent basic WAF blocks
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }

    # --- MODULE 1: INFRASTRUCTURE MAPPING ---
    async def check_port_async(self, ip, port, timeout=1.5):
        """Checks a single port securely utilizing the semaphore."""
        async with self.semaphore:
            try:
                conn = asyncio.open_connection(ip, port)
                reader, writer = await asyncio.wait_for(conn, timeout=timeout)
                writer.close()
                await writer.wait_closed()
                
                # Rich Data Object for Ports
                if port == 80: 
                    return {
                        "port": 80, "state": "OPEN", "severity": "Info",
                        "banner": "Standard HTTP Traffic",
                        "description": "Port 80 is the default channel for unencrypted web traffic. While necessary for catching legacy users, sensitive data should never be transmitted here.",
                        "remediation": "Ensure all traffic hitting Port 80 is permanently redirected (HTTP 301) to Port 443 (HTTPS)."
                    }
                elif port == 443: 
                    return {
                        "port": 443, "state": "OPEN", "severity": "Secure",
                        "banner": "Encrypted HTTPS Traffic",
                        "description": "Port 443 handles secure, encrypted web traffic. This is the mandatory standard for all modern web applications and API endpoints.",
                        "remediation": "Maintain strong TLS 1.2/1.3 configurations and actively monitor for expiring SSL certificates."
                    }
                else:
                    return {
                        "port": port, "state": "OPEN", "severity": "Warning",
                        "banner": "Non-Standard Service Exposed",
                        "description": f"An unexpected or non-standard service is actively running on Port {port}. This expands the external attack surface.",
                        "remediation": "Investigate this port. Restrict access via firewall rules (Zero Trust) if it is not explicitly required for public operation."
                    }
                    
            except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
                return None

    async def deploy_network_swarm(self):
        """Resolves DNS and deploys the infrastructure workers."""
        try:
            ip = socket.gethostbyname(self.target)
        except socket.gaierror:
            return []
            
        tasks = [self.check_port_async(ip, port) for port in self.ports]
        results = await asyncio.gather(*tasks)
        return [res for res in results if res is not None]


    # --- MODULE 2: APPLICATION SECURITY (DAST) ---
    async def deploy_dast_swarm(self):
        """Probes application layer and returns structured Threat Intelligence."""
        url = f"http://{self.target}"
        issues = []
        
        try:
            # We use ssl=False to bypass strict enterprise SSL handshakes that flag bots
            connector = aiohttp.TCPConnector(ssl=False)
            async with aiohttp.ClientSession(headers=self.headers, connector=connector) as session:
                # Phase A: Security Headers
                try:
                    async with session.get(url, timeout=10, allow_redirects=True) as response:
                        headers = response.headers
                        
                        if 'X-Frame-Options' not in headers and 'x-frame-options' not in headers:
                            issues.append({
                                "title": "Missing X-Frame-Options Header",
                                "severity": "Medium",
                                "description": "The application allows itself to be framed by other domains. Attackers can use this to execute 'Clickjacking' attacks, tricking users into clicking hidden malicious links.",
                                "remediation": "Configure the web server to include 'X-Frame-Options: DENY' or 'SAMEORIGIN' in the HTTP response."
                            })
                            
                        if 'Content-Security-Policy' not in headers and 'content-security-policy' not in headers:
                            issues.append({
                                "title": "Absence of Content-Security-Policy (CSP)",
                                "severity": "High",
                                "description": "No CSP is enforced. If a vulnerability exists, attackers can inject malicious JavaScript (XSS) to steal user sessions or deface the application.",
                                "remediation": "Implement a strict CSP header restricting script sources. E.g., 'Content-Security-Policy: default-src \\'self\\''."
                            })
                            
                        if 'Strict-Transport-Security' not in headers and 'strict-transport-security' not in headers:
                            issues.append({
                                "title": "Missing HTTP Strict Transport Security (HSTS)",
                                "severity": "Medium",
                                "description": "The server does not force browsers to use HTTPS. Attackers on the same network can execute Man-in-the-Middle (MitM) downgrade attacks to intercept unencrypted traffic.",
                                "remediation": "Add the 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header."
                            })
                except Exception:
                    issues.append({
                        "title": "Application Timeout",
                        "severity": "Warning",
                        "description": "The primary application endpoint failed to respond within the timeout threshold.",
                        "remediation": "Verify server uptime and ensure ICMP/HTTP probes are not globally dropped."
                    })

                # Phase B: Asset Enumeration
                hitlist = ['/.env', '/.git/config', '/admin', '/wp-login.php', '/backup.sql']
                for path in hitlist:
                    test_url = f"{url}{path}"
                    try:
                        async with session.get(test_url, timeout=3, allow_redirects=False) as path_resp:
                            if path_resp.status == 200:
                                issues.append({
                                    "title": f"Exposed Sensitive Asset: {path}",
                                    "severity": "Critical",
                                    "description": f"A highly sensitive file or directory ({path}) is publicly accessible. This can lead to total system compromise or severe data leaks.",
                                    "remediation": "Immediately remove public access to this file. Configure server routing to return 403 Forbidden or 404 Not Found for internal assets."
                                })
                    except Exception:
                        pass 
                        
                if not issues:
                    issues.append({
                        "title": "Standard Defenses Active",
                        "severity": "Secure",
                        "description": "Core HTTP security headers are present and no common exposed directories were found.",
                        "remediation": "Maintain current security posture and continue regular auditing."
                    })
                    
        except Exception:
            issues.append({
                "title": "WAF Block / Unreachable",
                "severity": "Info",
                "description": "The target is unreachable or a Web Application Firewall (WAF) actively terminated the automated security probe.",
                "remediation": "If you own this infrastructure, whitelist the scanner's IP address to allow deep auditing."
            })
        
        return issues


    # --- MODULE 3: MASTER CONTROLLER ---
    async def execute_full_audit(self):
        """Runs all offensive and analytical modules concurrently."""
        network_task = self.deploy_network_swarm()
        web_task = self.deploy_dast_swarm()
        
        network_results, web_results = await asyncio.gather(network_task, web_task)
        return network_results, web_results


# --- EXPORTED API BRIDGE ---
def run_high_speed_scan(target, ports_to_test):
    """Entry point for the Flask API."""
    engine = SentinelEngine(target, ports_to_test)
    return asyncio.run(engine.execute_full_audit())