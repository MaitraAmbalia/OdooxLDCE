import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { AppError } from './AppError.js';

// What each file extension is allowed to claim to be.
const MIME_BY_EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };

const reject = (code, message) => new AppError(code, 415, message);

/**
 * Turns an untrusted upload into something safe to store.
 *  1. The type is detected from the BYTES, never from the filename or client content-type.
 *  2. It must be in `allowed` for this purpose.
 *  3. It must agree with what the client declared (a PNG named .pdf is rejected).
 *  4. Images are decoded and re-encoded with sharp, which drops EXIF/GPS and any appended junk.
 * Returns { buffer, mime, size, sha256 } for the bytes that will actually be stored.
 */
export async function sanitizeUpload(buffer, { declaredName = '', declaredMime, allowed, maxBytes }) {
  if (!buffer?.length) throw new AppError('FILE_REQUIRED', 400, 'The uploaded file is empty');
  if (buffer.length > maxBytes) throw new AppError('FILE_TOO_LARGE', 413, 'File is too large');

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) throw reject('FILE_TYPE_NOT_ALLOWED', 'Could not determine the file type');
  if (!allowed.includes(detected.mime)) throw reject('FILE_TYPE_NOT_ALLOWED', 'This file type is not allowed for this purpose');

  const extMime = MIME_BY_EXT[path.extname(declaredName).toLowerCase()];
  const mimeMismatch = declaredMime && declaredMime !== 'application/octet-stream' && declaredMime !== detected.mime;
  if (extMime !== detected.mime || mimeMismatch) {
    throw reject('MIME_MISMATCH', 'File contents do not match the file name or declared type');
  }

  let out = buffer;
  if (detected.mime.startsWith('image/')) {
    try {
      // .rotate() applies the EXIF orientation first so stripping it does not flip the picture.
      const img = sharp(buffer, { failOn: 'error' }).rotate();
      const format = detected.mime.split('/')[1];
      out = await img.toFormat(format).toBuffer(); // sharp writes no metadata unless asked to
    } catch {
      throw reject('INVALID_IMAGE', 'The image could not be processed');
    }
  }
  // ponytail: PDFs are stored as-is (no sanitiser); they are only ever served as downloads.

  return { buffer: out, mime: detected.mime, size: out.length, sha256: createHash('sha256').update(out).digest('hex') };
}
