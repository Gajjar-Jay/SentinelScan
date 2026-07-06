"""
Domain ownership verification.

Same idea as Google Search Console's "HTML file upload" method:

  1. We hand the user a random token and ask them to publish it at
         https://<target>/.well-known/sentinelscan-verify.txt
  2. Our backend fetches that URL *itself* and checks the content matches.
  3. Only if that fetch succeeds do we mark the domain as verified.

Only someone with real control over the site's file system / hosting panel
/ CDN config can make that URL return the expected content — a visitor who
just typed a domain into the scan box has no way to fake it. This is what
makes `authorized` a server-verified fact instead of a client-supplied
checkbox.

Verification is intentionally short-lived (VERIFICATION_TTL) so a domain
that changes hands doesn't stay "authorized" forever in our database.
"""

import os
import re
import secrets
import sqlite3
import time
import ipaddress
from urllib.parse import urlparse

import aiohttp

DB_PATH = os.path.join(os.path.dirname(__file__), "scans.db")

WELL_KNOWN_PATH = "/.well-known/sentinelscan-verify.txt"
TOKEN_PREFIX = "sentinelscan-verify="

PENDING_TTL_SECONDS = 15 * 60        # a generated token is valid to redeem for 15 minutes
VERIFIED_TTL_SECONDS = 60 * 60       # a successful verification is trusted for 1 hour, then must be re-checked

FETCH_TIMEOUT_SECONDS = 6


def _connect():
    con = sqlite3.connect(DB_PATH)
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS domain_verifications (
            domain       TEXT PRIMARY KEY,
            token        TEXT NOT NULL,
            created_at   REAL NOT NULL,
            verified_at  REAL
        )
        """
    )
    return con


def normalize_domain(target: str) -> str:
    """
    Turn whatever the user typed (bare domain, full URL, with/without
    port or path) into a bare hostname, so the same domain always maps
    to the same verification row regardless of how it was entered.
    """
    t = (target or "").strip().lower()
    if not t:
        return ""
    if "://" not in t:
        t = "https://" + t
    host = urlparse(t).hostname or ""
    return host


def _is_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def start_verification(target: str) -> dict:
    """
    Create (or refresh) a pending verification token for a domain and
    tell the caller exactly what to publish and where.
    """
    domain = normalize_domain(target)
    if not domain:
        return {"ok": False, "error": "Could not parse a domain from that target."}
    if _is_ip(domain):
        return {"ok": False, "error": "Ownership verification requires a domain name, not a bare IP address."}

    token = secrets.token_hex(16)
    now = time.time()

    con = _connect()
    with con:
        con.execute(
            """
            INSERT INTO domain_verifications (domain, token, created_at, verified_at)
            VALUES (?, ?, ?, NULL)
            ON CONFLICT(domain) DO UPDATE SET
                token = excluded.token,
                created_at = excluded.created_at,
                verified_at = NULL
            """,
            (domain, token, now),
        )
    con.close()

    file_content = f"{TOKEN_PREFIX}{token}"
    return {
        "ok": True,
        "domain": domain,
        "token": token,
        "file_content": file_content,
        "file_path": WELL_KNOWN_PATH,
        "file_url": f"https://{domain}{WELL_KNOWN_PATH}",
        "expires_in_seconds": PENDING_TTL_SECONDS,
        "instructions": (
            f"Create a file at {WELL_KNOWN_PATH} on {domain} containing exactly:\n"
            f"{file_content}\n"
            "Then click \"Check verification\". This proves you (or someone with "
            "hosting/FTP/server access) control the site, the same way search "
            "engines verify site ownership."
        ),
    }


async def _fetch_file(domain: str) -> str | None:
    """Fetch the well-known verification file. Tries https, falls back to http."""
    timeout = aiohttp.ClientTimeout(total=FETCH_TIMEOUT_SECONDS)
    headers = {"User-Agent": "SentinelScan-Verifier/1.0 (+https://sentinel-scan-one.vercel.app)"}
    connector = aiohttp.TCPConnector(ssl=False)
    for scheme in ("https", "http"):
        url = f"{scheme}://{domain}{WELL_KNOWN_PATH}"
        try:
            async with aiohttp.ClientSession(timeout=timeout, headers=headers, connector=connector) as session:
                async with session.get(url, allow_redirects=True) as resp:
                    if resp.status == 200:
                        text = await resp.text(errors="ignore")
                        return text
        except Exception:
            continue
    return None


def _row_for(domain: str):
    con = _connect()
    cur = con.execute(
        "SELECT domain, token, created_at, verified_at FROM domain_verifications WHERE domain = ?",
        (domain,),
    )
    row = cur.fetchone()
    con.close()
    return row


async def check_verification(target: str) -> dict:
    """
    Actually perform the server-side fetch-and-compare. This is the step
    that turns "user claims ownership" into "server confirmed ownership."
    """
    domain = normalize_domain(target)
    if not domain:
        return {"ok": False, "verified": False, "error": "Could not parse a domain from that target."}

    row = _row_for(domain)
    if not row:
        return {"ok": False, "verified": False, "error": "No verification has been started for this domain yet."}

    _, token, created_at, verified_at = row
    if time.time() - created_at > PENDING_TTL_SECONDS and not verified_at:
        return {
            "ok": False,
            "verified": False,
            "error": "This verification token expired. Start verification again to get a new one.",
        }

    content = await _fetch_file(domain)
    expected = f"{TOKEN_PREFIX}{token}"

    if content is not None and expected in content:
        now = time.time()
        con = _connect()
        with con:
            con.execute(
                "UPDATE domain_verifications SET verified_at = ? WHERE domain = ?",
                (now, domain),
            )
        con.close()
        return {"ok": True, "verified": True, "domain": domain}

    reason = (
        "The verification file was not found or did not contain the expected token."
        if content is None
        else "A file was found at that path, but it did not contain the expected token."
    )
    return {"ok": True, "verified": False, "domain": domain, "error": reason}


def is_verified(target: str) -> bool:
    """
    Server-side source of truth for whether deep-scan features should
    unlock for this target. This is what api.py calls — never the
    client-supplied `authorized` flag.
    """
    domain = normalize_domain(target)
    if not domain:
        return False
    row = _row_for(domain)
    if not row:
        return False
    _, _token, _created_at, verified_at = row
    if not verified_at:
        return False
    return (time.time() - verified_at) <= VERIFIED_TTL_SECONDS


def get_status(target: str) -> dict:
    domain = normalize_domain(target)
    if not domain:
        return {"domain": None, "state": "unknown"}
    row = _row_for(domain)
    if not row:
        return {"domain": domain, "state": "not_started"}

    _, token, created_at, verified_at = row
    now = time.time()

    if verified_at and (now - verified_at) <= VERIFIED_TTL_SECONDS:
        return {
            "domain": domain,
            "state": "verified",
            "verified_at": verified_at,
            "expires_in_seconds": int(VERIFIED_TTL_SECONDS - (now - verified_at)),
        }
    if verified_at:
        return {"domain": domain, "state": "expired"}
    if (now - created_at) <= PENDING_TTL_SECONDS:
        return {
            "domain": domain,
            "state": "pending",
            "token": token,
            "file_path": WELL_KNOWN_PATH,
            "file_content": f"{TOKEN_PREFIX}{token}",
            "expires_in_seconds": int(PENDING_TTL_SECONDS - (now - created_at)),
        }
    return {"domain": domain, "state": "pending_expired"}
