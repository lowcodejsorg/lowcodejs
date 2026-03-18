import z from 'zod';

export const ExportTableValidator = z.object({
  slug: z
    .string({ message: 'O slug da tabela e obrigatorio' })
    .trim()
    .min(1, 'O slug da tabela e obrigatorio'),
  exportType: z.enum(['structure', 'data', 'full'], {
    message: 'Tipo de exportacao deve ser: structure, data ou full',
  }),
});

export type ExportTablePayload = z.infer<typeof ExportTableValidator>;
