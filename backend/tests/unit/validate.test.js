import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.js';

describe('validate middleware', () => {
  it('stores parsed data and strips unknown object keys', () => {
    const middleware = validate({
      body: z.object({ email: z.string().email() }),
    });
    const req = { body: { email: 'student@nirmauni.ac.in', admin: true } };
    const next = vi.fn();

    middleware(req, {}, next);

    expect(req.body).toEqual({ email: 'student@nirmauni.ac.in' });
    expect(req.validated.body).toEqual(req.body);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes a structured validation error to Express', () => {
    const middleware = validate({ body: z.object({ email: z.string().email() }) });
    const next = vi.fn();

    middleware({ body: { email: 'invalid' } }, {}, next);

    const [error] = next.mock.calls[0];
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    expect(error.details[0].path).toEqual(['body', 'email']);
  });
});
