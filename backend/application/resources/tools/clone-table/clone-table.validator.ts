import z from 'zod';

export const CloneTableValidator = z.object({
  baseTableId: z.string(),
  name: z.string().min(1),
});

export type CloneTablePayload = z.infer<
  typeof CloneTableValidator
>;
