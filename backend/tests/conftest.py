import pytest
import requests
import os

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def base_url():
    """Get backend URL from environment"""
    # Try multiple env vars for backend URL
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or os.environ.get('EXPO_BACKEND_URL')
    
    # If not in env, try loading from frontend/.env
    if not url:
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                        url = line.split('=', 1)[1].strip()
                        break
        except:
            pass
    
    if not url:
        pytest.skip("Backend URL not configured")
    return url.rstrip('/')
