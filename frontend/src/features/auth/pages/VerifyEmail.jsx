import React from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email }
  });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    // API endpoint: POST /auth/verify-email ({ email, code })
    console.log("Verify email data", data);
    // On success, redirect to login or dashboard
    navigate("/login");
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-[var(--color-ink)]">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          We sent a 6-digit code to your email. Enter it below to confirm your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow sm:rounded-[10px] sm:px-10 border border-[var(--color-line)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-ink)]">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  readOnly={!!email}
                  {...register("email", { required: "Email is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm bg-[var(--color-paper)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[var(--color-ink)]">
                6-digit Code
              </label>
              <div className="mt-1">
                <input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  {...register("code", { 
                    required: "Code is required",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "Code must be exactly 6 digits"
                    }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm tracking-widest text-center text-lg"
                />
                {errors.code && <p className="mt-1 text-sm text-[var(--color-stop)]">{errors.code.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-[6px] shadow-sm text-sm font-medium text-white bg-[var(--color-dusk)] hover:bg-opacity-90 focus:outline-none disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
