import { AppError } from '../lib/AppError.js';

const LOCATIONS = ['params', 'query', 'body'];

function formatIssues(issues, location) {
  return issues.map((issue) => ({
    path: [location, ...issue.path],
    message: issue.message,
    code: issue.code,
  }));
}

export function validate(schemas) {
  const normalizedSchemas = typeof schemas.safeParse === 'function' ? { body: schemas } : schemas;

  return (req, _res, next) => {
    const validated = {};
    const errors = [];

    for (const location of LOCATIONS) {
      const schema = normalizedSchemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (!result.success) {
        errors.push(...formatIssues(result.error.issues, location));
        continue;
      }

      validated[location] = result.data;
    }

    if (errors.length) {
      return next(new AppError('VALIDATION_ERROR', 400, 'Request validation failed', errors));
    }

    req.validated = validated;
    if (validated.body !== undefined) req.body = validated.body;
    if (validated.params !== undefined) req.params = validated.params;
    return next();
  };
}
