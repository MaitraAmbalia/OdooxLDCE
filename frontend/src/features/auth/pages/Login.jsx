import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ShieldCheck, Lock, Zap, GraduationCap,
  Crown, DollarSign, Ticket, Users, Handshake, CheckCircle2 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { usePageTitle } from "../../../hooks/usePageTitle";

export default function Login() {
  usePageTitle("Log in");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registered = searchParams.get("registered");
  const [activeTab, setActiveTab] = useState("PERSONAS"); // 'PERSONAS' or 'CREDENTIALS'

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || "Invalid email or password");
      }
      const user = json.data;
      if (user?.roles && user.roles.length > 0) {
        navigate("/manage");
      } else if (user?.isVolunteer) {
        navigate("/volunteer");
      } else {
        navigate("/me");
      }
      window.location.reload();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const personas = [
    {
      title: "Faculty Mentor",
      email: "mentor@nirmauni.ac.in",
      role: "MENTOR",
      badge: "Faculty Supervisor",
      icon: GraduationCap,
      color: "bg-[#272747] text-white",
      desc: "Approve event proposals, lock budgets & appoint leaders."
    },
    {
      title: "Club President",
      email: "president@nirmauni.ac.in",
      role: "PRESIDENT",
      badge: "Executive Head",
      icon: Crown,
      color: "bg-primary text-primary-foreground",
      desc: "Schedule meetings, build agendas & executive oversight."
    },
    {
      title: "Treasurer",
      email: "treasurer@nirmauni.ac.in",
      role: "TREASURER",
      badge: "Finance & Ledger",
      icon: DollarSign,
      color: "bg-[#345d4a] text-white",
      desc: "Double-entry general ledger & reimbursement approvals."
    },
    {
      title: "Event Head",
      email: "eventhead@nirmauni.ac.in",
      role: "EVENT_HEAD",
      badge: "Ticketing & Door",
      icon: Ticket,
      color: "bg-[#5b568c] text-white",
      desc: "Propose new events, configure ticket tiers & door staff."
    },
    {
      title: "Sponsorship Head",
      email: "sponsorship@nirmauni.ac.in",
      role: "SPONSORSHIP_HEAD",
      badge: "Odoo CRM",
      icon: Handshake,
      color: "bg-[#86533d] text-white",
      desc: "Build sponsor pipelines in Odoo and track event commitments."
    },
    {
      title: "Volunteer",
      email: "volunteer1@nirmauni.ac.in",
      role: "VOLUNTEER",
      badge: "Operations & Shifts",
      icon: Users,
      color: "bg-[#47725e] text-white",
      desc: "Task Kanban, isolated team chat & receipt upload."
    },
    {
      title: "Active Member",
      email: "student1@nirmauni.ac.in",
      role: "MEMBER",
      badge: "50% Discount Perks",
      icon: ShieldCheck,
      color: "bg-[#f5e4db] text-[#86533d]",
      desc: "Digital QR card, member Gala passes & leadership applications."
    }
  ];

  return (
    <section className="page-container flex min-h-[72vh] flex-col justify-center py-12 sm:py-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center mb-8">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
            S<span className="sr-only">kyline</span>
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            Sign in to Skyline
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Access your membership pass, event tickets, or leadership portal.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card px-6 py-8 sm:px-10">
          
          {/* Mode Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-medium" role="tablist" aria-label="Sign-in method">
            <button
              type="button"
              onClick={() => setActiveTab("PERSONAS")}
              role="tab"
              aria-selected={activeTab === "PERSONAS"}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 py-2 transition ${
                activeTab === "PERSONAS" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="size-3.5" />
              <span>Demo accounts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CREDENTIALS")}
              role="tab"
              aria-selected={activeTab === "CREDENTIALS"}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 py-2 transition ${
                activeTab === "CREDENTIALS" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="size-3.5" />
              <span>Email and password</span>
            </button>
          </div>

          {registered && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#b9d1c3] bg-[#e4eee8] p-4 text-xs text-[#345d4a]" role="status">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Registration completed successfully! Select your account below to sign in.</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive" role="alert">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: 1-Click Demo Personas */}
          {activeTab === "PERSONAS" ? (
            <div className="space-y-4">
              <p className="mb-2 text-center text-xs text-muted-foreground">
                Choose a demo role to preview its workspace.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personas.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => onSubmit({ email: p.email, password: "Password123!" })}
                      disabled={isSubmitting}
                      className="group flex min-h-40 flex-col justify-between rounded-xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`flex size-8 items-center justify-center rounded-lg ${p.color}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {p.badge}
                          </span>
                        </div>
                        <h2 className="text-sm font-semibold transition-colors group-hover:text-primary">
                          {p.title}
                        </h2>
                        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                          {p.desc}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[11px] font-medium text-primary">
                        <span className="max-w-[130px] truncate font-mono text-[10px] text-muted-foreground">{p.email}</span>
                        <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB 2: Standard Form */
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  University email
                </label>
                <Input
                  type="email"
                  placeholder="student1@nirmauni.ac.in"
                  {...register("email", { required: "Email is required" })}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  {...register("password", { required: "Password is required" })}
                  error={errors.password?.message}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full justify-center"
                size="md"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            Don't have an active account yet?{" "}
            <Link to="/join" className="font-medium text-primary hover:underline">
              Explore membership
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
