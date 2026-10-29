import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-internal-service-key"]', 'password', 'token', 'secret'],
    censor: '[REDACTED]'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

