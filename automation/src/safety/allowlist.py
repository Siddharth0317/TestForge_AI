from urllib.parse import urlparse
from typing import List

BLOCKED_HOSTNAMES = {
    "169.254.169.254",          # Cloud metadata service IP
    "metadata.google.internal", # GCP metadata
    "0.0.0.0",
    "::1"
}

def is_target_host_allowed(target_url: str, allowed_hosts: List[str], allow_local_ci: bool = False) -> bool:
    """
    Validates that a target URL's hostname is explicitly permitted in the environment's
    allowed_hosts list and does not match prohibited metadata or SSRF targets.
    """
    parsed = urlparse(target_url)
    hostname = (parsed.hostname or "").lower()

    if not hostname:
        return False

    # Blocked destinations
    if hostname in BLOCKED_HOSTNAMES or hostname.endswith(".internal"):
        return False

    # Localhost only permitted if explicitly authorized for local CI testing
    if hostname in ("127.0.0.1", "localhost") and not allow_local_ci:
        return False

    # Normalize allowed hosts
    allowed_set = {h.lower().strip() for h in allowed_hosts if h.strip()}
    return hostname in allowed_set

