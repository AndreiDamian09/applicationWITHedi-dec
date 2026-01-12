#!/bin/bash
# Dissertation Registration Application Startup Script

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dissertation Registration App Startup${NC}"
echo -e "${BLUE}========================================${NC}"

# Start Backend
echo -e "\n${GREEN}Starting Backend Server...${NC}"
cd backend
npm install > /dev/null 2>&1
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created (update with your settings)"
fi
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}Backend PID: $BACKEND_PID${NC}"

# Wait for backend to start
sleep 3

# Start Frontend
echo -e "\n${GREEN}Starting Frontend Development Server...${NC}"
cd ../frontend
npm install > /dev/null 2>&1
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo ".env.local file created"
fi
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Backend running on http://localhost:8080${NC}"
echo -e "${GREEN}✓ Frontend running on http://localhost:5173${NC}"
echo -e "${BLUE}========================================${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
