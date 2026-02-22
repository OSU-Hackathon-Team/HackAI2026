import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def test_model():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
    
    print("Listing available models:")
    try:
        models = client.models.list()
        for m in models:
            print(f"- {m.name} ({m.display_name})")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    asyncio.run(test_model())
