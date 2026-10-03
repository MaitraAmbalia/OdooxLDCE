import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ForgotPassword() {
  usePageTitle("Reset password");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setErrorMessage("");
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.email.trim() }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not send reset instructions");
      setSubmittedEmail(data.email.trim());
    } catch (error) {
      setErrorMessage(error.message || "Could not send reset instructions.");
    }
  };

  return (
    <section className="page-container flex min-h-[72vh] flex-col justify-center py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <Button asChild variant="ghost" className="mb-5 -ml-3"><Link to="/login"><ArrowLeft aria-hidden="true" /> Back to login</Link></Button>
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Mail className="size-5" aria-hidden="true" /></span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Reset your password</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter the email associated with your Skyline account.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          {submittedEmail ? (
            <div className="text-center" role="status">
              <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-semibold">Check your inbox</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">If an account exists for <span className="font-medium text-foreground">{submittedEmail}</span>, reset instructions have been sent.</p>
              <Button asChild className="mt-6 w-full"><Link to="/login">Return to login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {errorMessage && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{errorMessage}</div>}
              <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium">Email address</label>
              <Input id="recovery-email" type="email" autoComplete="email" aria-invalid={!!errors.email} placeholder="you@nirmauni.ac.in" {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email address" } })} />
              {errors.email && <p className="mt-2 text-sm text-destructive" role="alert">{errors.email.message}</p>}
              <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send reset link"}</Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
