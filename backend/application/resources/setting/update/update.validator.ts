import z from 'zod';

export const SettingUpdateBodyValidator = z.object({
  SYSTEM_NAME: z
    .string({ message: 'O nome do sistema é obrigatório' })
    .min(1, 'O nome do sistema é obrigatório')
    .max(100, 'O nome do sistema deve ter no máximo 100 caracteres')
    .trim(),
  LOCALE: z.enum(['pt-br', 'en-us'], {
    message: 'O locale deve ser pt-br ou en-us',
  }),
  STORAGE_DRIVER: z
    .enum(['local', 's3'], {
      message: 'O driver de storage deve ser local ou s3',
    })
    .optional(),
  STORAGE_ENDPOINT: z.string().trim().optional(),
  STORAGE_REGION: z.string().trim().optional(),
  STORAGE_BUCKET: z.string().trim().optional(),
  STORAGE_ACCESS_KEY: z.string().trim().optional(),
  STORAGE_SECRET_KEY: z.string().trim().optional(),
  FILE_UPLOAD_MAX_SIZE: z.coerce
    .number({ message: 'O tamanho máximo de arquivo deve ser um número' })
    .min(1, 'O tamanho máximo de arquivo deve ser maior que zero'),
  FILE_UPLOAD_ACCEPTED: z
    .string({ message: 'As extensões aceitas são obrigatórias' })
    .min(1, 'As extensões aceitas são obrigatórias')
    .trim(),
  FILE_UPLOAD_MAX_FILES_PER_UPLOAD: z.coerce
    .number({ message: 'O máximo de arquivos por upload deve ser um número' })
    .min(1, 'O máximo de arquivos por upload deve ser maior que zero'),
  PAGINATION_PER_PAGE: z.coerce
    .number({ message: 'A paginação deve ser um número' })
    .min(1, 'A paginação deve ser maior que zero'),
  MODEL_CLONE_TABLES: z.array(z.string()).optional(),
  EMAIL_PROVIDER_HOST: z.string().trim().nullable().optional(),
  EMAIL_PROVIDER_PORT: z.coerce.number().nullable().optional(),
  EMAIL_PROVIDER_USER: z.string().trim().nullable().optional(),
  EMAIL_PROVIDER_PASSWORD: z.string().trim().nullable().optional(),
  EMAIL_PROVIDER_FROM: z.string().trim().nullable().optional(),
  OPENAI_API_KEY: z.string().trim().optional(),
  AI_ASSISTANT_ENABLED: z.boolean().optional(),
  LOGO_SMALL_URL: z
    .string({ message: 'A URL do logo pequeno deve ser um texto' })
    .trim()
    .nullable()
    .optional(),
  LOGO_LARGE_URL: z
    .string({ message: 'A URL do logo grande deve ser um texto' })
    .trim()
    .nullable()
    .optional(),
});

export type SettingUpdatePayload = z.infer<typeof SettingUpdateBodyValidator>;
