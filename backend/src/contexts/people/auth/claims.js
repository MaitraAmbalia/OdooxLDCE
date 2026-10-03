import { ACCESS_TOKEN_TTL_SECONDS } from '../../../platform/auth/claims.js';
import { AppError } from '../../../lib/AppError.js';
import { expandPermissions } from '../access/permissions.js';

// Trusted repository data only; never pass client-provided roles or permissions.
export function buildAccessClaims({ user, membership = { status: 'NONE' }, assignments = [], isVolunteer = false, now = new Date() }) {
  if (user.isDisabled) throw new AppError('FORBIDDEN', 403, 'Account is disabled');
  const instant = now.getTime();
  const roles = [...new Set(assignments.filter((assignment) =>
    new Date(assignment.termStart).getTime() <= instant &&
    new Date(assignment.termEnd).getTime() > instant &&
    (!assignment.endedAt || new Date(assignment.endedAt).getTime() > instant),
  ).map((assignment) => assignment.role))].sort();

  // Expired membership must never grant leadership privileges during token minting.
  const normalizedMembership = { ...membership };
  if (membership.status === 'ACTIVE' && membership.expiresAt && new Date(membership.expiresAt).getTime() <= instant) {
    normalizedMembership.status = 'LAPSED';
  }
  const volunteer = isVolunteer && normalizedMembership.status === 'ACTIVE';
  const iat = Math.floor(instant / 1000);
  return {
    sub: user.id,
    name: user.name,
    emailVerified: Boolean(user.emailVerifiedAt),
    membership: normalizedMembership,
    isVolunteer: volunteer,
    roles,
    permissions: expandPermissions({ roles, membership: normalizedMembership, isVolunteer: volunteer }),
    iat,
    exp: iat + ACCESS_TOKEN_TTL_SECONDS,
  };
}
