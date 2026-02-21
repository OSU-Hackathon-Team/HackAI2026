source .venv/bin/activate
python3 backend/server.py --port 8081 &
SERVER_PID=$!
sleep 5
python3 backend/test.py --server "http://localhost:8081/api/offer"
kill $SERVER_PID
