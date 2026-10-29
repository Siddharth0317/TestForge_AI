import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap() {
  try {
    // 1. Establish database connection before accepting HTTP requests
    await connectDatabase();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info({
        port: env.PORT,
        environment: env.NODE_ENV,
        frontendOrigin: env.FRONTEND_ORIGIN
      }, `TestForge AI Backend started successfully on port ${env.PORT}`);
    });

    // 4. Handle graceful shutdown
    const handleShutdown = (signal: string) => {
      logger.info(`${signal} signal received. Closing HTTP server and database connections.`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server and database shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start TestForge AI Backend.');
    process.exit(1);
  }
}

bootstrap();
