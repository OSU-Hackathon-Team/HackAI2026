import os
import sys
from dotenv import load_dotenv

# Add backend to path to import supabase_client
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from supabase_client import supabase_logger

def check_db():
    if not supabase_logger.supabase:
        print("Supabase not initialized.")
        return

    print("--- Interview Sessions ---")
    sessions = supabase_logger.supabase.table("interview_sessions").select("*").execute()
    print(f"Total sessions: {len(sessions.data)}")
    for s in sessions.data[:5]:
        print(s)

    print("\n--- Interview Keyframes ---")
    keyframes = supabase_logger.supabase.table("interview_keyframes").select("id, session_id").limit(10).execute()
    print(f"Found {len(keyframes.data)} keyframes (limited to 10)")
    for k in keyframes.data:
        print(k)

    print("\n--- Interview Reports ---")
    reports = supabase_logger.supabase.table("interview_reports").select("*").execute()
    print(f"Total reports: {len(reports.data)}")

if __name__ == "__main__":
    check_db()
