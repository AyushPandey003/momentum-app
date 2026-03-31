import { ForgotPasswordForm } from "@/components/forms/forget-password-form";
import { AuthPageShell } from "@/components/forms/auth-page-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Reset Your Password"
      subtitle="Enter your email and we will send a secure reset link so you can get back into your routine."
      helperText="Choose a strong new password and continue your focus plan."
    >
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </AuthPageShell>
  );
}