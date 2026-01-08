import z from 'zod';

export const TableCreateBodyValidator = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(40, 'Name must be at most 40 characters')
    .regex(
      /^[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ0-9\s\-_]+$/,
      'Name can only contain letters, numbers, spaces, hyphen, underscore and ç',
    ),
  owner: z.string().trim().optional(),
});

export type TableCreatePayload = z.infer<typeof TableCreateBodyValidator>;
