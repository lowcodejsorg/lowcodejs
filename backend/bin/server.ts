import type { Server as HttpServer } from 'node:http';

import type { IJWTPayload } from '@application/core/entity.core';
import { initChatSocket } from '@application/resources/chat/chat.socket';
import { MongooseConnect } from '@config/database.config';
import { Env } from '@start/env';
import { kernel } from '@start/kernel';

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

MongooseConnect().then(() => {
  console.info('Mongoose connected');
  console.info('url: ', Env.DATABASE_URL);
  start();
});
