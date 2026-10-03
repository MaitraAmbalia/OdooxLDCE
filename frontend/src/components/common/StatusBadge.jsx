import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowUpRight, ShieldCheck, Flame, Ban } from "lucide-react";
import { cn } from "../../lib/utils";

export function StatusBadge({ status, className }) {
  const normalized = (status || "").toUpperCase();

  const configs = {
    ACTIVE: { label: "Active", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    APPROVED: { label: "Approved", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    PAID: { label: "Paid", bg: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold", icon: CheckCircle2 },
    DONE: { label: "Completed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    PUBLISHED: { label: "Live / Published", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: ArrowUpRight },
    IN_PROGRESS: { label: "In Progress", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Flame },
    TODO: { label: "To Do", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
    PENDING: { label: "Pending", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock },
    SUBMITTED: { label: "Submitted", bg: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock },
    PENDING_APPROVAL: { label: "Awaiting Review", bg: "bg-amber-50 text-amber-800 border-amber-300", icon: Clock },
    CHANGES_REQUESTED: { label: "Changes Requested", bg: "bg-amber-50 text-amber-900 border-amber-300 font-bold", icon: AlertTriangle },
    BLOCKED: { label: "Blocked", bg: "bg-red-50 text-red-700 border-red-200", icon: AlertTriangle },
    REJECTED: { label: "Rejected", bg: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
    LAPSED: { label: "Expired", bg: "bg-red-50 text-red-700 border-red-200", icon: Ban },
    MEMBER: { label: "Member Only", bg: "bg-amber-100 text-amber-900 border-amber-300 font-bold", icon: ShieldCheck },
  };

  const config = configs[normalized] || {
    label: status || "Unknown",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs whitespace-nowrap",
        config.bg,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}
