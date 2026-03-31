import Link from "next/link";
import { Sparkles } from "lucide-react";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  helperText?: string;
  children: React.ReactNode;
}

export function AuthPageShell({ title, subtitle, helperText, children }: AuthPageShellProps) {
  return (
    <div className="relative min-h-[calc(100svh-5.5rem)] overflow-hidden px-4 py-10 md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[10%] h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[12%] top-[22%] h-48 w-48 rounded-full bg-secondary/35 blur-3xl" />
        <div className="absolute bottom-[6%] left-1/3 h-56 w-56 rounded-full bg-accent/55 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-panel auth-enter rounded-[2rem] p-7 md:p-10 lg:min-h-[620px]">
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold tracking-tight">Momentum</span>
          </div>

          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Focus Ritual
            </p>
            <h1 className="max-w-lg text-4xl font-bold leading-tight md:text-5xl">
              {title}
            </h1>
            <p className="max-w-md text-muted-foreground md:text-lg">{subtitle}</p>
          </div>

          <div className="mt-12 space-y-3 text-sm text-muted-foreground">
            <p>Plan sessions with AI-powered routines and challenge-based progress.</p>
            {helperText && <p>{helperText}</p>}
            <Link href="/" className="inline-block pt-2 font-medium text-foreground underline-offset-4 hover:underline">
              Back to home
            </Link>
          </div>
        </section>

        <section className="auth-enter auth-delay-1 flex items-center justify-center">{children}</section>
      </div>
    </div>
  );
}
