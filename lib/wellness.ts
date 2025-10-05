export interface WellnessTip {
  id: string
  category: "hydration" | "posture" | "eyes" | "movement" | "mental"
  title: string
  description: string
  icon: string
}

export const WELLNESS_TIPS: WellnessTip[] = [
  {
    id: "hydration-1",
    category: "hydration",
    title: "Stay Hydrated",
    description: "Drink a glass of water to stay refreshed and focused.",
    icon: "💧",
  },
  {
    id: "hydration-2",
    category: "hydration",
    title: "Water Break",
    description: "Time to hydrate! Your brain needs water to function optimally.",
    icon: "🚰",
  },
  {
    id: "posture-1",
    category: "posture",
    title: "Check Your Posture",
    description: "Sit up straight with your shoulders back and feet flat on the floor.",
    icon: "🪑",
  },
  {
    id: "posture-2",
    category: "posture",
    title: "Adjust Your Setup",
    description: "Ensure your screen is at eye level and your arms are at 90 degrees.",
    icon: "💺",
  },
  {
    id: "eyes-1",
    category: "eyes",
    title: "20-20-20 Rule",
    description: "Look at something 20 feet away for 20 seconds every 20 minutes.",
    icon: "👀",
  },
  {
    id: "eyes-2",
    category: "eyes",
    title: "Rest Your Eyes",
    description: "Close your eyes for a moment and let them rest from screen time.",
    icon: "😌",
  },
  {
    id: "movement-1",
    category: "movement",
    title: "Stretch Break",
    description: "Stand up and do some gentle stretches to release tension.",
    icon: "🤸",
  },
  {
    id: "movement-2",
    category: "movement",
    title: "Take a Walk",
    description: "A short walk can boost creativity and reduce stress.",
    icon: "🚶",
  },
  {
    id: "movement-3",
    category: "movement",
    title: "Move Your Body",
    description: "Do some light exercises or yoga poses to energize yourself.",
    icon: "🧘",
  },
  {
    id: "mental-1",
    category: "mental",
    title: "Deep Breathing",
    description: "Take 5 deep breaths to calm your mind and reduce stress.",
    icon: "🌬️",
  },
  {
    id: "mental-2",
    category: "mental",
    title: "Mindful Moment",
    description: "Take a moment to be present and appreciate your progress.",
    icon: "🧠",
  },
  {
    id: "mental-3",
    category: "mental",
    title: "Gratitude Practice",
    description: "Think of three things you're grateful for today.",
    icon: "🙏",
  },
]

export function getRandomWellnessTip(category?: WellnessTip["category"]): WellnessTip {
  const tips = category ? WELLNESS_TIPS.filter((tip) => tip.category === category) : WELLNESS_TIPS
  return tips[Math.floor(Math.random() * tips.length)]
}

export function shouldShowWellnessReminder(lastReminderTime: string | null, intervalMinutes: number): boolean {
  if (!lastReminderTime) return true

  const lastTime = new Date(lastReminderTime).getTime()
  const now = Date.now()
  const minutesSinceLastReminder = (now - lastTime) / (1000 * 60)

  return minutesSinceLastReminder >= intervalMinutes
}
