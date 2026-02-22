import os
from dotenv import load_dotenv
from google import genai

load_dotenv("backend/.env")

def list_models():
    try:
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
        for m in client.models.list():
            print(m.name)
    except Exception as e:
        print("Error:", e)

list_models()
