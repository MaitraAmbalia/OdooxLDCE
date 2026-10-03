import { randomUUID, randomInt } from 'node:crypto';
import { transaction, lock } from '../../../platform/db/clients.js';
import { AppError } from '../../../platform/errors/AppError.js';
import { randomToken, hashToken } from '../../../platform/lib/security.js';
import { signAccessToken } from '../../../platform/auth/tokens.js';
import { audit } from '../../../platform/audit/index.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { claimsFor, mePayload, revokeSessions } from './repository.js';
import { queueEmail } from '../email/service.js';
import { optInAtRegistration } from '../newsletter/service.js';

export const ACCEPTED_MESSAGE = 'If the account is eligible, an email will be sent.';
const invalidToken = () => new AppError('TOKEN_INVALID', 400, 'Token is invalid or has already been used');
const invalidSession = () => new AppError('UNAUTHENTICATED', 401, 'A valid session is required');

async function issueEmailToken(tx, user, purpose, config) {
  const token = randomToken();
  const code = purpose === 'VERIFY_EMAIL' ? String(randomInt(0, 1000000)).padStart(6, '0') : null;
  const now = new Date();
  await tx.emailToken.updateMany({ where: { userId: user.id, purpose, usedAt: null }, data: { usedAt: now } });
  await tx.emailToken.create({ data: { userId: user.id, purpose, tokenHash: hashToken(token, config.refreshSecret),
    codeHash: code ? hashToken(`${user.id}:${code}`, config.refreshSecret) : null,
    expiresAt: new Date(now.getTime() + (code ? 15 : 30) * 60000) } });
  await queueEmail(tx, config, user.email, code ? 'verify-email' : 'reset-password', {
    ...(code ? { code } : {}), link: `${config.corsOrigin}/${code ? 'verify-email' : 'reset-password'}?token=${token}`,
  });
}

