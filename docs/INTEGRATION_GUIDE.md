# Contest Flow Integration Summary

This document provides a comprehensive overview of how the frontend, backend, and Go WebSocket service work together for the Momentum Contest platform.

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                   │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Dashboard  │───▶│Contest Lobby │───▶│  Game Page (WS)  │   │
│  │             │    │              │    │                  │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                      │
         │                    │                      │ WebSocket
         ▼                    ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS BACKEND (Port 3000)                   │
│                                                                   │
│  /api/contest/create-realtime  ─────────┐                       │
│  /api/contest/token            ─────────┤                       │
│  /api/contest/go-login         ─────────┤                       │
│                                          │                       │
│  Regular Contest APIs:                   │                       │
│  - /server/contests.ts (create, invite)  │                       │
│  - Email service (backend folder)        │                       │
└──────────────────────────────────────────┼───────────────────────┘
                                           │
                                HTTP/REST  │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              GO WEBSOCKET SERVICE (Port 8080)                    │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  /login    │  │/api/contests │  │ /ws/contests/{id}      │  │
│  │  (JWT)     │  │  (Create)    │  │ (WebSocket Endpoint)   │  │
│  └────────────┘  └──────────────┘  └────────────────────────┘  │
│                                                                   │
│  Hub Manager ────▶ Contest Hubs ────▶ WebSocket Clients         │
│        │                                       │                  │
│        └───────────── Redis Pub/Sub ──────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                          │              │
                    PostgreSQL         Redis
                   (Shared DB)      (Real-time)
