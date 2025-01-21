from cryptography.fernet import Fernet
import json
import hashlib
from pathlib import Path

class SecureStorage:
    def __init__(self, storage_path='app/data'):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)
        self.key_file = self.storage_path / '.key'
        self.key = self._get_or_create_key()
        self.cipher_suite = Fernet(self.key)
    
    def _get_or_create_key(self):
        """Încarcă cheia existentă sau generează una nouă"""
        try:
            with open(self.key_file, 'rb') as f:
                return f.read()
        except FileNotFoundError:
            key = Fernet.generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key)
            return key
    
    def store_data(self, data, identifier):
        """Stochează date criptate"""
        # Convertește datele în JSON dacă e dicționar
        if isinstance(data, dict):
            data = json.dumps(data)
        
        # Criptează datele
        encrypted_data = self.cipher_suite.encrypt(data.encode())
        
        # Creează un nume de fișier bazat pe hash
        file_name = hashlib.sha256(identifier.encode()).hexdigest()[:12]
        
        # Salvează datele criptate
        with open(self.storage_path / f"{file_name}.bin", 'wb') as f:
            f.write(encrypted_data)
    
    def get_data(self, identifier):
        """Recuperează și decriptează date"""
        file_name = hashlib.sha256(identifier.encode()).hexdigest()[:12]
        try:
            # Citește datele criptate
            with open(self.storage_path / f"{file_name}.bin", 'rb') as f:
                encrypted_data = f.read()
            
            # Decriptează datele
            decrypted_data = self.cipher_suite.decrypt(encrypted_data).decode()
            
            # Încearcă să convertească în JSON dacă e posibil
            try:
                return json.loads(decrypted_data)
            except json.JSONDecodeError:
                return decrypted_data
                
        except FileNotFoundError:
            return None

