#!/bin/bash

# Function to kill all background processes
cleanup() {
    echo "Stopping backend and frontend..."
    kill $BACKEND_PID $FRONTEND_PID
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "Starting backend server..."
python3 backend/server.py &
BACKEND_PID=$!

echo "Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

# Wait for background processes to finish
wait $BACKEND_PID $FRONTEND_PID