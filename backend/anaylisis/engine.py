import os
import sys
import json
import logging
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Ensure we can import robust Async Client 
from google import genai
from google.genai import types

# Setup path to import backend modules securely from the parent level
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

# Ensure environmental variables are loaded so we can hit Supabase and OpenAI
load_dotenv(backend_dir / ".env")

# This will instantiate the Supabase logger via the existing client module
from supabase_client import supabase_logger

logger = logging.getLogger(__name__)


class InterviewAnalyzerEngine:
    """
    An asynchronous engine for processing an entire interview session, gathering 
    all keyframes from Supabase, and leveraging an LLM to generate an insightful 
    post-interview coaching report based on the provided analyzer_prompt.
    """
    def __init__(self, model: str = "models/gemini-3-flash-preview"):
        self.model = model
        self.prompt_path = backend_dir / "prompts" / "analyzer_prompt.txt"
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY environment variable is missing.")
            raise ValueError("GEMINI_API_KEY is required to initialize the Analyzer Engine.")
        
        self.client = genai.Client(api_key=api_key)
        
        # Ensures that the prompt file actually exists before we start anything
        if not self.prompt_path.exists():
            raise FileNotFoundError(f"Analyzer prompt file not found at {self.prompt_path}")
            
    async def fetch_session_keyframes(self, session_id: str, wait_for_metrics: bool = True) -> list[dict]:
        """
        Asynchronously fetch keyframes. If wait_for_metrics is True, it will poll 
        briefly to ensure background biometric tasks have flushed their data.
        """
        if not supabase_logger.supabase:
            logger.error("Supabase client is not connected.")
            raise RuntimeError("Supabase client not initialized")
        
        def _fetch_sync():
            return supabase_logger.supabase.table("interview_keyframes") \
                .select("*") \
                .eq("session_id", session_id) \
                .order("timestamp_sec") \
                .execute().data

        loop = asyncio.get_running_loop()
        
        # Max 15 retries (approx 15 seconds total)
        for attempt in range(15):
            keyframes = await loop.run_in_executor(None, _fetch_sync)
            
            # Check if we have any keyframes with actual biometric metrics
            has_metrics = any(k.get("keyframe_reason") == "Background Analysis" for k in keyframes)
            
            if not wait_for_metrics or has_metrics or not keyframes:
                if has_metrics:
                    print(f"[DEBUG] Analyzer Engine: Found metrics data for {session_id} on attempt {attempt+1}")
                break
                
            print(f"[DEBUG] Analyzer Engine: No metrics found yet for {session_id}. Retrying... ({attempt+1}/15)")
            await asyncio.sleep(1)
            
        return keyframes

    async def generate_report(self, session_id: str, interviewer_persona: str) -> str:
        """
        Gathers session data and performs standard async inferences to provide
        a complete markdown coach report. 
        """
        logger.info("Initializing comprehensive analysis. Since deep analysis takes time, please be patient...")
        
        keyframes = await self.fetch_session_keyframes(session_id)
        
        if not keyframes:
            logger.warning(f"No keyframes retrieved from Supabase for {session_id}. Cannot analyze.")
            return "No keyframe data found to analyze for this session. It might be empty or invalid."
            
        with open(self.prompt_path, "r", encoding="utf-8") as file:
            system_instruction = file.read()
            
        # Merge keyframes by timestamp to consolidate metrics and transcripts
        merged_keyframes = {}
        for k in keyframes:
            # Round to 1 decimal place to handle slight floating point drift
            ts = round(k.get("timestamp_sec", 0.0), 1)
            if ts not in merged_keyframes:
                merged_keyframes[ts] = k
            else:
                # Merge fields, preferring non-null values
                for key, value in k.items():
                    if value is not None:
                        merged_keyframes[ts][key] = value
        
        # Convert back to sorted list
        sorted_merged = [merged_keyframes[ts] for ts in sorted(merged_keyframes.keys())]
        
        print(f"[DEBUG] Analyzer Engine: Processed {len(keyframes)} raw keyframes into {len(sorted_merged)} merged snapshots.")
        if sorted_merged:
            print(f"[DEBUG] Sample Snapshot (T={sorted_merged[0].get('timestamp_sec')}): Gaze={sorted_merged[0].get('gaze_score')}, RMS={sorted_merged[0].get('volume_rms')}, Transcript={'Yes' if sorted_merged[0].get('associated_transcript') else 'No'}")

        # Format input cleanly as described in the strict analyzer_prompt.txt
        input_payload = {
            "interviewer_persona": interviewer_persona,
            "session_id": session_id,
            "keyframes": sorted_merged
        }
        
        ai_input_message = (
            "Here is the raw JSON data for the mock interview session:\n\n"
            f"{json.dumps(input_payload, indent=2)}"
        )
        
        try:
            # We enforce high precision analysis. temperature=0.3 helps stay grounded in the data 
            # while providing structured analysis matching the markdown requirements.
            print(f"[INFO] Sending {len(ai_input_message)} characters of session data to {self.model}...")
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=ai_input_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3, 
                    max_output_tokens=3000, # Providing plenty of runway for a detailed point-by-point breakdown
                )
            )
            
            report = response.text
            logger.info("Deep analysis successfully completed.")
            return report
            
        except Exception as e:
            logger.error(f"LLM request explicitly failed: {e}")
            raise


# Helper utility to run standalone functionality if triggered from CLI
async def async_main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    session_id = input("Enter the `session_id` to analyze: ").strip()
    persona = input("Enter Interviewer Persona (e.g., 'Aggressive System Design Lead'): ").strip()
    
    try:
        engine = InterviewAnalyzerEngine()
        report = await engine.generate_report(session_id, persona)
        
        print("\n" + "="*70)
        print("FINAL INTERVIEW ANALYSIS REPORT")
        print("="*70 + "\n")
        print(report)
        print("\n" + "="*70)
    except Exception as e:
        logger.error(f"Engine test execution failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(async_main())
    except KeyboardInterrupt:
        print("\nAnalysis engine interrupted by user.")