export function createAuthService({ client, config }) {
  async function session(tx, user, metadata, parent) {
    const claims = await claimsFor(tx, user);
    const refreshToken = randomToken();
    await tx.refreshToken.create({ data: { userId: user.id, familyId: parent?.familyId ?? randomUUID(),
      parentTokenId: parent?.id, tokenHash: hashToken(refreshToken, config.refreshSecret),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000), ...metadata } });
    return { claims, refreshToken, user };
  }
  async function signed(result) {
    return { accessToken: await signAccessToken(result.claims, config.accessSecret),
      refreshToken: result.refreshToken, data: mePayload(result.user, result.claims) };
  }
  return {
    async register(input, metadata) {
      if (input.email.split('@')[1] !== config.collegeEmailDomain) throw new AppError('COLLEGE_EMAIL_REQUIRED', 400, 'Use your college email address');
      const passwordHash = await hashPassword(input.password);
      return transaction(await client(), async (tx) => {
        await lock(tx, `register:${input.email}`);
        // Registration is deliberately uniform and never changes an existing account.
        const existing = await tx.user.findFirst({ where: { OR: [{ email: input.email }, { studentId: input.studentId }] } });
        if (existing) return;
        const user = await tx.user.create({ data: { name: input.name, email: input.email, studentId: input.studentId,
          phone: input.phone, passwordHash } });
        await issueEmailToken(tx, user, 'VERIFY_EMAIL', config);
        if (input.newsletterOptIn) await optInAtRegistration(tx, user, config, metadata);
      }).catch((error) => { if (error.code !== 'P2002') throw error; });
    },

    async resend(email) {
      return transaction(await client(), async (tx) => {
        const user = await tx.user.findUnique({ where: { email } });
        if (!user || user.isDisabled || user.emailVerifiedAt) return;
        await lock(tx, `email:${user.id}`);
        await issueEmailToken(tx, user, 'VERIFY_EMAIL', config);
      });
    },

    async verify(input) {
      const error = await transaction(await client(), async (tx) => {
        let token;
        if (input.token) token = await tx.emailToken.findUnique({ where: { tokenHash: hashToken(input.token, config.refreshSecret) } });
        else {
          const user = await tx.user.findUnique({ where: { email: input.email } });
          if (!user) throw invalidToken();
          await lock(tx, `email:${user.id}`);
          token = await tx.emailToken.findFirst({ where: { userId: user.id, purpose: 'VERIFY_EMAIL', usedAt: null }, orderBy: { createdAt: 'desc' } });
        }
        if (!token || token.purpose !== 'VERIFY_EMAIL' || token.usedAt || token.failedAttempts >= 5) throw invalidToken();
        if (token.expiresAt <= new Date()) throw new AppError('TOKEN_EXPIRED', 400, 'Token has expired');
        if (!input.token && token.codeHash !== hashToken(`${token.userId}:${input.code}`, config.refreshSecret)) {
          await tx.emailToken.update({ where: { id: token.id }, data: { failedAttempts: { increment: 1 } } });
          return invalidToken(); // Throw after commit so failed-attempt counts survive.
        }
        const user = await tx.user.findUnique({ where: { id: token.userId } });
        if (!user || user.isDisabled) throw invalidToken();
        const consumed = await tx.emailToken.updateMany({ where: { id: token.id, usedAt: null, failedAttempts: { lt: 5 }, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        if (!consumed.count) throw invalidToken();
        await tx.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } });
      });
      if (error) throw error;
    },

    async login(input, metadata) {
      const db = await client();
      const user = await db.user.findUnique({ where: { email: input.email } });
      if (!user || !await verifyPassword(user.passwordHash, input.password)) {
        throw new AppError('INVALID_CREDENTIALS', 401, 'Email or password is incorrect');
      }
      return signed(await transaction(db, async (tx) => {
        await lock(tx, `user:${user.id}`);
        const current = await tx.user.findUnique({ where: { id: user.id } });
        if (!current || current.passwordHash !== user.passwordHash) throw new AppError('INVALID_CREDENTIALS', 401, 'Email or password is incorrect');
        if (current.isDisabled) throw new AppError('ACCOUNT_DISABLED', 403, 'Account is disabled');
        if (!current.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', 403, 'Verify your email first');
        return session(tx, current, metadata);
      }));
    },

    async refresh(rawToken, metadata) {
      if (typeof rawToken !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(rawToken)) throw invalidSession();
      const result = await transaction(await client(), async (tx) => {
        const parent = await tx.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken, config.refreshSecret) } });
        if (!parent) return { error: invalidSession() };
        await lock(tx, `user:${parent.userId}`);
        await lock(tx, `refresh:${parent.familyId}`);
        if (parent.revokedAt) {
          // Return the error, then throw outside the transaction: revocation must commit.
          await tx.refreshToken.updateMany({ where: { familyId: parent.familyId }, data: { revokedAt: new Date(), revokeReason: 'REUSE_DETECTED' } });
          await audit(tx, { actorId: parent.userId, action: 'auth.refresh.reuse', entityType: 'session', entityId: parent.id });
          return { error: invalidSession() };
        }
        if (parent.expiresAt <= new Date()) return { error: invalidSession() };
        const user = await tx.user.findUnique({ where: { id: parent.userId } });
        if (!user || user.isDisabled || !user.emailVerifiedAt) {
          await revokeSessions(tx, parent.userId);
          return { error: invalidSession() };
        }
        const rotated = await tx.refreshToken.updateMany({ where: { id: parent.id, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: 'ROTATED' } });
        if (!rotated.count) return { error: invalidSession() };
        return session(tx, user, metadata, parent);
      });
      if (result.error) throw result.error;
      return signed(result);
    },

    async logout(rawToken) {
      if (typeof rawToken !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(rawToken)) return;
      return transaction(await client(), async (tx) => {
        const token = await tx.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken, config.refreshSecret) } });
        if (!token) return;
        await lock(tx, `user:${token.userId}`);
        await tx.refreshToken.updateMany({ where: { familyId: token.familyId, revokedAt: null }, data: { revokedAt: new Date(), revokeReason: 'LOGOUT' } });
      });
    },

    async forgot(email) {
      return transaction(await client(), async (tx) => {
        const user = await tx.user.findUnique({ where: { email } });
        if (!user || user.isDisabled || !user.emailVerifiedAt) return;
        await lock(tx, `email:${user.id}`);
        await issueEmailToken(tx, user, 'RESET_PASSWORD', config);
      });
    },

    async reset(input) {
      const passwordHash = await hashPassword(input.newPassword);
      return transaction(await client(), async (tx) => {
        const token = await tx.emailToken.findUnique({ where: { tokenHash: hashToken(input.token, config.refreshSecret) } });
        if (!token || token.purpose !== 'RESET_PASSWORD' || token.usedAt) throw invalidToken();
        if (token.expiresAt <= new Date()) throw new AppError('TOKEN_EXPIRED', 400, 'Token has expired');
        await lock(tx, `user:${token.userId}`);
        const user = await tx.user.findUnique({ where: { id: token.userId } });
        if (!user || user.isDisabled) throw invalidToken();
        const consumed = await tx.emailToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        // Conditional consumption and the password/session changes share one transaction.
        if (!consumed.count) throw invalidToken();
        await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
        await tx.emailToken.updateMany({ where: { userId: user.id, purpose: 'RESET_PASSWORD', usedAt: null }, data: { usedAt: new Date() } });
        await revokeSessions(tx, user.id, 'PASSWORD_RESET');
        await audit(tx, { actorId: user.id, action: 'auth.password.reset', entityType: 'user', entityId: user.id });
      });
    },

    async me(claims) {
      const user = await (await client()).user.findUnique({ where: { id: claims.sub } });
      if (!user || user.isDisabled) throw invalidSession();
      return mePayload(user, claims);
    },
  };
}
