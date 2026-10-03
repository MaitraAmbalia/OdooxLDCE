import { transaction, lock } from '../../../platform/db/clients.js';
import { sanitizeUpload } from '../../../platform/storage/index.js';
import { AppError } from '../../../platform/errors/AppError.js';
import { audit } from '../../../platform/audit/index.js';

const missing = () => new AppError('NOT_FOUND', 404, 'File was not found');
export function createFilesService({ client, storage }) {
  return {
    async upload(userId, purpose, buffer, requestId) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', ...(purpose === 'APPLICATION_ATTACHMENT' ? ['application/pdf'] : [])];
      const sanitized = await sanitizeUpload(buffer, { allowed });
      const storageKey = await storage.put(sanitized.buffer, sanitized.mimeType);
      try {
        const file = await transaction(await client(), async (tx) => {
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user || user.isDisabled) throw missing();
          const file = await tx.peopleFile.create({ data: { ownerId: userId, purpose, storageKey,
            mimeType: sanitized.mimeType, byteSize: sanitized.byteSize, sha256: sanitized.sha256 } });
          await audit(tx, { actorId: userId, action: 'file.uploaded', entityType: 'file', entityId: file.id, requestId });
          return file;
        });
        return { id: file.id, purpose: file.purpose, mimeType: file.mimeType, byteSize: file.byteSize, url: `/api/v1/files/${file.id}` };
      } catch (error) { await storage.delete(storageKey); throw error; }
    },
    async read(id, claims, requestId) {
      const db = await client();
      const file = await db.peopleFile.findUnique({ where: { id } });
      if (!file || (file.purpose !== 'AVATAR' && file.ownerId !== claims?.sub && !claims?.permissions.includes('selection.review'))) throw missing();
      if (file.purpose === 'APPLICATION_ATTACHMENT') await transaction(db, (tx) => audit(tx, { actorId: claims.sub, action: 'file.private.read', entityType: 'file', entityId: id, requestId }));
      return { ...file, buffer: await storage.get(file.storageKey) };
    },
    async remove(id, userId, requestId) {
      const file = await transaction(await client(), async (tx) => {
        await lock(tx, `user:${userId}`);
        const file = await tx.peopleFile.findUnique({ where: { id } });
        if (!file || file.ownerId !== userId) throw missing();
        if (file.attachedAt || await tx.user.count({ where: { avatarFileId: id } })) throw new AppError('FILE_ATTACHED', 409, 'Attached files cannot be deleted');
        await tx.peopleFile.delete({ where: { id } });
        await audit(tx, { actorId: userId, action: 'file.deleted', entityType: 'file', entityId: id, requestId });
        return file;
      });
      await storage.delete(file.storageKey);
    },
  };
}
