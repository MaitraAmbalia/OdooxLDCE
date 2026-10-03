import { describe, expect, it, vi } from 'vitest';
import { requireJson } from '../../src/middleware/requireJson.js';

describe('requireJson middleware', () => {
  it('allows JSON requests', () => {
    const next = vi.fn();
    requireJson({ is: () => 'application/json' }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects non-JSON requests', () => {
    const next = vi.fn();
    requireJson({ is: () => false }, {}, next);

    expect(next.mock.calls[0][0]).toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      status: 415,
    });
  });
});
