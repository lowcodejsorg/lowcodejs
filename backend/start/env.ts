import { config } from 'dotenv';
import { z } from 'zod';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const EnvSchema = z.object({
  DATABASE_URL: z.string().trim(),
  DB_NAME: z.string().trim().default('lowcodejs'),

  JWT_PUBLIC_KEY: z.string().trim(),
  JWT_PRIVATE_KEY: z.string().trim(),
  COOKIE_SECRET: z.string().trim(),
  COOKIE_DOMAIN: z.string().trim().optional(),

  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  APP_SERVER_URL: z.string().trim(),
  APP_CLIENT_URL: z.string().trim(),

  ALLOWED_ORIGINS: z
    .string()
    .default('https://lowcodejs.org;*.lowcodejs.org')
    .transform((val) =>
      val
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  REDIS_URL: z.string().trim().default('redis://localhost:6379'),

  MCP_SERVER_URL: z.string().trim().optional(),
});

const validation = EnvSchema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.issues);
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
