#!/bin/bash

# Script to start the backend server
# Usage: ./start-backend.sh

echo "Starting Pixel Library Backend Server..."
echo ""

cd "$(dirname "$0")/backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found!"
  echo "   Please create a .env file with the following variables:"
  echo "   - DATABASE_URL"
  echo "   - SUPABASE_URL"
  echo "   - SUPABASE_ANON_KEY"
  echo "   - SUPABASE_SERVICE_ROLE_KEY (optional)"
  echo ""
fi

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "Your local IP address: $LOCAL_IP"
echo "   Update mobile/.env with: EXPO_PUBLIC_BACKEND_URL=http://$LOCAL_IP:4040"
echo ""
echo "Starting server on port 4040..."
echo ""

npm start
