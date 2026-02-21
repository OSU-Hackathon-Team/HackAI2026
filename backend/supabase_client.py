import os
import importlib
from typing import Any, Optional
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class SupabaseLogger:
    def __init__(self):
        url: str = os.getenv("SUPABASE_URL", "")
        key: str = os.getenv("SUPABASE_KEY", "")
        
        if not url or not key:
            logger.warning("SUPABASE_URL or SUPABASE_KEY not found in environment variables. Real-time logging will be disabled.")
            self.supabase: Optional[Any] = None
        else:
            try:
                supabase_module = importlib.import_module("supabase")
                create_client = getattr(supabase_module, "create_client")
                self.supabase: Any = create_client(url, key)
                logger.info("Supabase client successfully initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.supabase = None

    def log_keyframe(self, session_id: str, timestamp_sec: float, **kwargs):
        """
        Asynchronously log keyframes to Supabase. Returns the logged data (including ID).
        """
        if not self.supabase:
            return None

        payload = {
            "session_id": session_id,
            "timestamp_sec": timestamp_sec,
        }
        payload.update(kwargs)
        print(f"[DEBUG] Supabase Insert Request: {payload}")

        try:
            response = self.supabase.table("interview_keyframes").insert(payload).execute()
            if response.data:
                print(f"[DEBUG] Supabase Insert Success: ID={response.data[0].get('id')}")
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to flush keyframe to Supabase: {e}")
            return None

    def update_keyframe(self, keyframe_id: str, **kwargs):
        """
        Update an existing keyframe with late-arriving metrics (e.g. from background tasks).
        """
        if not self.supabase or not keyframe_id:
            return

        try:
            self.supabase.table("interview_keyframes").update(kwargs).eq("id", keyframe_id).execute()
        except Exception as e:
            logger.error(f"Failed to update keyframe {keyframe_id}: {e}")

    def save_report(self, session_id: str, report_markdown: str):
        """
        Save the final coaching report to Supabase.
        """
        if not self.supabase:
            return
        
        try:
            self.supabase.table("interview_reports").upsert({
                "session_id": session_id,
                "report_markdown": report_markdown
            }).execute()
            logger.info(f"Report saved for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to save report: {e}")

    def get_report(self, session_id: str):
        """
        Retrieve the coaching report for a session.
        """
        if not self.supabase:
            return None
        
        try:
            response = self.supabase.table("interview_reports").select("*").eq("session_id", session_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to fetch report: {e}")
            return None

    def get_keyframes(self, session_id: str):
        """
        Retrieve all keyframes for a session, ordered by timestamp.
        """
        if not self.supabase:
            return []
        
        try:
            response = self.supabase.table("interview_keyframes")\
                .select("*")\
                .eq("session_id", session_id)\
                .order("timestamp_sec", desc=False)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Failed to fetch keyframes: {e}")
            return []

supabase_logger = SupabaseLogger()
