import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckCircle2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function VerifyEmail() {
  usePageTitle("Verify email");
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: { email: initialEmail, code: "" } });

  const onSubmit = async (data) => {
    setErrorMessage("");
    try {
      const payload = token ? { token } : { email: data.email.trim(), code: data.code.trim() };
      const response = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || "Could not verify email");
      setVerified(true);
    } catch (error) {
      setErrorMessage(error.message || "Could not verify email.");
    }
  };

  return (
    <section className="page-container flex min-h-[72vh] flex-col justify-center py-12 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><MailCheck className="size-5" aria-hidden="true" /></span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">{verified ? "Email verified" : "Verify your email"}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{verified ? "Your account is ready. You can now sign in." : token ? "Confirm this secure verification link to activate your account." : "Enter the six-digit code sent to your email address."}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          {verified ? (
            <div className="text-center" role="status">
              <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden="true" />
              <Button asChild size="lg" className="mt-6 w-full"><Link to="/login">Continue to login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {errorMessage && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{errorMessage}</div>}
              {!token && (
                <>
                  <label htmlFor="verification-email" className="mb-2 block text-sm font-medium">Email address</label>
                  <Input id="verification-email" type="email" autoComplete="email" readOnly={!!initialEmail} aria-invalid={!!errors.email} className={initialEmail ? "bg-secondary/50" : ""} {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email address" } })} />
                  {errors.email && <p className="mt-2 text-sm text-destructive" role="alert">{errors.email.message}</p>}

                  <label htmlFor="verification-code" className="mb-2 mt-5 block text-sm font-medium">Six-digit code</label>
                  <Input id="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" aria-invalid={!!errors.code} className="h-12 text-center font-mono text-lg tracking-[0.35em] sm:text-lg" {...register("code", { required: "Verification code is required", pattern: { value: /^\d{6}$/, message: "Enter the six-digit code" } })} />
                  {errors.code && <p className="mt-2 text-sm text-destructive" role="alert">{errors.code.message}</p>}
                </>
              )}

              {token && <div className="rounded-xl bg-secondary/50 p-4 text-sm leading-6 text-muted-foreground">This button will verify the account associated with your secure link.</div>}
              <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>{isSubmitting ? "Verifying…" : "Verify email"}</Button>
              <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/login">Back to login</Link></Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
