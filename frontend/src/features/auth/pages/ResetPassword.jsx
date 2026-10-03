import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  
  const password = watch("password", "");

  const onSubmit = async (data) => {
    // API endpoint: POST /auth/reset-password ({ token, newPassword })
    console.log("Reset password data", { token, newPassword: data.password });
    // On success, redirect to login
    navigate("/login?reset=success");
  };

  if (!token) {
    return (
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h1 className="mt-6 text-3xl font-display font-extrabold text-[var(--color-ink)]">
            Invalid Link
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            The password reset link is invalid or has expired.
          </p>
          <div className="mt-6">
            <Link to="/forgot-password" className="text-sm font-medium text-[var(--color-dusk)] hover:underline">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-[var(--color-ink)]">
          Create new password
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Please enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow sm:rounded-[10px] sm:px-10 border border-[var(--color-line)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-ink)]">
                New Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  {...register("password", { 
                    required: "Password is required",
                    minLength: { value: 10, message: "Password must be at least 10 characters" }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm"
                />
                {/* Length meter as per specification */}
                <div className="mt-2 text-xs text-[var(--color-muted)] flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 10 ? 'bg-[var(--color-ok)]' : 'bg-[var(--color-line)]'}`}></div>
                  <span>{Math.min(password.length, 10)}/10 characters</span>
                </div>
                {errors.password && <p className="mt-1 text-sm text-[var(--color-stop)]">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-[6px] shadow-sm text-sm font-medium text-white bg-[var(--color-dusk)] hover:bg-opacity-90 focus:outline-none disabled:opacity-50"
              >
                Reset password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
