import { randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../../lib/AppError.js';
import { sanitizeUpload } from '../../lib/sanitizeUpload.js';
import { auditLog } from '../../utils/audit.js';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB for images and PDFs alike
const IMAGES = ['image/jpeg', 'image/png', 'image/webp'];

export const PURPOSES = {
  RECEIPT: { allowed: [...IMAGES, 'application/pdf'], isPublic: false },
  LEDGER_ATTACHMENT: { allowed: [...IMAGES, 'application/pdf'], isPublic: false },
  MERCH_IMAGE: { allowed: IMAGES, isPublic: true },
  EVENT_COVER: { allowed: IMAGES, isPublic: true },
};

const notFound = () => new AppError('NOT_FOUND', 404, 'File not found');
const notUsable = (details) => new AppError('FILE_NOT_USABLE', 422, 'One or more files cannot be used here', details);

const toPublic = (f) => ({
  id: f.id, purpose: f.purpose, mime: f.mime, sizeBytes: Number(f.sizeBytes), isPublic: f.isPublic,
  createdAt: f.createdAt, url: `/api/v1/commerce/files/${f.id}`,
});

export function createFilesService({ prisma, config }) {
  // Blobs live on local disk under random hex names that WE generate (never taken from the client).
  const root = path.resolve(config.fileStoragePath ?? './storage');
  const blobPath = (key) => path.join(root, key);

  // Who besides the owner may read a private file. Other modules can add rules with
  // registerReadPolicy(purpose, (user, file) => boolean) (contract).
  const anyPermission = (keys) => (user) => keys.some((k) => user.permissions?.includes(k));
  const policies = new Map([
    ['RECEIPT', anyPermission(['claim.review', 'claim.review.high', 'claim.review.treasurer'])], // Mentor holds the last one
    ['LEDGER_ATTACHMENT', anyPermission(['ledger.read'])],
  ]);
  const registerReadPolicy = (purpose, fn) => policies.set(purpose, fn);

  async function upload(user, incoming, purpose) {
    if (!incoming) throw new AppError('FILE_REQUIRED', 400, 'A file is required (multipart field "file")');
    const spec = PURPOSES[purpose];
    const clean = await sanitizeUpload(incoming.buffer, {
      declaredName: incoming.originalname, declaredMime: incoming.mimetype, allowed: spec.allowed, maxBytes: MAX_UPLOAD_BYTES,
    });
    const storageKey = randomBytes(16).toString('hex');
    await mkdir(root, { recursive: true });
    await writeFile(blobPath(storageKey), clean.buffer, { flag: 'wx' }); // wx: never overwrite
    try {
      const row = await prisma.file.create({
        data: { ownerId: user.id, purpose, storageKey, mime: clean.mime, sizeBytes: BigInt(clean.size), sha256: clean.sha256, isPublic: spec.isPublic },
      });
      return toPublic(row);
    } catch (e) {
      await unlink(blobPath(storageKey)).catch(() => { }); // don't leave an orphan blob
      throw e;
    }
  }

  // "Not allowed" looks exactly like "does not exist" (404), so ids cannot be probed.
  async function read(user, id, req) {
    const file = await prisma.file.findUnique({ where: { id } });
    const allowed = file && (file.isPublic || (user && (file.ownerId === user.id || (await policies.get(file.purpose)?.(user, file)))));
    if (!allowed) throw notFound();
    if (file.purpose === 'RECEIPT') {
      await auditLog({ actorId: user.id, action: 'FILE.READ', entityType: 'file', entityId: file.id, req }, prisma); // receipt access is audited
    }
    await access(blobPath(file.storageKey)).catch(() => { throw notFound(); });
    return { file, stream: createReadStream(blobPath(file.storageKey)) };
  }

  async function remove(user, id) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || file.ownerId !== user.id) throw notFound();
    if (file.attachedToType) throw new AppError('FILE_ATTACHED', 409, 'This file is attached and cannot be deleted');
    await prisma.file.delete({ where: { id } });
    await unlink(blobPath(file.storageKey)).catch(() => { });
  }

  // ---- contract for other modules ----
  // Throws 422 unless EVERY file exists, belongs to ownerId, is still unattached and has `purpose`.
  // Someone else's file is reported as NOT_FOUND so ids are not revealed.
  async function assertUsable(fileIds, { ownerId, purpose }, db = prisma) {
    const ids = [...new Set(fileIds)];
    const found = new Map((await db.file.findMany({ where: { id: { in: ids } } })).map((f) => [f.id, f]));
    const problems = [];
    for (const id of ids) {
      const f = found.get(id);
      if (!f || f.ownerId !== ownerId) problems.push({ fileId: id, reason: 'NOT_FOUND' });
      else if (f.attachedToType) problems.push({ fileId: id, reason: 'ALREADY_ATTACHED' });
      else if (f.purpose !== purpose) problems.push({ fileId: id, reason: 'WRONG_PURPOSE' });
    }
    if (problems.length) throw notUsable(problems);
  }

  // Links files to the record that now uses them. All-or-nothing: if any was attached meanwhile
  // we throw, which rolls back the caller's transaction.
  async function attach(fileIds, { type, id }, tx) {
    const ids = [...new Set(fileIds)];
    const { count } = await tx.file.updateMany({ where: { id: { in: ids }, attachedToType: null }, data: { attachedToType: type, attachedToId: id } });
    if (count !== ids.length) throw notUsable([{ reason: 'ALREADY_ATTACHED' }]);
  }

  return { upload, read, remove, assertUsable, attach, registerReadPolicy };
}
