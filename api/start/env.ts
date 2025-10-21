import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().trim(),

  JWT_PUBLIC_KEY: z.string().trim(),
  JWT_PRIVATE_KEY: z.string().trim(),

  COOKIE_SECRET: z.string().trim(),

  EMAIL_PROVIDER_PASSWORD: z.string().trim(),
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),

  APP_SERVER_URL: z.string().trim(),
  APP_CLIENT_URL: z.string().trim(),
});

const validation = schema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.issues);
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
