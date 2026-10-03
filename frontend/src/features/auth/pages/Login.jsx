import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    // To be integrated with API
    console.log("Login data", data);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-[var(--color-ink)]">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Or{" "}
          <Link to="/register" className="font-medium text-[var(--color-dusk)] hover:underline">
            create a new account
          </Link>
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
                  {...register("email", { required: "Email is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm"
                />
                {errors.email && <p className="mt-1 text-sm text-[var(--color-stop)]">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-ink)]">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  {...register("password", { required: "Password is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm"
                />
                {errors.password && <p className="mt-1 text-sm text-[var(--color-stop)]">{errors.password.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-[var(--color-dusk)] hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-[6px] shadow-sm text-sm font-medium text-white bg-[var(--color-dusk)] hover:bg-opacity-90 focus:outline-none disabled:opacity-50"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
