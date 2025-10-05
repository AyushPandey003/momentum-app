import { AuthForm } from "@/components/auth-form"
import { Sparkles, Target, Calendar, Trophy, Brain, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Time Management
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance max-w-4xl">
            Build unstoppable <span className="text-primary">momentum</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl text-pretty">
            Your AI coach that breaks down overwhelming tasks, schedules your day intelligently, and keeps you focused
            with science-backed techniques.
          </p>
        </div>

        {/* Auth Form */}
        <div className="flex justify-center mb-24">
          <AuthForm />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Task Decomposition</h3>
            <p className="text-muted-foreground text-sm">
              Break down overwhelming assignments into manageable subtasks with AI-powered analysis.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Intelligent Scheduling</h3>
            <p className="text-muted-foreground text-sm">
              Automatically schedule tasks with Pomodoro technique integration and smart time blocking.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Procrastination Detection</h3>
            <p className="text-muted-foreground text-sm">
              Get gentle nudges when you're avoiding tasks, with supportive coaching to get back on track.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Gamification</h3>
            <p className="text-muted-foreground text-sm">
              Earn points, unlock achievements, and compete on leaderboards to stay motivated.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">LMS Integration</h3>
            <p className="text-muted-foreground text-sm">
              Sync assignments from Canvas, Blackboard, and more directly into your schedule.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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
