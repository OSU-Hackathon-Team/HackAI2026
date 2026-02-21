#!/bin/bash

# Function to kill all background processes
cleanup() {
    echo "Stopping backend and frontend..."
    kill $BACKEND_PID $FRONTEND_PID
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Setup Python Virtual Environment
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment and installing dependencies..."
source .venv/bin/activate
pip install -r requirements.txt

# Setup Frontend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting backend server..."
python3 backend/server.py &
BACKEND_PID=$!

echo "Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

# Wait for background processes to finish
wait $BACKEND_PID $FRONTEND_PID