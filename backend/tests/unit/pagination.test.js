import { describe, expect, it } from 'vitest';
import { parsePagination, parseSort } from '../../src/lib/pagination.js';

describe('pagination helpers', () => {
  it('creates Prisma-compatible pagination values', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
      take: 10,
    });
  });

  it('caps the page size', () => {
    expect(parsePagination({ limit: '500' }).limit).toBe(100);
  });

  it('only accepts whitelisted sort fields', () => {
    expect(parseSort('createdAt:desc', ['createdAt'])).toMatchObject({
      field: 'createdAt',
      direction: 'desc',
    });
    expect(() => parseSort('passwordHash:asc', ['createdAt'])).toThrow();
  });
});
