import { Router } from 'express';
import multer from 'multer';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import { AppError } from '../../lib/AppError.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { MAX_UPLOAD_BYTES, PURPOSES } from './files.service.js';

const uploadBody = z.object({ purpose: z.enum(Object.keys(PURPOSES)) });
const idParams = z.object({ id: z.uuid() });

// Runs multer and turns its errors into our error envelope (413 too big, 400 otherwise).
function parseUpload(req, res, next) {
  const multipart = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5 } });
  multipart.single('file')(req, res, (err) => {
    if (!err) return next();
    next(err.code === 'LIMIT_FILE_SIZE' ? new AppError('FILE_TOO_LARGE', 413, 'File is too large') : new AppError('VALIDATION_ERROR', 400, 'Invalid upload'));
  });
}

// Mounted at /api/v1/commerce/files
export function createFilesRouter({ service, authenticate }) {
  const router = Router();
  // Public files (merch images, event covers) need no login: a failed login here just means "anonymous".
  const optionalAuth = (req, res, next) => authenticate(req, res, () => next());

  router.post(
    '/',
    authenticate,
    rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, keyGenerator: (req) => req.user.id }), // 30 uploads/hour/user
    parseUpload,
    validate({ body: uploadBody }),
    async (req, res) => res.status(201).json({ data: await service.upload(req.user, req.file, req.body.purpose) }),
  );

  router.get('/:id', optionalAuth, validate({ params: idParams }), async (req, res) => {
    const { file, stream } = await service.read(req.user, req.params.id, req);
    res.setHeader('Content-Type', file.mime); // detected at upload time, never the client's claim
    res.setHeader('Content-Length', String(file.sizeBytes));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', file.isPublic ? 'public, max-age=3600' : 'private, no-store');
    if (file.mime === 'application/pdf') res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
    await pipeline(stream, res);
  });

  router.delete('/:id', authenticate, validate({ params: idParams }), async (req, res) => {
    await service.remove(req.user, req.params.id);
    res.status(204).end();
  });

  return router;
}
