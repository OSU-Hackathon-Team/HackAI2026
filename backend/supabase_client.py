import os
from supabase import create_client, Client
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
            self.supabase: Client = None
        else:
            try:
                self.supabase: Client = create_client(url, key)
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

        try:
            response = self.supabase.table("interview_keyframes").insert(payload).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to flush keyframe to Supabase: {e}")
            return None

    def update_keyframe(self, keyframe_id: int, **kwargs):
        """
        Update an existing keyframe with late-arriving metrics (e.g. from background tasks).
        """
        if not self.supabase or not keyframe_id:
            return

        try:
            self.supabase.table("interview_keyframes").update(kwargs).eq("id", keyframe_id).execute()
        except Exception as e:
            logger.error(f"Failed to update keyframe {keyframe_id}: {e}")

supabase_logger = SupabaseLogger()
