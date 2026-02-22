import os
import httpx
from dotenv import load_dotenv

load_dotenv()

def probe_existence():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    
    # Try to insert a report with a random session_id
    # If the table interview_sessions exists, this should fail with a Foreign Key Violation error.
    # If the table interview_sessions DOES NOT exist, it will likely fail with a different error (or if FK is missing, it might succeed!)
    
    payload = {
        "session_id": "probe-random-id-12345",
        "report_markdown": "test probe"
    }
    
    r = httpx.post(f"{url}/rest/v1/interview_reports", headers=headers, json=payload)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    probe_existence()
