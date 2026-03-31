import { LoginForm } from "@/components/forms/login-form";
import { AuthPageShell } from "@/components/forms/auth-page-shell";

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Welcome Back"
      subtitle="Resume your focus sprint, track your momentum, and keep your deep work streak alive."
      helperText="Use your existing account to continue where you left off."
    >
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </AuthPageShell>
  );
}