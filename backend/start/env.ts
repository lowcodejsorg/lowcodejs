import { config } from 'dotenv';
import { z } from 'zod';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: envFile });

const EnvSchema = z.object({
  LOCALE: z.enum(['pt-br', 'en-us']).default('pt-br'),
  FILE_UPLOAD_MAX_SIZE: z.coerce.number().default(1024 * 1024 * 5),
  FILE_UPLOAD_ACCEPTED: z.string().transform((val) =>
    val
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.coerce.number().default(10),
  PAGINATION_PER_PAGE: z.coerce.number().default(50),

  DATABASE_URL: z.string().trim(),
  DB_NAME: z.string().trim().default('lowcodejs'),

  EMAIL_PROVIDER_PASSWORD: z.string().trim(),
  EMAIL_PROVIDER_HOST: z.string().trim(),
  EMAIL_PROVIDER_PORT: z.coerce.number(),
  EMAIL_PROVIDER_USER: z.string().trim(),
  EMAIL_PROVIDER_FROM: z.string().trim().optional(),

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

  LOGO_SMALL_URL: z.string().trim(),
  LOGO_LARGE_URL: z.string().trim(),

  ALLOWED_ORIGINS: z
    .string()
    .default('https://lowcodejs.org;*.lowcodejs.org')
    .transform((val) =>
      val
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_ENDPOINT: z.string().trim().optional(),
  STORAGE_REGION: z.string().trim().default('us-east-1'),
  STORAGE_BUCKET: z.string().trim().optional(),
  STORAGE_ACCESS_KEY: z.string().trim().optional(),
  STORAGE_SECRET_KEY: z.string().trim().optional(),

  REDIS_URL: z.string().trim().default('redis://localhost:6379'),

  MCP_SERVER_URL: z.string().trim().optional(),
  OPENAI_API_KEY: z.string().trim().optional(),
});

const validation = EnvSchema.safeParse(process.env);

if (!validation.success) {
  console.error('Invalid environment variables', validation.error.issues);
  throw new Error('Invalid environment variables');
}

export const Env = validation.data;
