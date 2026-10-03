const map = {
  MENTOR: ['member.stats.read', 'role.read', 'role.assign', 'event.approve', 'event.report.read', 'ledger.read', 'budget.allocate', 'budget.limit.manage', 'claim.review.treasurer', 'finance.report.read', 'selection.manage', 'selection.review', 'audit.read', 'settings.policy.manage'],
  PRESIDENT: ['member.read.any', 'member.stats.read', 'membership.verify', 'role.read', 'event.propose', 'event.publish', 'event.report.read', 'ticket.checkin', 'ledger.read', 'claim.submit', 'claim.review.high', 'finance.report.read', 'announcement.publish', 'newsletter.stats.read', 'project.manage', 'chat.oversee', 'meeting.manage', 'audit.read', 'settings.manage', 'sponsorship.crm.read', 'sponsorship.crm.manage'],
  TREASURER: ['member.read.any', 'member.stats.read', 'membership.verify', 'membership.tier.manage', 'cash.verify', 'event.report.read', 'ledger.read', 'ledger.write', 'budget.limit.manage', 'claim.submit', 'claim.review', 'claim.pay', 'finance.report.read', 'approval.price.decide', 'order.refund', 'membership.remind', 'sponsorship.crm.read', 'sponsorship.receipt.record'],
  EVENT_HEAD: ['membership.verify', 'event.propose', 'event.publish', 'event.door.assign', 'event.report.read', 'ticket.checkin', 'claim.submit', 'sponsorship.crm.read'],
  VOLUNTEER_HEAD: ['member.read.any', 'claim.submit', 'volunteer.manage', 'project.manage', 'chat.oversee'],
  MARKETING_HEAD: ['member.stats.read', 'event.report.read', 'claim.submit', 'merch.manage', 'order.fulfil', 'announcement.publish', 'newsletter.send', 'newsletter.stats.read'],
  SPONSORSHIP_HEAD: ['event.report.read', 'sponsorship.crm.read', 'sponsorship.crm.manage'],
};

export const rolePermissions = Object.freeze(Object.fromEntries(
  Object.entries(map).map(([role, permissions]) => [role, Object.freeze(permissions)]),
));

export function expandPermissions({ roles = [], membership, isVolunteer }) {
  const effectiveRoles = roles.filter((role) => role === 'MENTOR' || membership?.status === 'ACTIVE');
  const permissions = effectiveRoles.flatMap((role) => rolePermissions[role] ?? []);
  if (isVolunteer && membership?.status === 'ACTIVE') permissions.push('claim.submit');
  return [...new Set(permissions)].sort();
}
