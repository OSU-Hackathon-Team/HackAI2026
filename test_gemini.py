import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import asyncio

load_dotenv("backend/.env")

async def test_gemini():
    print("Testing gemini client...")
    try:
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
        print("Client created.")
        response = await client.aio.models.generate_content(
            model="models/gemini-2.0-flash-001",
            contents="Say hello professionally.",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                system_instruction="You are a voice actor."
            )
        )
        print("Response text:", response.text)
        print("Response text:", response.text)
        audio_found = False
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                print("Audio data found! Size:", len(part.inline_data.data))
                audio_found = True
        if not audio_found:
            print("No audio data found in response parts.")
    except Exception as e:
        print("Caught Exception:", type(e), str(e))
        import traceback
        traceback.print_exc()

asyncio.run(test_gemini())
