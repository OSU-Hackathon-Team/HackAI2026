import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def check_raw():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    
    # Try to query pg_tables (might fail if not exposed)
    r = httpx.get(f"{url}/rest/v1/pg_tables?select=tablename&schemaname=eq.public", headers=headers)
    if r.status_code == 200:
        print("Tables in public schema:")
        for t in r.json():
            print(t['tablename'])
    else:
        print(f"pg_tables query failed: {r.status_code}")
        print(r.text)

if __name__ == "__main__":
    check_raw()
