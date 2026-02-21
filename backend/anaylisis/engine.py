import os
import sys
import json
import logging
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Ensure we can import robust Async Client 
from openai import AsyncOpenAI

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
    def __init__(self, model: str = "gpt-4o"):
        self.model = model
        self.prompt_path = backend_dir / "prompts" / "analyzer_prompt.txt"
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.error("OPENAI_API_KEY environment variable is missing.")
            raise ValueError("OPENAI_API_KEY is required to initialize the Analyzer Engine.")
        
        self.client = AsyncOpenAI(api_key=api_key)
        
        # Ensures that the prompt file actually exists before we start anything
        if not self.prompt_path.exists():
            raise FileNotFoundError(f"Analyzer prompt file not found at {self.prompt_path}")
            
    async def fetch_session_keyframes(self, session_id: str) -> list[dict]:
        """
        Asynchronously fetch the entire set of keyframes for a specific interview session.
        Sorts them chronologically.
        """
        if not supabase_logger.supabase:
            logger.error("Supabase client is not connected. Check environment variables.")
            raise RuntimeError("Supabase client not initialized")
        
        # The Supabase Python SDK defaults to synchronous HTTP requests
        # We run it in a thread pool executor to make the engine purely non-blocking
        def _fetch_sync():
            try:
                response = supabase_logger.supabase.table("interview_keyframes") \
                    .select("*") \
                    .eq("session_id", session_id) \
                    .order("timestamp_sec") \
                    .execute()
                return response.data
            except Exception as e:
                logger.error(f"Database fetch failed for session {session_id}: {e}")
                raise e

        logger.info(f"Fetching interview keyframes for session_id: '{session_id}'...")
        loop = asyncio.get_running_loop()
        keyframes = await loop.run_in_executor(None, _fetch_sync)
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
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": ai_input_message}
                ],
                temperature=0.3, 
                max_tokens=3000, # Providing plenty of runway for a detailed point-by-point breakdown
            )
            
            report = response.choices[0].message.content
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