```

## 🔄 Complete Contest Flow

### Phase 1: Contest Creation

#### For Regular Contests (Standard/Marathon)
```typescript
// server/contests.ts
createContest({
  name: "My Contest",
  contestType: "standard",
  difficulty: "medium",
  questionCount: 10,
  // ... other fields
})
```
- Stored in PostgreSQL via Next.js backend
- Questions generated from database
- Participants can join via invitation
- Used for: Leaderboard, scheduled contests

#### For Quick Fire Contests (Real-Time)
```typescript
// User creates in UI, but actual game created when starting
// This is just metadata stored in Next.js DB
createContest({
  name: "Quick Battle",
  contestType: "quick_fire",
  difficulty: "medium",
  questionCount: 5,
})
```

### Phase 2: Joining Contest

1. **User navigates to**: `/dashboard/contest/{id}/lobby`
2. **Lobby page loads**: `app/dashboard/contest/[id]/lobby/page.tsx`
3. **Checks contest type**:
   - `quick_fire` → Show real-time game info
   - `standard` → Show regular contest info

### Phase 3: Starting Quick Fire Contest

#### Step 1: User clicks "Start Contest"
```typescript
// app/dashboard/contest/[id]/lobby/page.tsx
const handleStartContest = async () => {
  if (contest.contestType === "quick_fire") {
    // Call Next.js API to create real-time contest
    const response = await fetch("/api/contest/create-realtime", {
      method: "POST",
      body: JSON.stringify({
        difficulty: contest.difficulty,
        questionCount: contest.questionCount,
      }),
    });
    
    const data = await response.json();
    router.push(`/dashboard/contest/${data.contestId}/game`);
  }
}
```

#### Step 2: Next.js API proxies to Go Service
```typescript
// app/api/contest/create-realtime/route.ts
export async function POST(req: NextRequest) {
  // 1. Get user session
  const session = await auth.api.getSession();
  
  // 2. Get JWT token from Go service
  const tokenResponse = await fetch("/api/contest/token", {
    body: JSON.stringify({ contestId: "temp" })
  });
  const { token } = await tokenResponse.json();
  
  // 3. Call Go service to create contest
  const goResponse = await fetch("http://localhost:8080/api/contests", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      difficulty: req.difficulty,
      question_count: req.questionCount,
    }),
  });
  
  return goResponse.json();
}
```

#### Step 3: Go Service creates contest room
```go
// internal/api/router.go - CreateContestHandler
func (rt *Router) CreateContestHandler(w http.ResponseWriter, r *http.Request) {
  // 1. Parse request
  var req CreateContestRequest
  json.NewDecoder(r.Body).Decode(&req)
  
  // 2. Generate contest ID
  contestID := uuid.New().String()
  
  // 3. Fetch questions from database
  questions := rt.storage.GetRandomQuestions(difficulty, count)
  
  // 4. Create contest config
  contestConfig := contest.ContestConfig{
    ContestID:     contestID,
    Questions:     questions,
    QuestionTimer: 15,
    MaxPlayers:    6,
  }
  
  // 5. Create hub (contest room)
  hub := rt.manager.CreateHub(contestConfig, rt.pubsub, rt.storage)
  
  // 6. Return WebSocket URL
  return {
    contest_id: contestID,
    websocket_url: "/ws/contests/" + contestID,
  }
}
```

### Phase 4: WebSocket Connection

#### Step 1: Game page connects
```typescript
// app/dashboard/contest/[id]/game/page.tsx
const connectWebSocket = async () => {
  // 1. Get JWT token
  const response = await fetch("/api/contest/token", {
    method: "POST",
    body: JSON.stringify({ contestId }),
  });
  const { token } = await response.json();
  
  // 2. Connect to WebSocket
  const ws = new WebSocket(
    `ws://localhost:8080/ws/contests/${contestId}?token=${token}`
  );
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleWebSocketMessage(message);
  };
}
```

#### Step 2: JWT Token Generation
```typescript
// app/api/contest/token/route.ts
export async function POST(req: NextRequest) {
  // 1. Get user session
  const session = await auth.api.getSession();
  
  // 2. Login to Go service
  const goResponse = await fetch("http://localhost:8080/login", {
    method: "POST",
    body: JSON.stringify({
      username: session.user.name,
      password: "dummy",
    }),
  });
  
  const { token } = await goResponse.json();
  return NextResponse.json({ token });
}
```

#### Step 3: Go Service authenticates
```go
// internal/api/auth.go - LoginHandler
func (as *AuthService) LoginHandler(w http.ResponseWriter, r *http.Request) {
  // Parse credentials
  var loginReq LoginRequest
  json.NewDecoder(r.Body).Decode(&loginReq)
  
  // Generate user ID
  userID := fmt.Sprintf("user_%s_%d", loginReq.Username, time.Now().Unix())
  
  // Create JWT token
  token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
    UserID:   userID,
    Username: loginReq.Username,
    StandardClaims: jwt.StandardClaims{
      ExpiresAt: time.Now().Add(2 * time.Hour).Unix(),
    },
  })
  
  tokenString, _ := token.SignedString([]byte(as.jwtSecret))
  
  return {
    token: tokenString,
    user_id: userID,
    username: loginReq.Username,
  }
}
```

#### Step 4: WebSocket Handler accepts connection
```go
// internal/api/router.go - WebSocketHandler
func (rt *Router) WebSocketHandler(w http.ResponseWriter, r *http.Request) {
  // 1. Extract contest ID from URL
  contestID := mux.Vars(r)["contestID"]
  
  // 2. Get user info from context (set by JWT middleware)
  userID := r.Context().Value("userID").(string)
  username := r.Context().Value("username").(string)
  
  // 3. Get hub for this contest
  hub := rt.manager.GetHub(contestID)
  
  // 4. Upgrade to WebSocket
  conn, _ := rt.upgrader.Upgrade(w, r, nil)
  
  // 5. Create client
  client := &contest.Client{
    Hub:      hub,
    Conn:     conn,
    UserID:   userID,
    Username: username,
  }
  
  // 6. Register client with hub
  hub.Register <- client
  
  // 7. Start client read/write loops
  go client.WritePump()
  go client.ReadPump()
}
```

### Phase 5: Game Play

#### Player Waiting Room
```typescript
// Frontend receives PLAYER_JOINED
{
  type: "PLAYER_JOINED",
  payload: {
    user_id: "user123",
    username: "player1",
    is_host: false,
    player_count: 3,
    players: [...]
  }
}

