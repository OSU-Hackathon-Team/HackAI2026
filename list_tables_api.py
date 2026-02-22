import os
import sys
from dotenv import load_dotenv

# Add backend to path to import supabase_client
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from supabase_client import supabase_logger

def list_all_tables():
    if not supabase_logger.supabase:
        print("Supabase not initialized.")
        return

    try:
        # Querying the list of tables from Postgres directly
        # We use rpc or raw query if possible, but select from a system table might work
        res = supabase_logger.supabase.table("interview_reports").select("session_id").limit(1).execute()
        print("interview_reports table confirmed.")
    except Exception as e:
        print(f"interview_reports check failed: {e}")

    try:
        # Try a different name?
        res = supabase_logger.supabase.table("sessions").select("id").limit(1).execute()
        print("Found table 'sessions'")
    except Exception as e:
        print(f"Check for 'sessions' failed: {e}")

    # Let's try to get ALL tables in the schema
    # Using postgrest, we can't easily query information_schema unless it's exposed.
    # But we can try to hit the root endpoint to see the OpenAPI spec if we had httpx
    import httpx
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    r = httpx.get(f"{url}/rest/v1/", headers=headers)
    if r.status_code == 200:
        import json
        spec = r.json()
        print("Tables found in OpenAPI spec:")
        for path in spec.get("paths", {}):
            if path.startswith("/"):
                print(path)
    else:
        print(f"Failed to get OpenAPI spec: {r.status_code}")

if __name__ == "__main__":
    list_all_tables()
