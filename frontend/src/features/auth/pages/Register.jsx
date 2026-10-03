import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  
  const password = watch("password", "");

  const onSubmit = async (data) => {
    // To be integrated with API
    console.log("Register data", data);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-[var(--color-ink)]">
          Join Skyline
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--color-dusk)] hover:underline">
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--color-surface)] py-8 px-4 shadow sm:rounded-[10px] sm:px-10 border border-[var(--color-line)]">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--color-ink)]">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  {...register("name", { required: "Name is required" })}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--color-line)] rounded-[6px] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--color-dusk)] focus:border-[var(--color-dusk)] sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-sm text-[var(--color-stop)]">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-ink)]">
                College Email
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
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-ink)]">
                Password
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
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
