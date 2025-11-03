import { AIMentor } from "@/components/ai-mentor";

export default function MentorPage() {
  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">AI Mentor</h1>
        <p className="text-muted-foreground mb-6 text-base sm:text-lg">
          Get personalized advice on productivity, time management, and overcoming procrastination powered by AI.
        </p>
      </div>

      <AIMentor />
    </div>
  );
}
