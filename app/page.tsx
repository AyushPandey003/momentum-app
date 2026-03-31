// import { AuthForm } from "@/components/auth-form"
import Link from "next/link"
import { Sparkles, Target, Calendar, Trophy, Brain, Zap, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 pb-16 pt-12 md:pt-20">
        <div className="surface-panel relative overflow-hidden rounded-[2.5rem] p-8 md:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-secondary/30 blur-3xl" />

          <div className="relative mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            AI-Powered Time Management
          </div>

            <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              Flow With Purpose.
              <span className="block text-primary">Build Unstoppable Momentum.</span>
            </h1>

            <p className="max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Your AI coach breaks down overwhelm, plans your day, and helps you stay in deep work with supportive nudges.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <button className="btn-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:brightness-110">
                  Start Your Flow
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="surface-glass inline-flex items-center rounded-full px-6 py-3 font-semibold text-foreground transition hover:bg-accent/60">
                  Preview Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="surface-glass rounded-[2rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Task Decomposition</h3>
            <p className="text-muted-foreground text-sm">
              Break down overwhelming assignments into manageable subtasks with AI-powered analysis.
            </p>
          </div>

          <div className="surface-glass rounded-[2rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Intelligent Scheduling</h3>
            <p className="text-muted-foreground text-sm">
              Automatically schedule tasks with Pomodoro technique integration and smart time blocking.
            </p>
          </div>

          <div className="surface-glass rounded-[2rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Procrastination Detection</h3>
            <p className="text-muted-foreground text-sm">
              Get gentle nudges when you're avoiding tasks, with supportive coaching to get back on track.
            </p>
          </div>

          <div className="surface-glass rounded-[2rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gamification</h3>
            <p className="text-muted-foreground text-sm">
              Earn points, unlock achievements, and compete on leaderboards to stay motivated.
            </p>
          </div>

          <div className="surface-glass rounded-[2rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">LMS Integration</h3>
            <p className="text-muted-foreground text-sm">
              Sync assignments from Canvas, Blackboard, and more directly into your schedule.
            </p>
          </div>

          <div className="surface-glass rounded-[2rem] p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Wellness Scheduling</h3>
            <p className="text-muted-foreground text-sm">
              Automatic breaks, exercise reminders, and sleep tracking to maintain peak performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
