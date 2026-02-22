import os
import sys
from dotenv import load_dotenv

# Add backend to path to import supabase_client
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from supabase_client import supabase_logger

def deep_check():
    if not supabase_logger.supabase:
        print("Supabase not initialized.")
        return

    print("--- Checking keyframes for session_ids ---")
    try:
        res = supabase_logger.supabase.table("interview_keyframes").select("session_id").limit(5).execute()
        if res.data:
            sids = [d['session_id'] for d in res.data]
            print(f"Found session_ids in keyframes: {sids}")
            
            for sid in sids:
                print(f"Checking if {sid} exists in interview_sessions...")
                try:
                    sres = supabase_logger.supabase.table("interview_sessions").select("id").eq("id", sid).execute()
                    if sres.data:
                        print(f"MATCH FOUND: {sid} exists in interview_sessions.")
                    else:
                        print(f"MISSING: {sid} NOT found in interview_sessions.")
                except Exception as e:
                    print(f"Query for {sid} in interview_sessions failed: {e}")
        else:
            print("No keyframes found.")
    except Exception as e:
        print(f"Failed to query keyframes: {e}")

if __name__ == "__main__":
    deep_check()
