import { AppError } from '../lib/AppError.js';

export function validate(schemas) {
  const targets = schemas?.safeParse ? { body: schemas } : (schemas || {});

  return (req, _res, next) => {
    const validated = {};

    for (const [key, schema] of Object.entries(targets)) {
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const errors = result.error.issues.map((i) => ({
          path: [key, ...i.path],
          message: i.message,
          code: i.code,
        }));
        return next(new AppError('VALIDATION_ERROR', 400, 'Request validation failed', errors));
      }
      req[key] = result.data;
      validated[key] = result.data;
    }

    req.validated = validated;
    next();
  };
}
