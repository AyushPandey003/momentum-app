# Momentum Contest Platform - Quick Setup Guide

This guide will help you set up and run the Momentum Contest platform quickly.

## Quick Start (5 minutes)

### Step 1: Install Prerequisites

```bash
# Install Redis (Windows - using Chocolatey)
choco install redis-64

# OR use Docker
docker run -d -p 6379:6379 redis:latest

# Verify installations
node --version    # Should be 18+
go version        # Should be 1.23+
redis-cli ping    # Should return PONG
```

### Step 2: Configure Environment

1. Copy `.env.example` to `.env.local` in root directory
2. Copy `webSocket/.env.example` to `webSocket/.env`
3. **IMPORTANT**: Ensure `QUIZ_JWT_SECRET` in `.env.local` matches `JWT_SECRET` in `webSocket/.env`

```bash
# Root .env.local
QUIZ_JWT_SECRET=momentum-contest-jwt-secret-2024-change-in-production
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
GO_WEBSOCKET_SERVICE_URL=http://localhost:8080

# webSocket/.env
JWT_SECRET=momentum-contest-jwt-secret-2024-change-in-production
PORT=8080
```

### Step 3: Install Dependencies

```bash
# Install Next.js dependencies
pnpm install

# Install Go dependencies
cd webSocket
go mod download
cd ..
```

### Step 4: Setup Database

```bash
# The Go service uses the same database as Next.js
# Run the schema
cd webSocket
# Replace with your actual database connection
psql -U postgres -d your_database -f schema.sql
cd ..
```

### Step 5: Start Services

**Option A: Automatic (Windows)**

```cmd
start-services.bat
```

**Option B: Manual**

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Go Service
cd webSocket
go run ./cmd/server/main.go

# Terminal 3: Next.js
pnpm dev
```

## Verify Installation

1. Open http://localhost:3000
2. Login with your account
3. Navigate to Dashboard → Leaderboard
4. Click "Create Contest"
5. Set Contest Type to "Quick Fire"
6. Click "Start Contest"
7. If WebSocket connects successfully, you're all set! ✓

## Common Issues

### Issue: "Failed to connect to game server"

**Cause**: Go service not running or wrong URL

**Fix**:
```bash
# Check if Go service is running
curl http://localhost:8080/health

# Should return: {"status":"healthy","active_contests":0}

# If not, start the Go service
cd webSocket
go run ./cmd/server/main.go
```

### Issue: "Failed to authenticate with contest service"

**Cause**: JWT secrets don't match

**Fix**:
1. Open `.env.local` and find `QUIZ_JWT_SECRET`
2. Open `webSocket/.env` and find `JWT_SECRET`
3. Make sure they are EXACTLY the same
4. Restart both services

### Issue: Redis connection error

**Cause**: Redis not running

**Fix**:
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis
redis-server

# OR with Docker
docker run -d -p 6379:6379 redis:latest
```

## Testing Real-Time Contests

### Quick Test

1. Open http://localhost:3000/dashboard/leaderboard
2. Click "Create Contest"
3. Fill in:
   - Name: "Test Contest"
   - Contest Type: "Quick Fire"
   - Difficulty: "Medium"
   - Questions: 5
4. Click "Create"
5. Click "Start Contest"
6. You should see the waiting room
7. Open another browser/incognito window
8. Login with different account
9. Join the same contest
10. Click "Start Game" (as host)
11. Both players should see questions!

### Automated Test

```bash
cd webSocket

# Node.js test (recommended)
node test_contest.js --auto

# Python test
python test_contest.py --auto

# Bash test
./test_contest.sh
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Port 3000)                      │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Dashboard   │  │   Lobby     │  │   Game (WS)      │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Backend (Port 3000)                     │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  /api/contest/token  │  │ /api/contest/create  │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Go WebSocket Service (Port 8080)                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   /login     │  │ /api/contests│ │/ws/contests/{id} │   │
│  └──────────────┘  └─────────────┘  └──────────────────┘   │
│                            │                                 │
│                     ┌──────┴──────┐                         │
│                     ▼             ▼                          │
│              ┌──────────┐  ┌──────────┐                     │
│              │PostgreSQL│  │  Redis   │                     │
│              └──────────┘  └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Features

✅ **Real-Time Multiplayer**: Up to 6 players compete simultaneously
✅ **Speed-Based Scoring**: Faster correct answers = more points
✅ **Live Updates**: See scores update in real-time
✅ **Instant Progression**: First correct answer moves everyone forward
✅ **WebSocket Communication**: Low-latency bidirectional communication
✅ **Horizontal Scaling**: Redis Pub/Sub for multiple server instances
✅ **JWT Authentication**: Secure authentication for all endpoints

## Next Steps

- [ ] Add more questions to the database
- [ ] Customize scoring algorithm
- [ ] Add achievements and badges
- [ ] Implement contest categories
- [ ] Add replay functionality
- [ ] Set up production deployment

## Need Help?

- Check `RUNNING_SERVICES.md` for detailed documentation
- Review Go service README: `webSocket/README.md`
- Check logs in terminal windows
- Verify all environment variables are set

Happy Coding! 🚀
