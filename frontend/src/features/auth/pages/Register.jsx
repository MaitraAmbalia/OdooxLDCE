import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Register() {
  usePageTitle("Create an account");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  
  const password = watch("password", "");

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          studentId: data.studentId,
          password: data.password,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || "Registration failed");
      }
      navigate("/login?registered=true");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <section className="page-container flex min-h-[72vh] flex-col justify-center py-12 sm:py-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-sm font-medium text-primary">Your campus, connected</p>
        <h1 className="mt-3 text-center font-display text-4xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-border bg-card px-5 py-8 sm:px-10">
          {errorMsg && (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              {errorMsg}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Full name
              </label>
              <div className="mt-1">
                <Input
                  id="name"
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium">
                Student ID / roll number
              </label>
              <div className="mt-1">
                <Input
                  id="studentId"
                  type="text"
                  placeholder="e.g. 2026101"
                  {...register("studentId", { required: "Student ID is required" })}
                  aria-invalid={!!errors.studentId}
                />
                {errors.studentId && <p className="mt-1 text-sm text-destructive">{errors.studentId.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                College email
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  type="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Please enter a valid email address"
                    }
                  })}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  type="password"
                  {...register("password", { 
                    required: "Password is required",
                    minLength: { value: 10, message: "Password must be at least 10 characters" }
                  })}
                  aria-invalid={!!errors.password}
                />
                {/* Length meter as per specification */}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 10 ? 'bg-[#47725e]' : 'bg-border'}`}></div>
                  <span>{Math.min(password.length, 10)}/10 characters</span>
                </div>
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
