#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Backend API on port 3001..."
cd "$DIR/backend" && node server.js &
BACKEND_PID=$!

echo "Starting React Admin Panel on port 3000..."
cd "$DIR/admin" && npm run dev -- --host &
ADMIN_PID=$!

echo "Systems started. Press Ctrl+C to stop."
echo "Wait a moment, then open http://localhost:3000 for the Admin Dashboard"

trap "kill $BACKEND_PID $ADMIN_PID" EXIT
wait
