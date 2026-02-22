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

    def ensure_session_exists(self, session_id: str, role: str = "Software Engineer", company: str = "AceIt"):
        """
        Ensures a session row exists in interview_sessions.
        """
        if not self.supabase:
            return
        try:
            # Use upsert to create or ignore
            print(f"[DEBUG] Ensuring session exists: {session_id}")
            self.supabase.table("interview_sessions").upsert({
                "id": session_id,
                "role": role,
                "company": company
            }, on_conflict="id").execute()
        except Exception as e:
            logger.warning(f"Could not ensure session existence for {session_id}: {e}")

    def log_keyframe(self, session_id: str, timestamp_sec: float, **kwargs):
        """
        Asynchronously log keyframes to Supabase. Returns the logged data (including ID).
        """
        if not self.supabase:
            return None

        # Ensure parent session exists to avoid foreign key errors
        self.ensure_session_exists(session_id)

        try:
            # Check if a keyframe for this exact session_id and timestamp_sec exists
            existing = self.supabase.table("interview_keyframes").select("id, keyframe_reason").eq("session_id", session_id).eq("timestamp_sec", float(timestamp_sec)).execute()
            
            payload = {
                "session_id": session_id,
                "timestamp_sec": timestamp_sec,
            }
            # Defensive casting for common JSON serialization issues (e.g. numpy bools/floats)
            for k, v in kwargs.items():
                if hasattr(v, 'item'): # Handle numpy types (both bools and numbers)
                    payload[k] = v.item()
                elif isinstance(v, (bool, int, float, str)) or v is None:
                    payload[k] = v
                else:
                    payload[k] = v # Fallback

            if existing.data:
                # Update existing record
                keyframe_id = existing.data[0]["id"]
                existing_reason = existing.data[0].get("keyframe_reason")
                
                # Avoid overwriting a descriptive AI label with the generic Background Analysis label
                if existing_reason and "AI Turn" in existing_reason and payload.get("keyframe_reason") == "Background Analysis":
                    del payload["keyframe_reason"]
                    
                print(f"[DEBUG] Supabase Update Request (Merging): ID={keyframe_id}, Payload={payload}")
                response = self.supabase.table("interview_keyframes").update(payload).eq("id", keyframe_id).execute()
                return response.data[0] if response.data else None
            else:
                print(f"[DEBUG] Supabase Insert Request: {payload}")
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

    def save_session_metadata(self, session_id: str, role: str, company: str, user_id: str = None, **kwargs):
        """
        Save or update session-level metadata (role, company, user_id, scores).
        """
        if not self.supabase:
            return
        
        from datetime import datetime
        try:
            payload = {
                "id": session_id,
                "role": role,
                "company": company,
            }
            if user_id:
                payload["user_id"] = user_id
            
            # Add any extra metrics
            for k in ["score", "gaze", "confidence", "composure", "spikes", "date"]:
                if k in kwargs:
                    payload[k] = kwargs[k]
            
            if "date" not in payload:
                payload["date"] = datetime.now().strftime("%b %d, %Y")

            print(f"[DEBUG] Supabase Session Upsert: {payload}")
            self.supabase.table("interview_sessions").upsert(payload).execute()
            logger.info(f"Metadata saved for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to save session metadata: {e}")

    def get_user_sessions(self, user_id: str):
        """
        Retrieve all sessions for a specific user.
        """
        if not self.supabase:
            return []
        
        try:
            response = self.supabase.table("interview_sessions")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Failed to fetch user sessions: {e}")
            return []

    def get_session_metadata(self, session_id: str):
        """
        Retrieve session metadata.
        """
        if not self.supabase:
            return None
        
        try:
            response = self.supabase.table("interview_sessions").select("*").eq("id", session_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to fetch session metadata: {e}")
            return None

    def save_resume(self, user_id: str, resume_text: str, filename: str = None):
        """
        Save extracted resume text to user_resumes table.
        """
        if not self.supabase or not user_id:
            return None
        
        try:
            payload = {
                "user_id": user_id,
                "resume_text": resume_text,
                "filename": filename
            }
            # We don't use upsert here because users might want a history of resumes, 
            # though the frontend will mostly look for the latest one.
            response = self.supabase.table("user_resumes").insert(payload).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to save resume for user {user_id}: {e}")
            return None

    def get_latest_resume(self, user_id: str):
        """
        Retrieve the most recently uploaded resume text for a user.
        """
        if not self.supabase or not user_id:
            return None
        
        try:
            response = self.supabase.table("user_resumes")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to fetch latest resume for user {user_id}: {e}")
            return None

supabase_logger = SupabaseLogger()
