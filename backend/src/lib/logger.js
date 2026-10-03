import pino from 'pino';
import pinoHttp from 'pino-http';

export function createLogger(config) {
  return pino({
    level: config.logLevel,
    base: undefined,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers.set-cookie',
        '*.password',
        '*.token',
      ],
      censor: '[REDACTED]',
    },
  });
}
export function createRequestLogger(logger) {
  return pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customProps: (req) => ({ requestId: req.id }),
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      }),
      res: (res) => ({ statusCode: res.statusCode }),
      err: pino.stdSerializers.err,
    },
  });
}
