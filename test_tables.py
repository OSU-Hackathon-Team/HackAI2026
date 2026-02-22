import os
import sys
from dotenv import load_dotenv

# Add backend to path to import supabase_client
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from supabase_client import supabase_logger

def list_tables():
    if not supabase_logger.supabase:
        print("Supabase not initialized.")
        return

    # In Supabase/Postgrest, we can query information_schema for table names
    # Note: select("*") on a special table might be restricted, but let's try a simple query
    try:
        # A common way to get table list if the standard select doesn't work
        res = supabase_logger.supabase.table("interview_reports").select("session_id").limit(1).execute()
        print("Successfully queried interview_reports.")
    except Exception as e:
        print(f"Failed to query interview_reports: {e}")

    try:
        res = supabase_logger.supabase.table("interview_keyframes").select("id").limit(1).execute()
        print("Successfully queried interview_keyframes.")
    except Exception as e:
        print(f"Failed to query interview_keyframes: {e}")

    try:
        res = supabase_logger.supabase.table("interview_sessions").select("id").limit(1).execute()
        print("Successfully queried interview_sessions.")
    except Exception as e:
        print(f"Failed to query interview_sessions: {e}")

if __name__ == "__main__":
    list_tables()
