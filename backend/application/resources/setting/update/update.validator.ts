import z from 'zod';

export const SettingUpdateBodyValidator = z.object({
  LOCALE: z.enum(['pt-br', 'en-us'], {
    message: 'O locale deve ser pt-br ou en-us',
  }),
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
  EMAIL_PROVIDER_HOST: z
    .string({ message: 'O host de email é obrigatório' })
    .min(1, 'O host de email é obrigatório')
    .trim(),
  EMAIL_PROVIDER_PORT: z.coerce
    .number({ message: 'A porta de email deve ser um número' })
    .min(1, 'A porta de email deve ser maior que zero'),
  EMAIL_PROVIDER_USER: z
    .string({ message: 'O usuário de email é obrigatório' })
    .min(1, 'O usuário de email é obrigatório')
    .trim(),
  EMAIL_PROVIDER_PASSWORD: z
    .string({ message: 'A senha de email é obrigatória' })
    .min(1, 'A senha de email é obrigatória')
    .trim(),
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
