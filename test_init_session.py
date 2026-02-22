import requests

url = "http://127.0.0.1:8081/api/init-session"
files = {
    'resume': ('resume.txt', b'Test resume content'),
}
data = {
    'job_description': 'Test job description',
    'role': 'Software Engineer',
    'company': 'AceIt'
}

print("Sending request to server...")
try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
