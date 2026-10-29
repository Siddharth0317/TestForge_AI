import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app: Express = express();

  // Security & parsing middleware
  app.use(helmet());
  app.use(cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  // Health and Readiness probes
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'testforge-backend',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      request_id: req.id
    });
  });

  app.get('/ready', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ready',
      service: 'testforge-backend',
      checks: {
        environment: 'configured'
      },
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  });

  // Base API v1 status route
  app.get('/api/v1', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'TestForge AI Core API',
      version: '1.0.0',
      status: 'running',
      request_id: req.id
    });
  });

  // 404 handler for unknown routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.url} does not exist.`,
        request_id: req.id,
        details: [],
        timestamp: new Date().toISOString()
      }
    });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}

