export function idempotency() {
  return (_req, _res, next) => next();
}

export async function withIdempotency(_client, _options, work) {
  return work();
}
