export const LEADERSHIP_ROLES = Object.freeze([
  "PRESIDENT", "TREASURER", "EVENT_HEAD", "VOLUNTEER_HEAD",
  "MARKETING_HEAD", "SPONSORSHIP_HEAD", "MENTOR",
]);

const ROLE_LANDINGS = Object.freeze({
  MENTOR: "/manage",
  PRESIDENT: "/manage",
  TREASURER: "/manage/finance/ledger",
  EVENT_HEAD: "/manage/events",
  VOLUNTEER_HEAD: "/manage/projects",
  MARKETING_HEAD: "/manage/newsletter",
  SPONSORSHIP_HEAD: "/manage/sponsorship",
});

export function isLeadershipUser(user) {
  return Boolean(user?.roles?.some((role) => LEADERSHIP_ROLES.includes(role)));
}

export function getDefaultLandingPath(user) {
  const roles = user?.roles || [];
  const leadershipRole = LEADERSHIP_ROLES.find((role) => roles.includes(role));
  if (leadershipRole) return ROLE_LANDINGS[leadershipRole];
  if (user?.isVolunteer || roles.includes("VOLUNTEER")) return "/volunteer";
  return "/me";
}

export function getPostLoginPath(user, requestedRedirect) {
  if (isLeadershipUser(user)) return getDefaultLandingPath(user);
  const safeRedirect = typeof requestedRedirect === "string"
    && requestedRedirect.startsWith("/")
    && !requestedRedirect.startsWith("//")
    && !requestedRedirect.startsWith("/manage");
  return safeRedirect ? requestedRedirect : getDefaultLandingPath(user);
}