// UI shows player list and "Start Game" button for host
```

#### Host Starts Game
```typescript
// Frontend sends START_GAME
ws.send(JSON.stringify({
  type: "START_GAME"
}));
```

#### Go Hub handles start
```go
// internal/contest/hub.go
func (h *Hub) Run() {
  for {
    select {
    case message := <-h.Broadcast:
      if message.Type == MessageTypeStartGame {
        h.StartContest()
      }
    }
  }
}

func (h *Hub) StartContest() {
  // 1. Mark contest as started
  h.contestStarted = true
  
  // 2. Broadcast CONTEST_STARTED to all players
  h.broadcastMessage(Message{
    Type: MessageTypeContestStarted,
    Payload: ContestStartedPayload{
      Message: "Contest has started!",
      TotalQuestions: len(h.questions),
      Players: h.getPlayerStates(),
    },
  })
  
  // 3. Present first question
  h.PresentQuestion(0)
}
```

#### Question Flow
```go
// internal/contest/hub.go
func (h *Hub) PresentQuestion(index int) {
  question := h.questions[index]
  
  // Broadcast question to all players
  h.broadcastMessage(Message{
    Type: MessageTypeNewQuestion,
    Payload: NewQuestionPayload{
      QuestionNumber: index + 1,
      TotalQuestions: len(h.questions),
      QuestionID:     question.ID,
      QuestionText:   question.Text,
      Options:        question.Options,
      Timer:          h.config.QuestionTimer,
    },
  })
  
  // Start timer
  h.questionTimer = time.NewTimer(time.Duration(h.config.QuestionTimer) * time.Second)
  
  go func() {
    <-h.questionTimer.C
    // Timer expired, move to next question
    h.HandleQuestionTimeout()
  }()
}
```

#### Answer Submission
```typescript
// Frontend submits answer
ws.send(JSON.stringify({
  type: "SUBMIT_ANSWER",
  question_id: "q123",
  answer: "Paris"
}));
```

```go
// internal/contest/hub.go - HandleAnswer
func (h *Hub) HandleAnswer(client *Client, questionID, answer string) {
  // 1. Check if correct
  question := h.getCurrentQuestion()
  isCorrect := (answer == question.CorrectAnswer)
  
  if isCorrect {
    // 2. Calculate points (speed-based)
    timeTaken := time.Since(h.questionStartTime).Seconds()
    points := h.calculatePoints(timeTaken)
    
    // 3. Update score
    client.Score += points
    
    // 4. Send result to answerer
    client.Send <- Message{
      Type: MessageTypeAnswerResult,
      Payload: AnswerResultPayload{
        IsCorrect: true,
        PointsAwarded: points,
        TimeTaken: timeTaken,
        NewScore: client.Score,
      },
    }
    
    // 5. Broadcast score update to all
    h.broadcastMessage(Message{
      Type: MessageTypeScoreUpdate,
      Payload: ScoreUpdatePayload{
        UserID: client.UserID,
        Username: client.Username,
        Score: client.Score,
        PointsEarned: points,
      },
    })
    
    // 6. Move to next question
    h.NextQuestion()
  } else {
    // Wrong answer
    client.Send <- Message{
      Type: MessageTypeAnswerResult,
      Payload: AnswerResultPayload{
        IsCorrect: false,
        CorrectAnswer: question.CorrectAnswer,
      },
    }
  }
}
```

#### Game Over
```go
// internal/contest/hub.go
func (h *Hub) EndContest() {
  // 1. Calculate final scores
  scoreboard := h.getPlayerStates()
  sort.Slice(scoreboard, func(i, j int) bool {
    return scoreboard[i].Score > scoreboard[j].Score
  })
  
  // 2. Save to database
  h.storage.SaveContestResults(h.config.ContestID, scoreboard)
  
  // 3. Broadcast final results
  h.broadcastMessage(Message{
    Type: MessageTypeGameOver,
    Payload: GameOverPayload{
      Message: "Contest finished!",
      FinalScoreboard: scoreboard,
      Questions: h.getQuestionSummaries(),
    },
  })
  
  // 4. Close hub after delay
  time.AfterFunc(10*time.Second, func() {
    h.Close()
  })
}
```

## 🔑 Key Integration Points

### 1. JWT Secret Synchronization
**Critical**: `QUIZ_JWT_SECRET` (Next.js) MUST equal `JWT_SECRET` (Go)

```bash
# .env.local (Next.js)
QUIZ_JWT_SECRET=momentum-contest-jwt-secret-2024-change-in-production

