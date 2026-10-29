import pytest
from src.safety.allowlist import is_target_host_allowed

def test_allowed_host_passes():
    allowed = ["staging.app.local", "uat.mycompany.com"]
    assert is_target_host_allowed("https://staging.app.local/login", allowed) is True
    assert is_target_host_allowed("https://uat.mycompany.com/checkout", allowed) is True

def test_unregistered_host_fails():
    allowed = ["staging.app.local"]
    assert is_target_host_allowed("https://evil.com/phishing", allowed) is False
    assert is_target_host_allowed("https://production.app.com", allowed) is False

def test_metadata_service_blocked():
    allowed = ["169.254.169.254"]
    assert is_target_host_allowed("http://169.254.169.254/latest/meta-data/", allowed) is False

def test_localhost_blocked_by_default_unless_ci_flagged():
    allowed = ["localhost"]
    assert is_target_host_allowed("http://localhost:8080", allowed, allow_local_ci=False) is False
    assert is_target_host_allowed("http://localhost:8080", allowed, allow_local_ci=True) is True

