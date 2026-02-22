import os
import base64
import json
from dotenv import load_dotenv

load_dotenv()

def decode_jwt():
    key = os.getenv("SUPABASE_KEY")
    if not key:
        print("No key found.")
        return
    
    parts = key.split('.')
    if len(parts) != 3:
        print("Invalid JWT format.")
        return
    
    payload = parts[1]
    # Add padding if needed
    payload += '=' * (4 - len(payload) % 4)
    decoded = base64.b64decode(payload).decode('utf-8')
    print(f"JWT Payload: {decoded}")

if __name__ == "__main__":
    decode_jwt()
