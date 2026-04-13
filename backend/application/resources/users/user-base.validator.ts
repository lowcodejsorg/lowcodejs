import z from 'zod';

export const UserBaseValidator = z.object({
  name: z
    .string({ message: 'O nome é obrigatório' })
    .trim()
    .min(1, 'O nome é obrigatório'),
  email: z
    .string({ message: 'O email é obrigatório' })
    .email('Digite um email válido')
    .trim(),
  groups: z
    .array(z.string({ message: 'Cada grupo deve ser um texto' }))
    .min(1, 'Ao menos um grupo é obrigatório'),
});

export type UserBasePayload = z.infer<typeof UserBaseValidator>;
