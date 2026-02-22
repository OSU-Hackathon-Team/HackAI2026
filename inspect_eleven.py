from elevenlabs.client import ElevenLabs
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("ELEVENLABS_API_KEY")
client = ElevenLabs(api_key=api_key)
print("Client methods:", dir(client))
if hasattr(client, 'voices'):
    voices = client.voices.get_all()
    print("Voices found:")
    for v in voices.voices:
        print(f" - {v.name}: {v.voice_id}")
