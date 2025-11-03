# Running Momentum Contest Platform

This guide explains how to run the complete Momentum Contest platform with both the Next.js frontend/backend and the Go WebSocket service for real-time contests.

## Architecture Overview

The platform consists of three main components:

1. **Next.js Frontend + Backend** (Port 3000)
   - User authentication
   - Contest creation and management
   - Email invitations
   - Regular contest flow
   - Dashboard and UI

2. **Go WebSocket Service** (Port 8080)
   - Real-time quick_fire contests
   - WebSocket connections
   - Live multiplayer gameplay
   - Score tracking and leaderboard

3. **Database & Redis**
   - PostgreSQL for data persistence
   - Redis for real-time pub/sub (Go service)
   - Upstash Redis for caching (Next.js)

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Go** 1.23+
- **PostgreSQL** 12+
- **Redis** 6+ (for Go service)

## Setup Instructions

### 1. Environment Configuration

#### Next.js Environment (.env.local)

```bash
# Database
DATABASE_URL=your_postgres_connection_string

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_SENDER_NAME=Momentum App
EMAIL_SENDER_ADDRESS=your-email@gmail.com

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Go WebSocket Service Configuration
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
GO_WEBSOCKET_SERVICE_URL=http://localhost:8080

# JWT Secret for WebSocket Authentication
# CRITICAL: This MUST match JWT_SECRET in Go service
QUIZ_JWT_SECRET=momentum-contest-jwt-secret-2024-change-in-production
```

#### Go Service Environment (webSocket/.env)

```bash
# Server Configuration
PORT=8080

# Database (use same as Next.js)
DATABASE_URL=your_postgres_connection_string

# Redis Configuration (local Redis for pub/sub)
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
# CRITICAL: This MUST match QUIZ_JWT_SECRET in Next.js
JWT_SECRET=momentum-contest-jwt-secret-2024-change-in-production

# Game Configuration
QUESTION_TIMER=15    # Seconds per question
MAX_PLAYERS=6        # Maximum players per contest
```

### 2. Database Setup

The Go service uses the same PostgreSQL database as Next.js. Run the schema:

```bash
# Navigate to webSocket directory
cd webSocket

# Run the schema (if not already done)
psql -U postgres -d your_database -f schema.sql
```

### 3. Install Dependencies

#### Next.js Application

```bash
# From root directory
pnpm install
```

#### Go WebSocket Service

```bash
# Navigate to webSocket directory
cd webSocket

# Download Go dependencies
go mod download
```

### 4. Start Services

You need to run THREE services simultaneously:

#### Terminal 1: Redis Server

```bash
# Start Redis (required for Go service)
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest
```

#### Terminal 2: Go WebSocket Service

```bash
# Navigate to webSocket directory
cd webSocket

# Run the Go service
go run ./cmd/server/main.go

# Or build and run
go build -o server ./cmd/server
server.exe
```

The Go service will start on **http://localhost:8080**

#### Terminal 3: Next.js Application

```bash
# From root directory
pnpm dev
```

The Next.js app will start on **http://localhost:3000**

## Contest Flow

### Quick Fire (Real-Time) Contests

1. **Create Contest**: User creates a contest with `contestType: "quick_fire"`
2. **Join Lobby**: Users navigate to `/dashboard/contest/[id]/lobby`
3. **Start Game**: Clicking "Start Contest" calls `/api/contest/create-realtime`
4. **API Flow**:
   - Next.js calls Go service `/api/contests` to create real-time contest
   - Go service returns contest ID and WebSocket URL
   - Frontend redirects to `/dashboard/contest/[contestId]/game`
5. **WebSocket Connection**:
   - Frontend calls `/api/contest/token` to get JWT from Go service
   - WebSocket connects to `ws://localhost:8080/ws/contests/[contestId]?token=jwt`
6. **Gameplay**:
   - Host sends `START_GAME` message
   - Players receive questions via WebSocket
   - Players submit answers with `SUBMIT_ANSWER` message
   - First correct answer wins points (speed-based scoring)
   - Real-time scoreboard updates
7. **Game Over**: Final results sent via WebSocket, redirect to leaderboard

### Standard Contests

1. **Create Contest**: User creates a contest with `contestType: "standard"`
2. **Join**: Users navigate to contest page
3. **Take Quiz**: Timed quiz with all questions at once
4. **Submit**: Submit all answers at end
5. **Results**: View after contest end date

