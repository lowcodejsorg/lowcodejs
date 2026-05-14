import z from 'zod';

export const ImportTableValidator = z.object({
  name: z
    .string()
    .trim()
    .max(40, 'Nome deve ter no maximo 40 caracteres')
    .optional()
    .nullable(),
  fileContent: z.object({}).loose(),
});

export type ImportTablePayload = z.infer<typeof ImportTableValidator>;
