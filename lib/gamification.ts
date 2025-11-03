import type { Achievement, User } from "./types"

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-task",
    title: "Getting Started",
    description: "Complete your first task",
    icon: "🎯",
    points: 10,
    requirement: { type: "tasksCompleted", value: 1 },
  },
  {
    id: "task-master-10",
    title: "Task Master",
    description: "Complete 10 tasks",
    icon: "⭐",
    points: 50,
    requirement: { type: "tasksCompleted", value: 10 },
  },
  {
    id: "task-master-50",
    title: "Productivity Pro",
    description: "Complete 50 tasks",
    icon: "🏆",
    points: 200,
    requirement: { type: "tasksCompleted", value: 50 },
  },
  {
    id: "task-master-100",
    title: "Century Club",
    description: "Complete 100 tasks",
    icon: "💯",
    points: 500,
    requirement: { type: "tasksCompleted", value: 100 },
  },
  {
    id: "first-pomodoro",
    title: "Focus Beginner",
    description: "Complete your first Pomodoro",
    icon: "🍅",
    points: 10,
    requirement: { type: "pomodorosCompleted", value: 1 },
  },
  {
    id: "pomodoro-25",
    title: "Focus Master",
    description: "Complete 25 Pomodoros",
    icon: "🔥",
    points: 100,
    requirement: { type: "pomodorosCompleted", value: 25 },
  },
  {
    id: "pomodoro-100",
    title: "Concentration King",
    description: "Complete 100 Pomodoros",
    icon: "👑",
    points: 400,
    requirement: { type: "pomodorosCompleted", value: 100 },
  },
  {
    id: "streak-3",
    title: "Building Momentum",
    description: "Maintain a 3-day streak",
    icon: "📈",
    points: 30,
    requirement: { type: "currentStreak", value: 3 },
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    points: 75,
    requirement: { type: "currentStreak", value: 7 },
  },
  {
    id: "streak-30",
    title: "Unstoppable",
    description: "Maintain a 30-day streak",
    icon: "🚀",
    points: 300,
    requirement: { type: "currentStreak", value: 30 },
  },
  {
    id: "early-bird",
    title: "Early Bird",
    description: "Complete a task before 8 AM",
    icon: "🌅",
    points: 25,
    requirement: { type: "special", value: "early-bird" },
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Complete a task after 10 PM",
    icon: "🦉",
    points: 25,
    requirement: { type: "special", value: "night-owl" },
  },
  {
    id: "focus-time-10",
    title: "10 Hours of Focus",
    description: "Accumulate 10 hours of focus time",
    icon: "⏰",
    points: 150,
    requirement: { type: "totalFocusTime", value: 600 },
  },
  {
    id: "focus-time-50",
    title: "50 Hours of Focus",
    description: "Accumulate 50 hours of focus time",
    icon: "⌛",
    points: 600,
    requirement: { type: "totalFocusTime", value: 3000 },
  },
  {
    id: "contest-first",
    title: "Contest Rookie",
    description: "Complete your first contest",
    icon: "🎪",
    points: 50,
    requirement: { type: "special", value: "contest-first" },
  },
  {
    id: "contest-winner",
    title: "Contest Champion",
    description: "Win a contest (rank #1)",
    icon: "🥇",
    points: 200,
    requirement: { type: "special", value: "contest-winner" },
  },
  {
    id: "contest-top3",
    title: "Podium Finisher",
    description: "Finish in top 3 of a contest",
    icon: "🥉",
    points: 100,
    requirement: { type: "special", value: "contest-top3" },
  },
  {
    id: "contest-veteran",
    title: "Contest Veteran",
    description: "Participate in 10 contests",
    icon: "🎖️",
    points: 250,
    requirement: { type: "special", value: "contest-veteran" },
  },
]

export function checkAchievements(user: User): Achievement[] {
  const newAchievements: Achievement[] = []

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked (guard for missing achievements array)
    const unlockedIds = user.achievements ?? []
    if (unlockedIds.includes(achievement.id)) continue

    let unlocked = false

    switch (achievement.requirement?.type) {
      case "tasksCompleted": {
        const req = achievement.requirement?.value
        if (typeof req === "number") {
          unlocked = (user.stats?.tasksCompleted ?? 0) >= req
        }
        break
      }
      case "pomodorosCompleted": {
        const req = achievement.requirement?.value
        if (typeof req === "number") {
          unlocked = (user.stats?.pomodorosCompleted ?? 0) >= req
        }
        break
      }
      case "currentStreak": {
        const req = achievement.requirement?.value
        if (typeof req === "number") {
          unlocked = (user.stats?.currentStreak ?? user.stats?.streak ?? 0) >= req
        }
        break
      }
      case "totalFocusTime": {
        const req = achievement.requirement?.value
        if (typeof req === "number") {
          unlocked = (user.stats?.totalFocusTime ?? 0) >= req
        }
        break
      }
      case "special":
        // Special achievements are unlocked through specific actions
        break
      default:
        break
    }

    if (unlocked) {
      newAchievements.push(achievement)
    }
  }

  return newAchievements
}

export function calculateLevel(points: number): number {
  // Level formula: level = floor(sqrt(points / 100)) + 1
  return Math.floor(Math.sqrt(points / 100)) + 1
}

export function getPointsForNextLevel(currentLevel: number): number {
  // Points needed for next level
  return currentLevel * currentLevel * 100
}

export function getProgressToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points)
  const pointsForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100
  const pointsForNextLevel = getPointsForNextLevel(currentLevel)
  const pointsInCurrentLevel = points - pointsForCurrentLevel
  const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel

  return (pointsInCurrentLevel / pointsNeededForLevel) * 100
}

// Get leaderboard data from database
export function getLeaderboard(): User[] {
  const raw = localStorage.getItem("currentUser")
  const currentUser = raw ? JSON.parse(raw) : null

  // Default preferences used when no currentUser is present
  const defaultPreferences = {
    pomodoroLength: 25,
    breakLength: 5,
    longBreakLength: 15,
    pomodorosUntilLongBreak: 4,
    workHoursStart: "09:00",
    workHoursEnd: "17:00",
    wellnessReminders: true,
    wellnessReminderInterval: 30,
    notificationsEnabled: true,
    theme: "dark",
  }

  // Only show current user on leaderboard if they exist
  const leaderboardUsers: User[] = []
  
  if (currentUser && typeof currentUser === "object" && currentUser.id) {
    leaderboardUsers.push(currentUser as User)
  }

  // Sort by total points (guard against missing stats)
  return leaderboardUsers.sort((a, b) => (b.stats?.totalPoints ?? 0) - (a.stats?.totalPoints ?? 0))
}
