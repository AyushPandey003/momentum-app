# 🚀 Momentum Contest Platform

A modern, real-time competitive quiz platform with gamification, built with Next.js, Go, PostgreSQL, and Redis.

## 📚 Documentation

- **[Contest Flow Guide](./CONTEST_FLOW.md)** - Complete contest system flow with diagrams
- **[Quick Start](./QUICK_START.md)** - Get started quickly
- **[Running Services](./RUNNING_SERVICES.md)** - Service setup and management
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - Integrate with existing apps

## ✨ Features

### 🎯 Contest System
- **Private Contests** - Invite-only contests with email invitations
- **Waiting Room** - Real-time lobby before contest starts
- **Live Competition** - Compete with friends simultaneously
- **Email Invitations** - Send invites to up to 4 friends (5 total with organizer)
- **Access Control** - Only invited users can join contests

### 🏆 Real-Time Gameplay
- WebSocket-powered live updates
- Real-time leaderboard
- Speed-based scoring
- Instant answer validation
- Live participant status updates

### 📧 Invitation Flow
1. Organizer creates contest on leaderboard page
2. Enters friend email addresses (max 4)
3. Friends receive styled invitation emails
4. Click invite link → Login/Signup → Join waiting room
5. Organizer starts contest when ready
6. Everyone competes simultaneously
7. View final results and rankings

### 🎮 Gamification
- XP and level progression
- Achievement system
- Daily challenges
- Streak tracking
- Leaderboards

### 📧 Social Features
- Email contest invitations
- Share contests with friends
- Track participant progress
- Contest notifications

### 🛠️ Technical Features
- Horizontal scalability with Redis Pub/Sub
- JWT authentication
- PostgreSQL for persistence
- Upstash Redis for caching
- Better Auth for user management
- Gmail integration for emails

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │  ← User Interface, Auth, Regular Contests
│   (Port 3000)   │
└────────┬────────┘
         │
         ├─────────────────────┬─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────┐   ┌─────────────────┐
│  Go WebSocket   │   │ PostgreSQL  │   │ Email Service   │
│  Service        │   │             │   │ (Backend Folder)│
│  (Port 8080)    │   │ (Shared DB) │   │                 │
└────────┬────────┘   └─────────────┘   └─────────────────┘
         │
         ▼
   ┌─────────┐
   │  Redis  │  ← Real-time Pub/Sub
   └─────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.23+
- PostgreSQL 12+
- Redis 6+
- pnpm

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd momentum-app

# 2. Install dependencies
pnpm install
cd webSocket && go mod download && cd ..

# 3. Setup environment variables
cp .env.example .env.local
cp webSocket/.env.example webSocket/.env

# 4. Configure JWT secrets (MUST MATCH!)
# Edit .env.local: Set QUIZ_JWT_SECRET
# Edit webSocket/.env: Set JWT_SECRET (same value)

# 5. Setup database
cd webSocket
psql -U postgres -d your_database -f schema.sql
cd ..

# 6. Start services (Windows)
start-services.bat

# OR manually:
# Terminal 1: redis-server
# Terminal 2: cd webSocket && go run ./cmd/server/main.go
# Terminal 3: pnpm dev
```

### Access the Application
- Frontend: http://localhost:3000
- Go Service: http://localhost:8080
- Health Check: http://localhost:8080/health

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Fast setup guide (5 minutes)
- **[RUNNING_SERVICES.md](RUNNING_SERVICES.md)** - Detailed service documentation
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Complete architecture and flow
- **[webSocket/README.md](webSocket/README.md)** - Go service documentation

## 🎮 How to Use

### Creating a Quick Fire Contest

1. Navigate to Dashboard → Leaderboard
2. Click "Create Contest"
3. Fill in details:
   - Name: "Quick Battle"
   - Contest Type: **Quick Fire**
   - Difficulty: Medium
   - Questions: 5-10
4. Click "Create"
5. Share the contest link with friends
6. Click "Start Contest" when ready
7. Compete in real-time!

### Game Rules (Quick Fire)

- ⚡ Each question has a 15-second time limit
- 🏃 First correct answer wins points (max 1000 points)
- ⏱️ Faster answers = more points
- ❌ Wrong answers don't give negative points
- 📊 Live scoreboard updates in real-time
- 🏆 Winner announced at the end

## 🔧 Configuration

### Critical Environment Variables

```bash
# Next.js (.env.local)
QUIZ_JWT_SECRET=your-secret-here
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
GO_WEBSOCKET_SERVICE_URL=http://localhost:8080

