import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { AppError } from '../errors/AppError.js';

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
export async function sanitizeUpload(buffer, { allowed = [...imageTypes], maxBytes = 5 * 1024 * 1024 } = {}) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > maxBytes) throw new AppError('INVALID_FILE', 400, 'File exceeds the size limit or is empty');
  const type = await fileTypeFromBuffer(buffer).catch(() => null);
  if (!type || !allowed.includes(type.mime)) throw new AppError('INVALID_FILE_TYPE', 400, 'Unsupported file content');
  let sanitized = buffer;
  if (imageTypes.has(type.mime)) {
    try {
      sanitized = await sharp(buffer, { limitInputPixels: 40_000_000, animated: false })
        .rotate().toFormat(type.mime === 'image/jpeg' ? 'jpeg' : type.ext).toBuffer();
    } catch { throw new AppError('INVALID_FILE', 400, 'Image could not be decoded'); }
  }
  if (type.mime === 'application/pdf' && !buffer.subarray(-1024).toString('latin1').includes('%%EOF')) throw new AppError('INVALID_FILE', 400, 'PDF is incomplete');
  if (sanitized.length > maxBytes) throw new AppError('INVALID_FILE', 400, 'Sanitized file exceeds the size limit');
  return { buffer: sanitized, mimeType: type.mime, byteSize: sanitized.length,
    sha256: createHash('sha256').update(sanitized).digest('hex') };
}

export function createStorage(config) {
  const s3 = config.fileStorage === 's3' ? new S3Client({ region: config.s3Region }) : null;
  function filePath(key) {
    if (!/^[a-f0-9-]{36}$/.test(key)) throw new TypeError('Invalid storage key');
    return path.join(config.fileStoragePath, key);
  }
  return {
    async put(buffer, mimeType) {
      const key = randomUUID();
      if (s3) await s3.send(new PutObjectCommand({ Bucket: config.s3Bucket, Key: key, Body: buffer, ContentType: mimeType }));
      else { await mkdir(config.fileStoragePath, { recursive: true }); await writeFile(filePath(key), buffer, { flag: 'wx' }); }
      return key;
    },
    async get(key) {
      const target = filePath(key);
      if (s3) return Buffer.from(await (await s3.send(new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }))).Body.transformToByteArray());
      return readFile(target);
    },
    async delete(key) {
      const target = filePath(key);
      if (s3) await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: key }));
      else await unlink(target).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    },
  };
}
