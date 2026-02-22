import os
from google import genai
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_key = os.environ.get('GEMINI_API_KEY')

client = genai.Client(api_key=api_key)
for m in client.models.list():
    if 'tts' in m.name.lower():
        print(f"Name: {m.name}, Actions: {m.supported_actions}")
