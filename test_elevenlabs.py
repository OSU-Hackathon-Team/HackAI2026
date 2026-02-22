import requests
import json

url = "http://127.0.0.1:8080/api/tts"
payload = {"text": "Hello, this is a test of the ElevenLabs TTS integration."}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    if response.status_code == 200:
        with open("test_tts.mp3", "wb") as f:
            f.write(response.content)
        print("TTS test successful. Saved to test_tts.mp3")
    else:
        print(f"TTS test failed: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Error during TTS test: {e}")
