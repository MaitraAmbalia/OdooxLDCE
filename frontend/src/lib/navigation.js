import { isLeadershipUser } from "./access.js";

export const PUBLIC_NAVIGATION = Object.freeze([
  ["/events", "Events"],
  ["/shop", "Shop"],
  ["/calendar", "Calendar"],
  ["/announcements", "Updates"],
]);

const LEADERSHIP_NAVIGATION = Object.freeze([
  { to: "/manage", label: "Overview", leadership: true },
  { to: "/manage/meetings", label: "Meetings", leadership: true },
  { to: "/manage/events", label: "Event operations", anyPermission: ["event.propose", "event.approve", "event.report.read", "event.publish"] },
  { to: "/manage/sponsorship", label: "Sponsorship", anyPermission: ["sponsorship.crm.read", "sponsorship.crm.manage"] },
  { to: "/manage/claims", label: "Claims", anyPermission: ["claim.review", "claim.review.high", "claim.review.treasurer", "claim.pay"] },
  { to: "/manage/cash", label: "Cash verification", anyPermission: ["cash.verify"] },
  { to: "/manage/memberships", label: "Membership dues", anyPermission: ["member.read.any", "membership.tier.manage", "membership.remind"] },
  { to: "/manage/finance/ledger", label: "Ledger", anyPermission: ["ledger.read"] },
  { to: "/manage/budget", label: "Budgets", anyPermission: ["budget.limit.manage", "budget.allocate"] },
  { to: "/manage/finance/reports", label: "Reports", anyPermission: ["finance.report.read"] },
  { to: "/manage/projects", label: "Projects & tasks", anyPermission: ["project.manage", "volunteer.manage"] },
  { to: "/manage/orders", label: "Fulfilment", anyPermission: ["order.fulfil"] },
  { to: "/manage/newsletter", label: "Newsletter", anyPermission: ["newsletter.send", "newsletter.stats.read"] },
  { to: "/manage/announcements/new", label: "Publish update", anyPermission: ["announcement.publish"] },
  { to: "/manage/selection/cycles", label: "Elections", anyPermission: ["selection.manage"] },
]);

const ROLE_LABELS = Object.freeze({
  MENTOR: "Mentor",
  PRESIDENT: "President",
  TREASURER: "Treasurer",
  EVENT_HEAD: "Event Head",
  VOLUNTEER_HEAD: "Volunteer Head",
  MARKETING_HEAD: "Marketing Head",
  SPONSORSHIP_HEAD: "Sponsorship Head",
});

export function getWorkspaceNavigation(user) {
  if (!user) return null;
  const roles = user.roles || [];
  const permissions = user.permissions || [];

  if (isLeadershipUser(user)) {
    const leadershipRoles = roles.filter((role) => ROLE_LABELS[role]);
    const label = leadershipRoles.length === 1
      ? `${ROLE_LABELS[leadershipRoles[0]]} workspace`
      : "Leadership workspace";
    const links = LEADERSHIP_NAVIGATION
      .filter((item) => item.leadership || item.anyPermission?.some((permission) => permissions.includes(permission)))
      .map((item) => [item.to, item.label]);
    if (user.isVolunteer || roles.includes("VOLUNTEER_HEAD")) links.push(["/volunteer", "Volunteer space"]);
    if (permissions.includes("claim.submit") && !links.some(([to]) => to === "/manage/claims")) {
      links.push(["/volunteer/claims/new", "Submit a claim"]);
    }
    return { label, kind: "leadership", links };
  }

  if (user.isVolunteer || roles.includes("VOLUNTEER")) {
    return {
      label: "Volunteer workspace",
      kind: "volunteer",
      links: [["/volunteer", "My work"], ["/volunteer/claims/new", "Submit a claim"]],
    };
  }

  const links = [["/me", "Overview"], ["/me/membership", "Membership"], ["/me/tickets", "My tickets"], ["/me/orders", "My orders"]];
  if (user.membership?.status === "ACTIVE") links.push(["/selection", "Leadership opportunities"]);
  return { label: "My Skyline", kind: "account", links };
}

export function isNavigationActive(pathname, to) {
  if (["/manage", "/volunteer", "/me"].includes(to)) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}
