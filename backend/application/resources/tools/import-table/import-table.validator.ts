import z from 'zod';

export const ImportTableValidator = z.object({
  name: z
    .string({ message: 'O nome da nova tabela e obrigatorio' })
    .trim()
    .min(1, 'O nome da nova tabela e obrigatorio')
    .max(40, 'Nome deve ter no maximo 40 caracteres'),
  fileContent: z.object({}).loose(),
});

export type ImportTablePayload = z.infer<typeof ImportTableValidator>;
