#!/bin/bash
# Start the backend server
(cd server && npm run dev) &
SERVER_PID=$!

# Start the frontend dev server
(cd client && npm run dev) &
CLIENT_PID=$!

# Wait for either to exit
wait $SERVER_PID $CLIENT_PID
