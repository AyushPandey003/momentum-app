# 🚀 Momentum - AI-Powered Productivity Platform

<div align="center">

![Momentum Banner](https://img.shields.io/badge/Momentum-Productivity_Platform-3B82F6?style=for-the-badge)

**Build Unstoppable Momentum in Your Daily Life**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Live Demo](https://momentum-app.vercel.app) • [Documentation](docs/MOMENTUM_DOCUMENTATION.pdf) • [Report Bug](https://github.com/AyushPandey003/momentum-app/issues) • [Request Feature](https://github.com/AyushPandey003/momentum-app/issues)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🌟 Overview

**Momentum** is a next-generation AI-powered time management and productivity platform that transforms how you approach daily tasks. By combining intelligent task decomposition, automated scheduling, gamification mechanics, and real-time competitive features, Momentum makes productivity engaging, sustainable, and effective.

### 🎯 Key Highlights

- 🤖 **AI Task Decomposition** - Automatically breaks down complex tasks into manageable subtasks
- 📅 **Intelligent Scheduling** - Smart time-blocking with Pomodoro technique integration
- 🏆 **Gamification Engine** - Earn points, unlock achievements, level up
- ⚡ **Real-time Contests** - Compete with friends in knowledge challenges
- 💪 **Wellness Integration** - Automated break reminders and health tracking
- 📧 **Manager Verification** - Task accountability through email verification
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode support

---

## ✨ Features

### 🧠 AI-Powered Task Management

Transform overwhelming projects into achievable steps with our AI decomposition engine powered by Google Gemini.

```mermaid
graph LR
    A[Complex Task] --> B[AI Analysis]
    B --> C[Subtask 1]
    B --> D[Subtask 2]
    B --> E[Subtask 3]
    C --> F[Scheduled]
    D --> F
    E --> F
    F --> G[Calendar]
    
    style A fill:#ef4444
    style B fill:#3b82f6
    style C,D,E fill:#22c55e
    style F fill:#f59e0b
    style G fill:#8b5cf6
```

**Features:**
- Automatic task breakdown into subtasks
- Time estimation for each subtask
- Priority assignment based on context
- Sequential or parallel subtask ordering

### 📅 Intelligent Scheduling System

Smart calendar management that adapts to your workflow and optimizes your time.

```mermaid
gantt
    title Daily Schedule Example
    dateFormat HH:mm
    axisFormat %H:%M
    
    section Morning
    Deep Work (Task A)    :active, 09:00, 10:25
    Short Break          :crit, 10:25, 10:30
    Deep Work (Task B)    :active, 10:30, 11:55
    
    section Midday
    Lunch Break          :done, 12:00, 13:00
    Meeting              :done, 13:00, 14:00
    
    section Afternoon
    Task C (Pomodoro)    :active, 14:00, 14:25
    Short Break          :crit, 14:25, 14:30
    Task D (Pomodoro)    :active, 14:30, 14:55
    Long Break           :crit, 14:55, 15:10
```

**Scheduling Features:**
- Pomodoro timer integration (25-5-15 intervals)
- Automatic break scheduling
- Wellness reminder integration
- Calendar sync (Google, Outlook)
- Work hours customization
- Time-blocking optimization

### 🎮 Gamification & Achievements

Stay motivated with a comprehensive gamification system that rewards productivity.

```mermaid
graph TD
    A[Complete Task] --> B[Earn Points]
    B --> C{Check Level}
    C -->|Level Up| D[New Level Unlocked]
    C -->|Continue| E[Progress to Next Level]
    B --> F[Check Achievements]
    F -->|Unlocked| G[Achievement Notification]
    F -->|Locked| H[Track Progress]
    
    D --> I[Unlock New Features]
    G --> J[Earn Bonus Points]
    
    style A fill:#22c55e
    style B fill:#3b82f6
    style D fill:#f59e0b
    style G fill:#8b5cf6
    style I,J fill:#ec4899
```

**Gamification Elements:**

| Element | Description | Rewards |
|---------|-------------|---------|
| **Points** | Earned through task completion | XP for leveling |
| **Levels** | Progress based on total points | Unlock features |
| **Achievements** | Unlock milestones | Badge collection |
| **Streaks** | Consecutive days active | Bonus multiplier |
| **Leaderboard** | Global & friend rankings | Competitive edge |

**Achievement Categories:**
- 🎯 Task Master (1, 10, 50, 100 tasks)
- 🍅 Pomodoro Pro (Focus sessions)
- 🔥 Streak Champion (3, 7, 30 days)
- 🏆 Contest Victor (Wins and participation)
- ⏰ Early Bird (Morning productivity)

### 🏁 Real-Time Contest System

Compete with friends in live knowledge challenges with WebSocket-powered real-time updates.

```mermaid
sequenceDiagram
    participant O as Organizer
    participant S as Server
    participant P1 as Player 1
    participant P2 as Player 2
    participant WS as WebSocket Hub
    
    O->>S: Create Contest
    S->>P1: Send Email Invitation
    S->>P2: Send Email Invitation
    
    P1->>S: Accept Invitation
    P2->>S: Accept Invitation
    
    P1->>WS: Join Waiting Room
    P2->>WS: Join Waiting Room
    WS-->>O: Update Participant Count
    
    O->>WS: Start Contest
    WS->>P1: Broadcast Start
    WS->>P2: Broadcast Start
    
    loop Each Question
        WS->>P1: Send Question
        WS->>P2: Send Question
        P1->>WS: Submit Answer
        WS->>WS: Calculate Score
        WS->>P1: Score Update
        WS->>P2: Score Update
    end
    
    WS->>O: Contest Complete
    WS->>P1: Final Results
    WS->>P2: Final Results
```

**Contest Features:**
- **Contest Types:** Quick Fire (15 min), Standard (30 min), Marathon (60 min)
- **Difficulty Levels:** Easy, Medium, Hard
- **Categories:** Programming, Math, Logic, Science, General Knowledge
- **Private Contests:** Invite-only with email invitations (max 5 participants)
- **Real-time Updates:** Live leaderboard, instant answer validation
- **Speed Scoring:** Bonus points for faster correct answers
- **Results Dashboard:** Comprehensive performance analytics

**Scoring Formula:**
```
Points = Base Points × (1 + (Time Remaining / Total Time) × 0.5)
```

### 💪 Wellness & Health Tracking

Maintain peak performance with integrated wellness monitoring and reminders.

```mermaid
graph TB
    subgraph Wellness Metrics
    A[Hydration] --> E[Daily Goals]
    B[Breaks] --> E
    C[Eye Rest] --> E
    D[Movement] --> E
    end
    
    E --> F{Check Progress}
    F -->|Below Goal| G[Send Reminder]
    F -->|On Track| H[Positive Reinforcement]
    F -->|Goal Met| I[Achievement Unlock]
    
    G --> J[Wellness Dashboard]
    H --> J
    I --> J
    
    style A fill:#3b82f6
    style B fill:#22c55e
    style C fill:#f59e0b
    style D fill:#ec4899
    style I fill:#8b5cf6
```

**Wellness Features:**
- 💧 **Hydration Tracking** - Goal: 8 glasses/day
- ☕ **Break Reminders** - Every 30 minutes
- 👁️ **Eye Rest** - 20-20-20 rule (every 20 min, look 20 ft away, for 20 sec)
- 🚶 **Movement Goals** - 3 active sessions/day
- 😴 **Sleep Tracking** - Optimal rest recommendations
- 🧘 **Wellness Dashboard** - Comprehensive health overview

### 📧 Manager Verification System

Ensure accountability with task verification through managers or mentors.

```mermaid
stateDiagram-v2
    [*] --> TaskCreated: User creates task
    TaskCreated --> ManagerAssigned: Assign manager email
    ManagerAssigned --> EmailSent: System sends verification link
    EmailSent --> TaskInProgress: User works on task
    TaskInProgress --> TaskCompleted: User marks complete
    TaskCompleted --> ImageUploaded: Upload proof image
    ImageUploaded --> AwaitingVerification: Notify manager
    AwaitingVerification --> Verified: Manager confirms
    AwaitingVerification --> Rejected: Manager rejects
    Verified --> PointsAwarded: Award points
    Rejected --> TaskInProgress: Revise & resubmit
    PointsAwarded --> [*]
    
    note right of EmailSent
        Secure token-based
        verification link
    end note
    
    note right of ImageUploaded
        UploadThing secure
        file storage
    end note
```

**Verification Features:**
- Email-based manager assignment
- Secure verification tokens
- Image proof upload
- One-click approval/rejection
- Automatic point allocation
- Verification history tracking

---

## 🏗️ Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph Client Layer
        A[Next.js Frontend]
        B[React Components]
        C[TailwindCSS]
    end
    
    subgraph API Layer
        D[Next.js API Routes]
        E[Better Auth]
        F[WebSocket Server]
    end
    
    subgraph Business Logic
        G[Task Service]
        H[Contest Service]
        I[Gamification Service]
        J[AI Service]
    end
    
    subgraph Data Layer
        K[Drizzle ORM]
        L[(PostgreSQL)]
        M[(Redis Cache)]
    end
    
    subgraph External Services
        N[Google Gemini AI]
        O[Gmail API]
        P[UploadThing]
    end
    
    A --> D
    B --> D
    D --> E
    D --> G
    D --> H
    D --> I
    D --> J
    
    F --> H
    
    G --> K
    H --> K
    I --> K
    
    K --> L
    K --> M
    
    J --> N
    E --> O
    G --> P
    
    style A fill:#3b82f6
    style D fill:#22c55e
    style K fill:#f59e0b
    style L fill:#8b5cf6
    style N fill:#ec4899
```

### Data Flow Architecture

```mermaid
flowchart LR
    subgraph User Interface
        A[Browser/Client]
    end
    
    subgraph Edge Network
        B[Vercel CDN]
        C[Edge Functions]
    end
    
    subgraph Application
        D[Next.js Server]
        E[API Routes]
        F[Server Actions]
    end
    
    subgraph Services
        G[Authentication]
        H[Task Manager]
        I[AI Engine]
    end
    
    subgraph Storage
        J[(Neon PostgreSQL)]
        K[(Upstash Redis)]
        L[File Storage]
    end
    
    A <-->|HTTPS| B
    B <--> C
    C <--> D
    D <--> E
    E <--> F
    F <--> G
    F <--> H
    F <--> I
    G <--> J
    H <--> J
    I --> J
    E <--> K
    H <--> L
    
    style A fill:#3b82f6
    style D fill:#22c55e
    style J fill:#8b5cf6
    style I fill:#ec4899
```

### Contest System Architecture

```mermaid
graph TB
    subgraph Frontend
        A[Contest UI]
        B[WebSocket Client]
    end
    
    subgraph Backend Services
        C[Contest API]
        D[WebSocket Server]
        E[Question Service]
        F[Scoring Engine]
    end
    
    subgraph State Management
        G[Redis Pub/Sub]
        H[Contest State]
        I[Player Sessions]
    end
    
    subgraph Database
        J[(Contest Tables)]
        K[(Question Bank)]
        L[(Results)]
    end
    
    A --> C
    B <-->|WSS| D
    
    C --> E
    C --> J
    
    D --> H
    D --> I
    D --> F
    
    E --> K
    F --> L
    
    H <--> G
    I <--> G
    
    style D fill:#3b82f6
    style G fill:#22c55e
    style F fill:#f59e0b
    style J fill:#8b5cf6
```

---

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with App Router | 14.x |
| **React** | UI component library | 18.x |
| **TypeScript** | Type-safe development | 5.x |
| **Tailwind CSS** | Utility-first CSS framework | 3.x |
| **Shadcn/ui** | Component library | Latest |
| **Radix UI** | Accessible primitives | Latest |
| **Lucide Icons** | Icon library | Latest |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js API Routes** | RESTful API endpoints | 14.x |
| **Better Auth** | Authentication solution | 1.x |
| **Drizzle ORM** | Type-safe SQL ORM | Latest |
| **PostgreSQL** | Primary database (Neon) | 15.x |
| **Redis** | Caching & rate limiting (Upstash) | Latest |
| **WebSocket** | Real-time communication | - |

### AI & External Services

| Service | Purpose | Provider |
|---------|---------|----------|
| **Google Gemini** | AI task decomposition | Google |
| **Gmail API** | Email notifications | Google |
| **UploadThing** | File uploads & storage | UploadThing |
| **React Email** | Transactional emails | Resend |

### Development Tools

```mermaid
graph LR
    A[VS Code] --> B[TypeScript]
    A --> C[ESLint]
    A --> D[Prettier]
    
    E[pnpm] --> F[Dependencies]
    E --> G[Scripts]
    
    H[Drizzle Kit] --> I[Migrations]
    H --> J[Studio]
    
    K[Git] --> L[GitHub]
    L --> M[Vercel]
    
    style A fill:#3b82f6
    style E fill:#22c55e
    style H fill:#f59e0b
    style M fill:#8b5cf6
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- **PostgreSQL** database (or Neon account)
- **Redis** instance (or Upstash account)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/AyushPandey003/momentum-app.git
cd momentum-app
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database"
DIRECT_URL="postgresql://user:password@host/database"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# AI (Google Gemini)
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Email (Gmail)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# File Upload (UploadThing)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-app-id"

# Optional: Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS="true"
```

4. **Run database migrations**

```bash
pnpm drizzle-kit push
```

5. **Seed the database (optional)**

```bash
pnpm seed:questions
```

6. **Start the development server**

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Development Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Database operations
pnpm drizzle-kit studio    # Open Drizzle Studio
pnpm drizzle-kit push      # Push schema changes
pnpm seed:questions        # Seed question database
pnpm check:contest         # Verify contest setup
```

---

## 📚 Usage Guide

### Creating Your First Task

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Interface
    participant AI as AI Engine
    participant DB as Database
    
    U->>UI: Click "Add Task"
    UI->>U: Show task form
    U->>UI: Enter task details
    U->>UI: Enable AI Decomposition
    UI->>AI: Send task description
    AI->>AI: Analyze & decompose
    AI->>UI: Return subtasks
    UI->>U: Show subtasks preview
    U->>UI: Confirm & save
    UI->>DB: Store task & subtasks
    DB->>UI: Confirmation
    UI->>U: Success notification
```

**Steps:**
1. Navigate to Dashboard → Tasks
2. Click "Add Task" button
3. Fill in task details:
   - Title (e.g., "Build landing page")
   - Description (detailed requirements)
   - Due date
   - Priority level
   - Estimated time
4. Enable "AI Decomposition" toggle
5. Click "Create Task"
6. Review AI-generated subtasks
7. Confirm and save

### Starting a Pomodoro Session

1. Go to Dashboard
2. Click on any task card
3. Click "Start Pomodoro" button
4. Timer starts automatically (25 minutes)
5. Work without interruption
6. Short break starts automatically (5 minutes)
7. Repeat cycle
8. Long break after 4 pomodoros (15 minutes)

### Creating a Contest

```mermaid
flowchart TD
    A[Go to Leaderboard] --> B[Click Create Contest]
    B --> C[Fill Contest Details]
    C --> D{Contest Type}
    D -->|Quick Fire| E[15 min, 10 questions]
    D -->|Standard| F[30 min, 15 questions]
    D -->|Marathon| G[60 min, 25 questions]
    E --> H[Select Difficulty]
    F --> H
    G --> H
    H --> I[Choose Category]
    I --> J[Add Participant Emails]
    J --> K[Create Contest]
    K --> L[Invitations Sent]
    L --> M[Wait in Lobby]
    M --> N{All Joined?}
    N -->|Yes| O[Start Contest]
    N -->|No| M
    
    style K fill:#22c55e
    style O fill:#3b82f6
```

**Contest Creation Steps:**
1. Navigate to Leaderboard page
2. Click "Create Contest"
3. Configure contest:
   - Name and description
   - Contest type (Quick Fire/Standard/Marathon)
   - Difficulty level
   - Category selection
   - Question count
4. Invite participants (max 4 friends)
5. Click "Create & Send Invitations"
6. Wait for participants to join lobby
7. Start contest when ready

### Unlocking Achievements

Achievements unlock automatically when criteria are met:

```mermaid
pie title Achievement Distribution
    "Task Completion" : 35
    "Pomodoro Focus" : 25
    "Streak Maintenance" : 20
    "Contest Participation" : 15
    "Special Events" : 5
```

**Top Achievements:**
- 🎯 First Task (10 pts) - Complete your first task
- ⭐ Task Master (50 pts) - Complete 10 tasks
- 🏆 Productivity Pro (200 pts) - Complete 50 tasks
- 🔥 Week Warrior (75 pts) - 7-day streak
- 🚀 Unstoppable (300 pts) - 30-day streak
- 🥇 Contest Champion (200 pts) - Win a contest

---

## 📡 API Documentation

### Authentication

#### POST `/api/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "usr_01HKXYZ...",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": false
  },
  "session": {
    "token": "sess_token_...",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### POST `/api/auth/login`

Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### Task Management

#### GET `/api/tasks`

Retrieve user's tasks with filtering.

**Query Parameters:**
- `status` - Filter by status (todo, in-progress, completed, overdue)
- `priority` - Filter by priority (low, medium, high, urgent)
- `limit` - Number of tasks to return (default: 20)
- `offset` - Pagination offset

**Example Request:**
```bash
GET /api/tasks?status=todo&priority=high&limit=10
```

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "task_01...",
      "title": "Complete project proposal",
      "description": "Draft and submit final proposal",
      "dueDate": "2024-12-15T17:00:00Z",
      "priority": "high",
      "status": "todo",
      "estimatedTime": 120,
      "actualTime": 0,
      "subtasks": [
        {
          "id": "sub_01",
          "title": "Research requirements",
          "completed": false,
          "estimatedTime": 30
        }
      ],
      "aiDecomposed": true
    }
  ],
  "total": 15,
  "hasMore": true
}
```

#### POST `/api/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Build landing page",
  "description": "Create responsive landing page with hero section and features",
  "dueDate": "2024-12-20T17:00:00Z",
  "priority": "high",
  "estimatedTime": 240,
  "aiDecompose": true,
  "managerEmail": "manager@company.com"
}
```

**Response (201):**
```json
{
  "task": {
    "id": "task_02...",
    "title": "Build landing page",
    "subtasks": [
      {
        "id": "sub_01",
        "title": "Design hero section layout",
        "estimatedTime": 60
      },
      {
        "id": "sub_02",
        "title": "Implement responsive navigation",
        "estimatedTime": 45
      },
      {
        "id": "sub_03",
        "title": "Create features showcase section",
        "estimatedTime": 75
      },
      {
        "id": "sub_04",
        "title": "Add call-to-action buttons",
        "estimatedTime": 30
      },
      {
        "id": "sub_05",
        "title": "Optimize for mobile devices",
        "estimatedTime": 30
      }
    ],
    "status": "todo",
    "createdAt": "2024-11-14T10:30:00Z"
  }
}
```

### Contest System

#### POST `/api/contest`

Create a new contest.

**Request Body:**
```json
{
  "name": "Friday Quiz Night",
  "description": "Weekly programming challenge",
  "contestType": "standard",
  "difficulty": "medium",
  "category": "Programming",
  "questionCount": 15,
  "durationMinutes": 30,
  "maxParticipants": 5,
  "invites": [
    "friend1@example.com",
    "friend2@example.com",
    "friend3@example.com"
  ]
}
```

**Response (201):**
```json
{
  "contest": {
    "id": "contest_01...",
    "name": "Friday Quiz Night",
    "status": "waiting",
    "invitationsSent": 3,
    "lobbyUrl": "/dashboard/contest/contest_01.../lobby"
  }
}
```

#### WebSocket Events

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8080/ws/contest/{contestId}?userId={userId}&token={token}');
```