## API Endpoints

### Next.js APIs

- `POST /api/contest/create-realtime` - Create real-time contest via Go service
- `POST /api/contest/token` - Get JWT token for WebSocket auth
- `POST /api/contest/go-login` - Login to Go service (alternative)

### Go Service APIs

- `POST /login` - Authenticate and get JWT token
- `POST /api/contests` - Create a new contest room
- `GET /ws/contests/{contestID}` - WebSocket endpoint for game
- `GET /health` - Health check

## WebSocket Message Protocol

### Client → Server

```json
// Start game (host only)
{ "type": "START_GAME" }

// Submit answer
{
  "type": "SUBMIT_ANSWER",
  "question_id": "q123",
  "answer": "Paris"
}
```

### Server → Client

```json
// Player joined
{
  "type": "PLAYER_JOINED",
  "payload": {
    "user_id": "user123",
    "username": "player1",
    "is_host": false,
    "player_count": 3,
    "players": [...]
  }
}

// New question
{
  "type": "NEW_QUESTION",
  "payload": {
    "question_number": 1,
    "total_questions": 10,
    "question_id": "q123",
    "question_text": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "timer": 15
  }
}

// Answer result (personal)
{
  "type": "ANSWER_RESULT",
  "payload": {
    "question_id": "q123",
    "is_correct": true,
    "correct_answer": "Paris",
    "points_awarded": 850,
    "time_taken": 2.5,
    "new_score": 1700
  }
}

// Score update (broadcast)
{
  "type": "SCORE_UPDATE",
  "payload": {
    "user_id": "user123",
    "username": "player1",
    "score": 1700,
    "points_earned": 850
  }
}

// Game over
{
  "type": "GAME_OVER",
  "payload": {
    "message": "Contest finished!",
    "final_scoreboard": [...],
    "questions": [...]
  }
}
```

## Testing

### Test Real-Time Contest

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Go service
cd webSocket
go run ./cmd/server/main.go

# Terminal 3: Start Next.js
pnpm dev

# Browser: Navigate to
http://localhost:3000/dashboard/leaderboard
# Create a quick_fire contest and test!
```

### Automated Testing (Go Service)

```bash
cd webSocket

# Node.js test script
node test_contest.js --auto

# Python test script
python test_contest.py --auto

# Bash test script
./test_contest.sh
```

## Troubleshooting

### Issue: WebSocket connection fails

**Solution**: 
- Ensure Go service is running on port 8080
- Check `NEXT_PUBLIC_WEBSOCKET_URL` in `.env.local`
- Verify JWT secrets match in both services

### Issue: Authentication fails

**Solution**:
- Verify `QUIZ_JWT_SECRET` matches `JWT_SECRET` in Go service
- Check token generation in `/api/contest/token`
- Ensure user is logged into Next.js app

### Issue: Redis connection error

**Solution**:
- Start Redis: `redis-server`
- Check Redis connection: `redis-cli ping` (should return PONG)
- Verify `REDIS_ADDR` in Go service `.env`

### Issue: Database connection error

**Solution**:
- Ensure same `DATABASE_URL` in both services
- Run migrations: `cd webSocket && psql -U postgres -d your_db -f schema.sql`
- Check database is accessible

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` / `QUIZ_JWT_SECRET` to strong random values
- [ ] Use environment variables for all secrets
- [ ] Enable PostgreSQL SSL mode
- [ ] Set up Redis authentication
- [ ] Configure proper CORS in Go service
- [ ] Use HTTPS/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting

### Deployment Options

#### Option 1: Separate Services

- Deploy Next.js to Vercel/Netlify
- Deploy Go service to AWS/GCP/DigitalOcean
- Use managed PostgreSQL (Neon, Supabase)
- Use managed Redis (Upstash, Redis Cloud)

#### Option 2: Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_WEBSOCKET_URL=ws://go-service:8080
      
  go-service:
    build: ./webSocket
    ports:
      - "8080:8080"
    depends_on:
      - redis
      - postgres
      
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
      
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=contest_db
      - POSTGRES_PASSWORD=yourpassword
```

## Support

For issues or questions:
1. Check the logs in both services
2. Verify environment variables are set correctly
3. Ensure all services are running
4. Check the README files in both directories

Happy Coding! 🎉
