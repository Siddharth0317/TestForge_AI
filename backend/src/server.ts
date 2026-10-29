import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({
    port: env.PORT,
    environment: env.NODE_ENV,
    frontendOrigin: env.FRONTEND_ORIGIN
  }, `TestForge AI Backend started successfully on port ${env.PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});

