import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm();

  const onSubmit = async (data) => {
    // API endpoint: POST /auth/forgot-password ({ email })
    console.log("Forgot password data", data);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-[var(--color-ink)]">
          Reset password
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow sm:rounded-[10px] sm:px-10 border border-[var(--color-line)]">
          
          {isSubmitSuccessful ? (
            <div className="rounded-md bg-[var(--color-paper)] p-4 border border-[var(--color-line)]">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-[var(--color-ink)]">
                    Check your email
                  </h3>
                  <div className="mt-2 text-sm text-[var(--color-muted)]">
                    <p>If an account exists for that email, we have sent instructions to reset your password.</p>
                  </div>
                  <div className="mt-4">
                    <Link to="/login" className="text-sm font-medium text-[var(--color-dusk)] hover:underline">
                      &larr; Back to login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-ink)]">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: "Please enter a valid email address"
                      }
                    })}
                    className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm"
                  />
                  {errors.email && <p className="mt-1 text-sm text-[var(--color-stop)]">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-[6px] shadow-sm text-sm font-medium text-white bg-[var(--color-dusk)] hover:bg-opacity-90 focus:outline-none disabled:opacity-50"
                >
                  Send reset link
                </button>
              </div>
              
              <div className="text-center">
                <Link to="/login" className="text-sm font-medium text-[var(--color-dusk)] hover:underline">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
