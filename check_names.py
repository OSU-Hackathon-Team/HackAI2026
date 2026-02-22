import os
import sys
from dotenv import load_dotenv

# Add backend to path to import supabase_client
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from supabase_client import supabase_logger

def check_names():
    if not supabase_logger.supabase:
        print("Supabase not initialized.")
        return

    names = ["interview_sessions", "interview_session", "session", "sessions", "interview_metadata"]
    for name in names:
        try:
            res = supabase_logger.supabase.table(name).select("id").limit(1).execute()
            print(f"SUCCESS: Table '{name}' found.")
        except Exception as e:
            print(f"FAILED: Table '{name}' not found: {e}")

if __name__ == "__main__":
    check_names()
