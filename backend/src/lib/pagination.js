import { AppError } from './AppError.js';

function parsePositiveInteger(value, fallback, field) {
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new AppError('VALIDATION_ERROR', 400, 'Request validation failed', [
      { path: [field], message: `${field} must be a positive integer` },
    ]);
  }

  return parsed;
}

export function parsePagination(query, options = {}) {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;
  const page = parsePositiveInteger(query.page, 1, 'page');
  const requestedLimit = parsePositiveInteger(query.limit, defaultLimit, 'limit');
  const limit = Math.min(requestedLimit, maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function parseSort(value, allowedFields, defaultSort) {
  const candidate = value ?? defaultSort;
  if (!candidate) return undefined;

  const [field, direction = 'asc', ...extra] = candidate.split(':');
  const validDirection = direction === 'asc' || direction === 'desc';

  if (extra.length || !allowedFields.includes(field) || !validDirection) {
    throw new AppError('VALIDATION_ERROR', 400, 'Request validation failed', [
      { path: ['sort'], message: 'sort contains an unsupported field or direction' },
    ]);
  }

  return { field, direction, orderBy: { [field]: direction } };
}

export function createPageMeta({ page, limit }, total) {
  return { page, limit, total };
}
