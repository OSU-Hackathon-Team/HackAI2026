import requests
import json

url = "http://127.0.0.1:8081/api/tts"
data = {"text": "Hello, this is a test of the text to speech system."}

print(f"Testing TTS endpoint at {url}...")
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        with open("test_tts_output.wav", "wb") as f:
            f.write(response.content)
        print("Success! Audio saved to test_tts_output.wav")
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
