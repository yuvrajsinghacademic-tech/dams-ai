import {
  AuthShell,
  AuthInput,
  PrimaryButton,
  TextButton,
  FeedbackText,
} from "../components/AuthUI";

export default function LoginPage({
  loginForm,
  setLoginForm,
  onSubmit,
  onCreateAccount,
  onForgotPassword,
  onGoogleContinue,
  authError,
  authMessage,
}) {
  return (
    <AuthShell title="LOGIN" subtitle="Sign in to save your history and manage your plan.">
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          value={loginForm.identifier}
          onChange={(event) =>
            setLoginForm((prev) => ({
              ...prev,
              identifier: event.target.value,
            }))
          }
          placeholder="Email or Username"
        />

        <AuthInput
          type="password"
          value={loginForm.password}
          onChange={(event) =>
            setLoginForm((prev) => ({
              ...prev,
              password: event.target.value,
            }))
          }
          placeholder="Password"
        />

        <PrimaryButton type="submit">Login</PrimaryButton>

        <div className="flex items-center justify-between gap-4 pt-1">
          <TextButton onClick={onForgotPassword}>Forgot Password?</TextButton>
          <TextButton onClick={onCreateAccount}>Create Account</TextButton>
        </div>

        <div className="pt-2">
          <PrimaryButton onClick={onGoogleContinue}>Continue with Google</PrimaryButton>
        </div>

        <FeedbackText error={authError} message={authMessage} />
      </form>
    </AuthShell>
  );
}