import type { Server as HttpServer } from 'node:http';

import type { IJWTPayload } from '@application/core/entity.core';
import { Setting } from '@application/model/setting.model';
import { initChatSocket } from '@application/resources/chat/chat.socket';
import { MongooseConnect } from '@config/database.config';
import { Env } from '@start/env';
import { kernel } from '@start/kernel';

const SETTING_SYNC_KEYS = [
  'SYSTEM_NAME',
  'LOCALE',
  'STORAGE_DRIVER',
  'STORAGE_ENDPOINT',
  'STORAGE_REGION',
  'STORAGE_BUCKET',
  'STORAGE_ACCESS_KEY',
  'STORAGE_SECRET_KEY',
  'FILE_UPLOAD_MAX_SIZE',
  'FILE_UPLOAD_ACCEPTED',
  'FILE_UPLOAD_MAX_FILES_PER_UPLOAD',
  'PAGINATION_PER_PAGE',
  'EMAIL_PROVIDER_HOST',
  'EMAIL_PROVIDER_PORT',
  'EMAIL_PROVIDER_USER',
  'EMAIL_PROVIDER_PASSWORD',
  'LOGO_SMALL_URL',
  'LOGO_LARGE_URL',
  'OPENAI_API_KEY',
  'AI_ASSISTANT_ENABLED',
];

async function syncSettingsFromDatabase(): Promise<void> {
  const settings = await Setting.findOne().lean();
  if (!settings) return;

  for (const key of SETTING_SYNC_KEYS) {
    const value = (settings as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) {
      process.env[key] = String(value);
    }
  }
  console.info('Settings synced from database');
  console.info(`Storage driver: ${process.env.STORAGE_DRIVER || 'local'}`);
}

async function start(): Promise<void> {
  try {
    await kernel.ready();

    await kernel.listen({ port: Env.PORT, host: '0.0.0.0' });
    console.info(`HTTP Server running on http://localhost:${Env.PORT}`);

    // Inicializar Socket.IO usando o HTTP server nativo do Fastify
    const httpServer = kernel.server as HttpServer;
    initChatSocket(httpServer, (token: string) => {
      return kernel.jwt.decode<IJWTPayload>(token);
    });
    console.info('Socket.IO chat initialized');
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

MongooseConnect().then(async () => {
  console.info('Mongoose system connected:', Env.DB_DATABASE);
  console.info('Mongoose data connected:', Env.DB_DATA_DATABASE);
  await syncSettingsFromDatabase();
  start();
});