# webSocket/.env (Go)
JWT_SECRET=momentum-contest-jwt-secret-2024-change-in-production
```

### 2. WebSocket URL Configuration
```bash
# Frontend connects to Go service
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080

# Backend calls Go service REST APIs
GO_WEBSOCKET_SERVICE_URL=http://localhost:8080
```

### 3. Message Protocol Alignment

**Frontend sends:**
```json
{ "type": "START_GAME" }
{ "type": "SUBMIT_ANSWER", "question_id": "q123", "answer": "Paris" }
```

**Go expects:**
```go
type MessageType string
const (
  MessageTypeStartGame    = "START_GAME"
  MessageTypeSubmitAnswer = "SUBMIT_ANSWER"
)
```

### 4. Database Sharing
Both services use the same PostgreSQL database:
- Next.js: User management, regular contests, invitations
- Go: Questions, contest results, player answers

## 🚀 Service Responsibilities

### Next.js Backend (Port 3000)
- ✅ User authentication (Better Auth)
- ✅ Contest metadata (name, dates, type)
- ✅ Email invitations
- ✅ Regular contest flow
- ✅ Dashboard and UI
- ✅ Proxy to Go service for real-time contests

### Go WebSocket Service (Port 8080)
- ✅ Real-time WebSocket connections
- ✅ Contest room management (hubs)
- ✅ Question delivery
- ✅ Answer validation
- ✅ Score calculation
- ✅ Live leaderboard updates
- ✅ Redis pub/sub for scaling

### Backend Folder (Python - Vercel)
- ✅ Email service (Gmail integration)
- ✅ Additional API endpoints if needed
- ✅ Can be used for other microservices

## 📊 Data Flow Example

```
User Action: Submit Answer "Paris"
├─▶ Frontend: ws.send({ type: "SUBMIT_ANSWER", answer: "Paris" })
    │
    ├─▶ Go WebSocket: ReadPump receives message
        │
        ├─▶ Hub: HandleAnswer()
            │
            ├─▶ Validate answer: "Paris" == correctAnswer ✓
            ├─▶ Calculate points: 850 (based on speed)
            ├─▶ Update score: client.Score += 850
            │
            ├─▶ Send to player: ANSWER_RESULT (personal)
            │   └─▶ Frontend: Updates "My Score" to 850
            │
            └─▶ Broadcast: SCORE_UPDATE (to all)
                └─▶ All Frontends: Update live scoreboard
```

## 🔐 Security Flow

```
1. User logs into Next.js → Better Auth session
2. User joins contest → Next.js validates session
3. Next.js calls Go /login → Gets JWT token
4. Frontend gets JWT via /api/contest/token
5. WebSocket connects with JWT in query param
6. Go validates JWT → Extracts userID
7. Client registered with hub
8. All messages authenticated via connection
```

## 🎮 Best Practices

1. **Always check JWT secrets match** between services
2. **Use environment variables** for all configuration
3. **Handle WebSocket disconnections** gracefully
4. **Validate all user input** on both frontend and backend
5. **Use Redis pub/sub** for horizontal scaling
6. **Log errors** in both services for debugging
7. **Test with multiple players** before production
8. **Monitor WebSocket connection health**

## 📝 Summary

The platform uses a **hybrid architecture**:
- **Next.js**: Handles user management, regular contests, and UI
- **Go**: Handles real-time WebSocket contests with low latency
- **Shared Database**: Both services read/write to PostgreSQL
- **Redis**: Used by Go service for pub/sub and scaling

This architecture provides:
- ✅ Best user experience for real-time gameplay
- ✅ Robust authentication and authorization
- ✅ Scalable WebSocket handling
- ✅ Email notifications and invitations
- ✅ Flexible contest types (quick_fire, standard, marathon)

---

For questions or issues, refer to:
- `QUICK_START.md` - Setup guide
- `RUNNING_SERVICES.md` - Deployment guide
- `webSocket/README.md` - Go service documentation
