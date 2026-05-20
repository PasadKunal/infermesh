from cryptography.fernet import Fernet
from app.core.config import settings
import base64
import hashlib

def get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if not key:
        derived = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(derived).decode()
    return Fernet(key.encode())

def encrypt(value: str) -> str:
    f = get_fernet()
    return f.encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    f = get_fernet()
    return f.decrypt(value.encode()).decode()
