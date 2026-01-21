import z from 'zod';

export const CloneTableValidator = z.object({
  baseTableId: z
    .string({ message: 'O ID da tabela base é obrigatório' })
    .trim()
    .min(1, 'O ID da tabela base é obrigatório'),
  name: z
    .string({ message: 'O nome da nova tabela é obrigatório' })
    .trim()
    .min(1, 'O nome da nova tabela é obrigatório'),
});

export type CloneTablePayload = z.infer<typeof CloneTableValidator>;
