import { cn } from "../../lib/utils";

// One status pill for the whole app: tone decides colour, label is the friendly name.
const TONE = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info-soft text-info",
  primary: "bg-secondary text-secondary-foreground",
  neutral: "bg-muted text-muted-foreground",
};

const STATUS = {
  // memberships
  ACTIVE: ["Active", "success"],
  PENDING: ["Pending", "warning"],
  LAPSED: ["Expired", "danger"],
  CANCELLED: ["Cancelled", "neutral"],
  // events
  DRAFT: ["Draft", "neutral"],
  PENDING_APPROVAL: ["Awaiting review", "warning"],
  CHANGES_REQUESTED: ["Changes requested", "warning"],
  APPROVED: ["Approved", "success"],
  PUBLISHED: ["Published", "success"],
  CLOSED: ["Closed", "neutral"],
  REJECTED: ["Rejected", "danger"],
  // claims
  SUBMITTED: ["Submitted", "warning"],
  APPROVED_L1: ["Awaiting President", "info"],
  PAID: ["Paid", "success"],
  WITHDRAWN: ["Withdrawn", "neutral"],
  // cash
  PENDING_VERIFICATION: ["Pending", "warning"],
  VERIFIED: ["Verified", "success"],
  // tickets
  ISSUED: ["Ready to scan", "primary"],
  CHECKED_IN: ["Checked in", "success"],
  REFUNDED: ["Refunded", "neutral"],
  // orders
  CREATED: ["Awaiting payment", "warning"],
  READY: ["Ready for pickup", "info"],
  COLLECTED: ["Collected", "success"],
  FULFILLED: ["Collected", "success"],
  // tasks
  TODO: ["To do", "neutral"],
  IN_PROGRESS: ["In progress", "info"],
  BLOCKED: ["Blocked", "danger"],
  DONE: ["Done", "success"],
};

export function statusLabel(status) {
  return STATUS[(status || "").toUpperCase()]?.[0] ?? String(status || "Unknown").replaceAll("_", " ").toLowerCase();
}

export function StatusBadge({ status, label, tone, className }) {
  const [defaultLabel, defaultTone] = STATUS[(status || "").toUpperCase()] ?? [statusLabel(status), "neutral"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[tone ?? defaultTone], className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}
