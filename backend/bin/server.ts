import type { Server as HttpServer } from 'node:http';

import type { IJWTPayload } from '@application/core/entity.core';
import { Setting } from '@application/model/setting.model';
import { initChatSocket } from '@application/resources/chat/chat.socket';
import { MongooseConnect } from '@config/database.config';
import { syncStorageEnv } from '@config/setting-env-sync';
import { Env } from '@start/env';
import { kernel } from '@start/kernel';

async function loadStorageConfig(): Promise<void> {
  const setting = await Setting.findOne().lean();

  if (setting) {
    syncStorageEnv(setting as never);
    console.info(`[Storage] Driver: ${setting.STORAGE_DRIVER ?? 'local'}`);
  } else {
    console.info('[Storage] Nenhum Setting encontrado, usando driver local');
  }
}

async function start(): Promise<void> {
  try {
    await loadStorageConfig();
    await kernel.ready();

    await kernel.listen({ port: Env.PORT, host: '0.0.0.0' });
    console.info(`HTTP Server running on http://localhost:${Env.PORT}`);

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

MongooseConnect().then(() => {
  console.info('Mongoose connected');
  console.info('url: ', Env.DATABASE_URL);
  start();
});
