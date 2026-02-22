import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import asyncio

load_dotenv("backend/.env")

async def test_model_audio(client, model_name):
    print(f"Testing {model_name} for audio...")
    try:
        response = await client.aio.models.generate_content(
            model=model_name,
            contents="Say hello professionally.",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"]
            )
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                print(f"  [SUCCESS] {model_name} returned audio data! Size: {len(part.inline_data.data)}")
                return True
        print(f"  [FAIL] {model_name} responded but no audio found.")
        return False
    except Exception as e:
        print(f"  [ERROR] {model_name}: {e}")
        return False

async def main():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
    models_to_test = [
        "models/gemini-3-flash-preview",
        "models/gemini-3-pro-preview",
        "models/gemini-3.1-pro-preview",
        "models/gemini-2.5-flash-native-audio-latest",
        "models/gemini-2.5-pro-preview-tts"
    ]
    for model in models_to_test:
        await test_model_audio(client, model)

asyncio.run(main())
