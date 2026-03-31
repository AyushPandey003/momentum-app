import { SignupForm } from "@/components/forms/signup-form";
import { AuthPageShell } from "@/components/forms/auth-page-shell";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create Your Momentum Account"
      subtitle="Set up your profile to plan sessions, enter challenges, and turn focus into measurable progress."
      helperText="A clean setup now means stronger consistency every day."
    >
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </AuthPageShell>
  );
}