import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

def check_columns():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept-Profile": "public"}
    
    # Postgrest allows checking columns via a HEAD request or a limited SELECT
    # But hitting the root / defines the tables.
    
    # Let's try to check another schema? Maybe it's in a different schema?
    # Default is public.
    
    # Try to see if there are ANY other tables
    r = httpx.get(f"{url}/rest/v1/", headers=headers)
    if r.status_code == 200:
        spec = r.json()
        print("Definitions found:")
        for name in spec.get("definitions", {}):
            print(name)
    else:
        print(f"Failed: {r.status_code}")

if __name__ == "__main__":
    check_columns()