# Go Service (webSocket/.env)
JWT_SECRET=your-secret-here  # MUST match QUIZ_JWT_SECRET
PORT=8080
DATABASE_URL=your-postgres-url
REDIS_ADDR=localhost:6379
```

**⚠️ Important**: `QUIZ_JWT_SECRET` and `JWT_SECRET` MUST be identical!

## 🧪 Testing

### Manual Testing
```bash
# Open browser 1
http://localhost:3000/dashboard/leaderboard
# Create and start a quick_fire contest

# Open browser 2 (incognito)
http://localhost:3000
# Login and join the same contest
```

### Automated Testing
```bash
cd webSocket

# Node.js (recommended)
node test_contest.js --auto

# Python
python test_contest.py --auto

# Bash
./test_contest.sh
```

## 📁 Project Structure

```
momentum-app/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── contest/              # Contest APIs
│   ├── dashboard/                # Dashboard pages
│   │   └── contest/[id]/         # Contest pages
│   │       ├── game/             # Real-time game page
│   │       ├── lobby/            # Contest lobby
│   │       └── leaderboard/      # Results
│   └── ...
├── backend/                      # Python backend (emails)
├── BackendGmailService/          # Gmail service
├── webSocket/                    # Go WebSocket service
│   ├── cmd/server/               # Main entry point
│   ├── internal/
│   │   ├── api/                  # HTTP routes
│   │   ├── config/               # Configuration
│   │   ├── contest/              # Contest logic
│   │   │   ├── hub.go           # Contest room manager
│   │   │   ├── client.go        # WebSocket client
│   │   │   └── message.go       # Message protocol
│   │   └── storage/              # Database
│   └── README.md
├── components/                   # React components
├── lib/                          # Utilities
├── server/                       # Server actions
├── .env.local                    # Environment variables
├── start-services.bat            # Windows startup script
├── QUICK_START.md                # Quick setup guide
├── RUNNING_SERVICES.md           # Detailed docs
└── INTEGRATION_GUIDE.md          # Architecture guide
```

## 🔐 Security

- JWT authentication for all WebSocket connections
- Better Auth for user management
- Environment variables for secrets
- CORS protection
- Input validation on both client and server
- PostgreSQL prepared statements

## 🚀 Deployment

### Development
```bash
start-services.bat  # Windows
# OR follow RUNNING_SERVICES.md
```

### Production

1. **Next.js**: Deploy to Vercel
2. **Go Service**: Deploy to AWS/GCP/DigitalOcean
3. **Database**: Use managed PostgreSQL (Neon, Supabase)
4. **Redis**: Use managed Redis (Upstash, Redis Cloud)

See [RUNNING_SERVICES.md](RUNNING_SERVICES.md) for detailed deployment guide.

## 🛠️ Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI
- WebSocket API

### Backend (Next.js)
- Better Auth
- Drizzle ORM
- PostgreSQL
- Upstash Redis
- Gmail API

### Backend (Go)
- Gorilla WebSocket
- Gorilla Mux
- JWT-Go
- PostgreSQL (pgx)
- Redis

## 📊 Database Schema

- `users` - User accounts
- `contest` - Contest metadata
- `contestParticipant` - Participants
- `contestInvitation` - Email invitations
- `questions` - Quiz questions
- `contest_results` - Final scores
- `player_answers` - Answer submissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

MIT License

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Go community for excellent WebSocket libraries
- Better Auth for authentication
- Shadcn for beautiful UI components

## 🐛 Troubleshooting

### WebSocket connection fails
- Ensure Go service is running on port 8080
- Check `NEXT_PUBLIC_WEBSOCKET_URL` in `.env.local`
- Verify JWT secrets match

### Authentication fails
- Ensure `QUIZ_JWT_SECRET` matches `JWT_SECRET`
- Check user is logged into Next.js app
- Verify Go service `/login` endpoint is accessible

### Redis connection error
- Start Redis: `redis-server`
- Check Redis is running: `redis-cli ping`
- Verify `REDIS_ADDR` in Go service `.env`

See [QUICK_START.md](QUICK_START.md) for more troubleshooting tips.

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review logs in terminal windows
3. Verify environment variables
4. Open an issue on GitHub

---

**Happy Coding! 🎉**

Built with ❤️ using Next.js, Go, PostgreSQL, and Redis