**Client → Server Events:**
```json
// Join lobby
{
  "type": "join_lobby",
  "userId": "usr_01...",
  "username": "John Doe"
}

// Submit answer
{
  "type": "answer_submit",
  "questionId": "q_01...",
  "answer": "Option B",
  "timeTaken": 8500
}
```

**Server → Client Events:**
```json
// Question display
{
  "type": "question_display",
  "question": {
    "id": "q_01...",
    "text": "What is the time complexity of binary search?",
    "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    "timeLimit": 60,
    "points": 10
  }
}

// Score update
{
  "type": "score_update",
  "leaderboard": [
    { "userId": "usr_01", "username": "John", "score": 45, "rank": 1 },
    { "userId": "usr_02", "username": "Jane", "score": 40, "rank": 2 }
  ]
}

// Contest complete
{
  "type": "contest_complete",
  "finalResults": [
    { "rank": 1, "username": "John", "score": 145, "accuracy": 95 },
    { "rank": 2, "username": "Jane", "score": 140, "accuracy": 92 }
  ]
}
```

### Gamification

#### GET `/api/leaderboard`

Get global or filtered leaderboard.

**Query Parameters:**
- `scope` - Global or friends (default: global)
- `limit` - Number of users (default: 50)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "userId": "usr_01...",
      "userName": "John Doe",
      "points": 4850,
      "level": 7,
      "rank": 1,
      "streak": 15,
      "tasksCompleted": 127,
      "pomodorosCompleted": 256
    }
  ],
  "currentUser": {
    "rank": 1,
    "points": 4850,
    "percentile": 99
  }
}
```

#### GET `/api/achievements`

Get user's achievements.

**Response (200):**
```json
{
  "unlocked": [
    {
      "id": "first-task",
      "title": "Getting Started",
      "description": "Complete your first task",
      "icon": "🎯",
      "points": 10,
      "unlockedAt": "2024-11-01T14:23:00Z"
    }
  ],
  "locked": [
    {
      "id": "task-master-50",
      "title": "Productivity Pro",
      "description": "Complete 50 tasks",
      "icon": "🏆",
      "points": 200,
      "progress": 25,
      "total": 50
    }
  ]
}
```

---

## 🗄️ Database Schema

### Core Tables Overview

```mermaid
erDiagram
    USER ||--o{ TASK : creates
    USER ||--o{ SCHEDULE_BLOCK : has
    USER ||--|| USER_STATS : has
    USER ||--o{ USER_ACHIEVEMENTS : unlocks
    USER ||--o{ CONTEST : organizes
    USER ||--o{ CONTEST_PARTICIPANT : joins
    
    TASK ||--o{ SCHEDULE_BLOCK : scheduled_in
    TASK ||--o{ PROCRASTINATION_ALERT : triggers
    
    CONTEST ||--o{ CONTEST_INVITATION : sends
    CONTEST ||--o{ CONTEST_PARTICIPANT : has
    CONTEST ||--o{ CONTEST_QUESTION : includes
    CONTEST ||--o{ PLAYER_ANSWER : records
    
    CONTEST_QUESTION }o--|| PROBLEM_SET : references
    
    USER {
        text id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }
    
    TASK {
        text id PK
        text user_id FK
        text title
        text description
        text due_date
        enum priority
        enum status
        int estimated_time
        int actual_time
        json subtasks
        boolean ai_decomposed
        text manager_email
        text verification_image_url
    }
    
    CONTEST {
        text id PK
        text name
        text description
        timestamp start_date
        timestamp end_date
        enum status
        enum contest_type
        enum difficulty
        text category
        int question_count
        int duration_minutes
        int max_participants
        boolean is_private
        text created_by FK
    }
    
    USER_STATS {
        text id PK
        text user_id FK
        int total_points
        int level
        int current_streak
        int longest_streak
        int tasks_completed
        int pomodoros_completed
        int total_focus_time
    }
```

### Key Relationships

1. **User ↔ Task**: One-to-many relationship
2. **User ↔ Contest**: One-to-many (as organizer)
3. **Contest ↔ Participants**: Many-to-many through junction table
4. **Task ↔ Schedule Block**: One-to-many for time allocation
5. **User ↔ Achievements**: Many-to-many tracking unlocks

### Database Indexes

```sql
-- Performance-critical indexes
CREATE INDEX idx_task_user_status ON task(user_id, status);
CREATE INDEX idx_task_due_date ON task(due_date) WHERE status != 'completed';
CREATE INDEX idx_contest_status ON contest(status, start_date);
CREATE INDEX idx_user_stats_points ON user_stats(total_points DESC);
CREATE INDEX idx_schedule_user_time ON schedule_block(user_id, start_time);
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push code to GitHub**

```bash
git add .
git commit -m "feat: ready for deployment"
git push origin main
```

2. **Deploy to Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AyushPandey003/momentum-app)

3. **Configure environment variables** in Vercel dashboard

4. **Deploy!** - Automatic deployments on every push to main

### Environment Setup

```mermaid
graph TB
    A[Local Development] -->|git push| B[GitHub Repository]
    B -->|webhook| C[Vercel Build]
    C -->|deploy| D[Production]
    
    E[Neon PostgreSQL] --> D
    F[Upstash Redis] --> D
    G[External APIs] --> D
    
    style C fill:#22c55e
    style D fill:#3b82f6
    style E,F fill:#8b5cf6
```

### Production Checklist

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Seed initial data (questions, etc.)
- [ ] Configure custom domain
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring
- [ ] Configure rate limiting
- [ ] Enable Redis caching
- [ ] Test email deliverability
- [ ] Verify WebSocket connections
- [ ] Set up backup strategy

---

## 🤝 Contributing

We love contributions! Here's how you can help make Momentum even better.

### Development Workflow

```mermaid
gitGraph
    commit id: "main"
    branch feature/new-feature
    checkout feature/new-feature
    commit id: "implement feature"
    commit id: "add tests"
    commit id: "update docs"
    checkout main
    merge feature/new-feature
    commit id: "release"
```

### Contribution Steps

1. **Fork the repository**

```bash
# Click "Fork" on GitHub, then:
git clone https://github.com/YOUR-USERNAME/momentum-app.git
cd momentum-app
```

2. **Create a feature branch**

```bash
git checkout -b feature/amazing-feature
```

3. **Make your changes**
   - Write clean, documented code
   - Follow TypeScript best practices
   - Add tests for new features
   - Update documentation

4. **Commit your changes**

```bash
git commit -m "feat: add amazing feature"
```

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

5. **Push to your fork**

```bash
git push origin feature/amazing-feature
```

6. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template
   - Submit!

### Code Style Guidelines

```typescript
// ✅ Good: Clear naming, proper typing
interface TaskFormData {
  title: string;
  description: string;
  dueDate: Date;
  priority: Priority;
}

async function createTask(data: TaskFormData): Promise<Task> {
  // Validate input
  if (!data.title.trim()) {
    throw new Error('Title is required');
  }
  
  // Process and return
  return await db.task.create({ data });
}

// ❌ Bad: Unclear naming, missing types
async function create(d: any) {
  return await db.task.create({ data: d });
}
```

### Areas for Contribution

- 🐛 **Bug Fixes** - Help squash bugs
- ✨ **New Features** - Add requested features
- 📚 **Documentation** - Improve docs and guides
- 🎨 **UI/UX** - Enhance user experience
- ⚡ **Performance** - Optimize speed
- 🧪 **Testing** - Increase test coverage
- 🌐 **Translations** - Add language support

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Ayush Pandey

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📧 Contact

**Ayush Pandey**

- 🐙 GitHub: [@AyushPandey003](https://github.com/AyushPandey003)
- 📧 Email: ayush.pandey@example.com
- 🌐 Website: [momentum-app.vercel.app](https://momentum-app.vercel.app)

### Project Links

- 📦 **Repository**: [github.com/AyushPandey003/momentum-app](https://github.com/AyushPandey003/momentum-app)
- 🐛 **Issues**: [github.com/AyushPandey003/momentum-app/issues](https://github.com/AyushPandey003/momentum-app/issues)
- 💬 **Discussions**: [github.com/AyushPandey003/momentum-app/discussions](https://github.com/AyushPandey003/momentum-app/discussions)
- 📖 **Full Documentation**: [docs/MOMENTUM_DOCUMENTATION.pdf](docs/MOMENTUM_DOCUMENTATION.pdf)

---

## 🙏 Acknowledgments

Special thanks to:

- **Next.js Team** - Amazing React framework
- **Vercel** - Hosting and deployment platform
- **Neon** - Serverless PostgreSQL database
- **Upstash** - Serverless Redis
- **Google** - Gemini AI API
- **Shadcn** - Beautiful UI components
- **Radix UI** - Accessible component primitives
- **All Contributors** - For making this project better

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐!

[![Star History Chart](https://api.star-history.com/svg?repos=AyushPandey003/momentum-app&type=Date)](https://star-history.com/#AyushPandey003/momentum-app&Date)

---

<div align="center">

### Built with ❤️ by [Ayush Pandey](https://github.com/AyushPandey003)

**Build Unstoppable Momentum** 🚀

[⬆ Back to Top](#-momentum---ai-powered-productivity-platform)

</div>
