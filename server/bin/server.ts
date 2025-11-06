import { MongooseConnect } from '@config/database.config';
import { Env } from '@start/env';
import { kernel } from '@start/kernel';

async function start(): Promise<void> {
  try {
    // Wait for Fastify to be ready
    await kernel.ready();

    // Start the server
    await kernel.listen({ port: Env.PORT, host: '0.0.0.0' });
    console.info(`HTTP Server running on http://localhost:${Env.PORT}`);
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
