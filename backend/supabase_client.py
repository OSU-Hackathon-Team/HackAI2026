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

    def log_metrics(self, session_id: str, timestamp: float, gaze_score: float, fidget_index: float, confident: bool):
        """
        Asynchronously log video metrics to Supabase.
        """
        if not self.supabase:
            return

        try:
            data, count = self.supabase.table("interview_metrics").insert({
                "session_id": session_id,
                "timestamp_sec": timestamp,
                "gaze_score": gaze_score,
                "fidget_index": fidget_index,
                "is_confident": confident
            }).execute()
            # In a truly high-throughput system you might want to batch these or use async supabase,
            # but this provides the "fire-and-forget" functionality described in masterDoc.md.
        except Exception as e:
            logger.error(f"Failed to flush metrics to Supabase: {e}")

supabase_logger = SupabaseLogger()
