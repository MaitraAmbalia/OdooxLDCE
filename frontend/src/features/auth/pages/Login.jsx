import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { 
  ShieldCheck, Lock, Mail, ArrowRight, Zap, GraduationCap, 
  Crown, DollarSign, Ticket, Users, CheckCircle2 
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";

export default function Login() {
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
      color: "from-slate-800 to-slate-900 text-white",
      desc: "Approve event proposals, lock budgets & appoint leaders."
    },
    {
      title: "Club President",
      email: "president@nirmauni.ac.in",
      role: "PRESIDENT",
      badge: "Executive Head",
      icon: Crown,
      color: "from-blue-600 to-indigo-700 text-white",
      desc: "Schedule meetings, build agendas & executive oversight."
    },
    {
      title: "Treasurer",
      email: "treasurer@nirmauni.ac.in",
      role: "TREASURER",
      badge: "Finance & Ledger",
      icon: DollarSign,
      color: "from-emerald-600 to-teal-700 text-white",
      desc: "Double-entry general ledger & reimbursement approvals."
    },
    {
      title: "Event Head",
      email: "eventhead@nirmauni.ac.in",
      role: "EVENT_HEAD",
      badge: "Ticketing & Door",
      icon: Ticket,
      color: "from-purple-600 to-indigo-700 text-white",
      desc: "Propose new events, configure ticket tiers & door staff."
    },
    {
      title: "Volunteer",
      email: "volunteer1@nirmauni.ac.in",
      role: "VOLUNTEER",
      badge: "Operations & Shifts",
      icon: Users,
      color: "from-teal-600 to-emerald-700 text-white",
      desc: "Task Kanban, isolated team chat & receipt upload."
    },
    {
      title: "Active Member",
      email: "student1@nirmauni.ac.in",
      role: "MEMBER",
      badge: "50% Discount Perks",
      icon: ShieldCheck,
      color: "from-amber-500 to-amber-600 text-slate-950 font-bold",
      desc: "Digital QR card, member Gala passes & leadership applications."
    }
  ];

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F8FAFC] to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center mb-8">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-display font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md mb-4">
            S
          </span>
          <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Sign in to Skyline
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Access your membership pass, event tickets, or leadership portal.
          </p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
          
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("PERSONAS")}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "PERSONAS" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Demo Personas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CREDENTIALS")}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "CREDENTIALS" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard Sign In</span>
            </button>
          </div>

          {registered && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registration completed successfully! Select your account below to sign in.</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: 1-Click Demo Personas */}
          {activeTab === "PERSONAS" ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center mb-2">
                Click any persona to log in instantly with seeded permissions and live database records:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personas.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => onSubmit({ email: p.email, password: "Password123!" })}
                      className="group p-3.5 border border-slate-200 rounded-2xl bg-white hover:border-blue-400 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${p.color} flex items-center justify-center shadow-xs`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {p.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {p.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-1">
                          {p.desc}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">{p.email}</span>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  University Email Address
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
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
                className="w-full justify-center shadow-md shadow-blue-500/20"
                size="md"
              >
                {isSubmitting ? "Authenticating..." : "Sign In &rarr;"}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an active account yet?{" "}
            <Link to="/join" className="font-bold text-blue-600 hover:underline">
              Join Club Membership (₹300)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
