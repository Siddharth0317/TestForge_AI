import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
import { authRouter } from './modules/auth/auth.router';
import { projectsRouter } from './modules/projects/projects.router';
import { requirementsRouter } from './modules/requirements/requirements.router';
import { environmentsRouter } from './modules/environments/environments.router';
import { generationRouter } from './modules/generation/generation.router';

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

  // Health and Readiness probes (excluded from rate limit)
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
      request_id: req.id,
      docs: '/api/v1/openapi.yaml'
    });
  });

  // Serve OpenAPI specification
  app.get('/api/v1/openapi.yaml', (req: Request, res: Response) => {
    const yamlPath = path.resolve(__dirname, '../../docs/openapi.yaml');
    if (fs.existsSync(yamlPath)) {
      res.setHeader('Content-Type', 'text/yaml');
      res.send(fs.readFileSync(yamlPath, 'utf8'));
    } else {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'OpenAPI specification file not found.' } });
    }
  });

  // Apply rate limiter to API routes (disabled in test environment)
  if (env.NODE_ENV !== 'test') {
    app.use('/api/v1', apiLimiter);
    app.use('/api/v1/auth', authLimiter);
  }

  // Mount API v1 Routers
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/projects', projectsRouter);
  app.use('/api/v1', requirementsRouter);
  app.use('/api/v1', environmentsRouter);
  app.use('/api/v1', generationRouter);

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
