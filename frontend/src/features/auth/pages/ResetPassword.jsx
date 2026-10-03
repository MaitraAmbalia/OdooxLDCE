import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AlertCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ResetPassword() {
  usePageTitle("Create new password");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch("password", "");

  const onSubmit = async (data) => {
    setErrorMessage("");
    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword: data.password }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not reset password");
      navigate("/login?reset=success");
    } catch (error) {
      setErrorMessage(error.message || "Could not reset password.");
    }
  };

  if (token.length < 20) {
    return (
      <section className="page-container flex min-h-[72vh] items-center justify-center py-12 sm:py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center sm:p-9">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="size-6" aria-hidden="true" /></span>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">This reset link isn’t valid</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The link may be incomplete or expired. Request a new one to continue securely.</p>
          <Button asChild className="mt-6 w-full"><Link to="/forgot-password">Request a new link</Link></Button>
          <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/login">Back to login</Link></Button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-container flex min-h-[72vh] flex-col justify-center py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><KeyRound className="size-5" aria-hidden="true" /></span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Create a new password</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Choose a password you don’t use for another account.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {errorMessage && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{errorMessage}</div>}
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium">New password</label>
            <Input id="new-password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password", { required: "Password is required", minLength: { value: 8, message: "Use at least 8 characters" }, maxLength: { value: 128, message: "Use no more than 128 characters" } })} />
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className={"h-full rounded-full transition-all " + (password.length >= 8 ? "w-full bg-success" : password.length >= 4 ? "w-1/2 bg-warning" : "w-1/4 bg-muted-foreground/30")} /></div>
              <span className="text-xs tabular-nums text-muted-foreground">{Math.min(password.length, 8)}/8 minimum</span>
            </div>
            {errors.password && <p className="mt-2 text-sm text-destructive" role="alert">{errors.password.message}</p>}

            <label htmlFor="confirm-password" className="mb-2 mt-5 block text-sm font-medium">Confirm new password</label>
            <Input id="confirm-password" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword", { required: "Confirm your new password", validate: (value) => value === password || "Passwords do not match" })} />
            {errors.confirmPassword && <p className="mt-2 text-sm text-destructive" role="alert">{errors.confirmPassword.message}</p>}

            <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Update password"}</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
