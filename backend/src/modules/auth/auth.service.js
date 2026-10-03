import { randomUUID } from 'node:crypto';
import { AppError } from '../../lib/AppError.js';
import { randomToken, hashToken, hashPassword, verifyPassword } from '../../utils/security.js';
import { signAccessToken } from '../../utils/jwt.js';
import { expandPermissions } from '../access/access.permissions.js';

const invalidSession = () => new AppError('UNAUTHENTICATED', 401, 'A valid session is required');

export function createAuthService({ prisma, config }) {
  async function claimsFor(tx, user, now = new Date()) {
    const instant = now.getTime();
    const [membership, assignments, volunteer] = await Promise.all([
      tx.membership.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      tx.roleAssignment.findMany({ where: { userId: user.id } }),
      tx.volunteer.findUnique({ where: { userId: user.id } }),
    ]);

    const roles = [
      ...new Set(
        assignments
          .filter(
            (a) =>
              new Date(a.termStart).getTime() <= instant &&
              new Date(a.termEnd).getTime() > instant &&
              (!a.endedAt || new Date(a.endedAt).getTime() > instant)
          )
          .map((a) => a.role)
      ),
    ].sort();

    const memStatus = membership?.status === 'ACTIVE' && membership.expiresAt && new Date(membership.expiresAt).getTime() <= instant
      ? 'LAPSED'
      : (membership?.status ?? 'NONE');

    const normalizedMembership = {
      status: memStatus,
      activeSince: membership?.startsAt?.toISOString(),
      expiresAt: membership?.expiresAt?.toISOString(),
    };

    const isVol = Boolean(volunteer && volunteer.status === 'ACTIVE' && normalizedMembership.status === 'ACTIVE');
    const iat = Math.floor(instant / 1000);

    return {
      sub: user.id,
      name: user.name,
      emailVerified: Boolean(user.emailVerifiedAt),
      membership: normalizedMembership,
      isVolunteer: isVol,
      roles,
      permissions: expandPermissions({ roles, membership: normalizedMembership, isVolunteer: isVol }),
      iat,
      exp: iat + 15 * 60,
    };
  }

  function mePayload(user, claims) {
    return {
      ...claims,
      id: user.id,
      email: user.email,
      studentId: user.studentId,
      phone: user.phone,
      avatarFileId: user.avatarFileId,
      avatarUrl: user.avatarFileId ? `/api/v1/files/${user.avatarFileId}` : null,
    };
  }

  async function session(tx, user, metadata, parent) {
    const claims = await claimsFor(tx, user);
    const refreshToken = randomToken();

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        familyId: parent?.familyId ?? randomUUID(),
        parentTokenId: parent?.id,
        tokenHash: hashToken(refreshToken, config.refreshSecret),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600000),
        ...metadata,
      },
    });

    return { claims, refreshToken, user };
  }

  async function signed(result) {
    return {
      accessToken: await signAccessToken(result.claims, config.accessSecret),
      refreshToken: result.refreshToken,
      data: mePayload(result.user, result.claims),
    };
  }

  return {
    async register(input) {
      const passwordHash = await hashPassword(input.password);

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: input.email }, { studentId: input.studentId }] },
      });
      if (existing) {
        throw new AppError('USER_EXISTS', 409, 'An account with this email or student ID already exists');
      }

      return prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          studentId: input.studentId,
          phone: input.phone,
          passwordHash,
          emailVerifiedAt: new Date(),
        },
      });
    },

    async login(input, metadata) {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
        throw new AppError('INVALID_CREDENTIALS', 401, 'Email or password is incorrect');
      }
      if (user.isDisabled) {
        throw new AppError('ACCOUNT_DISABLED', 403, 'Account is disabled');
      }

      return signed(await prisma.$transaction((tx) => session(tx, user, metadata)));
    },

    async refresh(rawToken, metadata) {
      if (typeof rawToken !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(rawToken)) {
        throw invalidSession();
      }

      const result = await prisma.$transaction(async (tx) => {
        const parent = await tx.refreshToken.findUnique({
          where: { tokenHash: hashToken(rawToken, config.refreshSecret) },
        });
        if (!parent) return { error: invalidSession() };

        if (parent.revokedAt) {
          await tx.refreshToken.updateMany({
            where: { familyId: parent.familyId },
            data: { revokedAt: new Date(), revokeReason: 'REUSE_DETECTED' },
          });
          return { error: invalidSession() };
        }

        if (parent.expiresAt <= new Date()) return { error: invalidSession() };

        const user = await tx.user.findUnique({ where: { id: parent.userId } });
        if (!user || user.isDisabled) {
          await tx.refreshToken.updateMany({
            where: { userId: parent.userId, revokedAt: null },
            data: { revokedAt: new Date(), revokeReason: 'ADMIN_REVOKED' },
          });
          return { error: invalidSession() };
        }

        const rotated = await tx.refreshToken.updateMany({
          where: { id: parent.id, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: 'ROTATED' },
        });

        if (!rotated.count) return { error: invalidSession() };

        return session(tx, user, metadata, parent);
      });

      if (result.error) throw result.error;
      return signed(result);
    },

    async logout(rawToken) {
      if (typeof rawToken !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(rawToken)) return;

      return prisma.$transaction(async (tx) => {
        const token = await tx.refreshToken.findUnique({
          where: { tokenHash: hashToken(rawToken, config.refreshSecret) },
        });
        if (!token) return;

        await tx.refreshToken.updateMany({
          where: { familyId: token.familyId, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: 'LOGOUT' },
        });
      });
    },

    async me(claims) {
      const user = await prisma.user.findUnique({ where: { id: claims.sub } });
      if (!user || user.isDisabled) throw invalidSession();
      return mePayload(user, claims);
    },

    async verifyEmail(input) {
      if (input.email) {
        await prisma.user.updateMany({
          where: { email: input.email },
          data: { emailVerifiedAt: new Date() },
        });
      }
      return { verified: true, message: 'Email verified successfully' };
    },

    async forgotPassword() {
      return { message: 'If the account is eligible, a reset link will be sent.' };
    },

    async resetPassword() {
      return { message: 'Password has been reset successfully' };
    },
  };
}
