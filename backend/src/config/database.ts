import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { env } from './env';
import { logger } from '../utils/logger';
import { User } from '../models/User';
import { populateSeedData } from '../scripts/seed';

let embeddedMongoServer: any = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  mongoose.set('strictQuery', true);

  // 1. Attempt connection to configured MONGODB_URI
  try {
    await mongoose.connect(env.MONGODB_URI, {
      driverInfo: { name: 'nodejs', version: process.version },
      serverSelectionTimeoutMS: 2000
    });
    logger.info({ uri: env.MONGODB_URI }, 'Connected to MongoDB database successfully.');
  } catch (directConnError: any) {
    // 2. If in development and direct connection fails, start embedded persistent MongoDB
    if (env.NODE_ENV === 'development') {
      logger.warn(
        { uri: env.MONGODB_URI, err: directConnError.message },
        'External MongoDB unreachable. Launching embedded local development MongoDB...'
      );

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const dbPath = path.resolve(__dirname, '../../.data/db');
        fs.mkdirSync(dbPath, { recursive: true });

        try {
          embeddedMongoServer = await MongoMemoryServer.create({
            instance: { port: 27017, dbPath }
          });
        } catch {
          // If port 27017 is occupied, allocate dynamic port
          embeddedMongoServer = await MongoMemoryServer.create({
            instance: { dbPath }
          });
        }

        const embeddedUri = embeddedMongoServer.getUri();
        await mongoose.connect(embeddedUri, {
          driverInfo: { name: 'nodejs', version: process.version }
        });
        logger.info({ uri: embeddedUri }, 'Connected to embedded local development MongoDB successfully.');
      } catch (embeddedError: any) {
        logger.fatal({ err: embeddedError }, 'Failed to start embedded MongoDB.');
        throw embeddedError;
      }
    } else {
      logger.error({ err: directConnError }, 'Failed to connect to MongoDB.');
      throw directConnError;
    }
  }

  // 3. Auto-populate seed data if database is empty
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Database has no registered accounts. Auto-populating initial seed data...');
      await populateSeedData();
    }
  } catch (seedErr: any) {
    logger.warn({ err: seedErr.message }, 'Seed check encountered an issue (ignoring)');
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  }
  if (embeddedMongoServer) {
    await embeddedMongoServer.stop();
    embeddedMongoServer = null;
    logger.info('Stopped embedded local MongoDB.');
  }
}
