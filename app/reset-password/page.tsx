import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { AuthPageShell } from "@/components/forms/auth-page-shell";

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      title="Create A New Password"
      subtitle="Set a fresh password for your account and jump right back into building momentum."
      helperText="For security, avoid reusing older passwords."
    >
      <div className="w-full max-w-md">
        <ResetPasswordForm />
      </div>
    </AuthPageShell>
  );
}