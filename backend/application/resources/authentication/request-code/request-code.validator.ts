import z from 'zod';

export const RequestCodeBodyValidator = z.object({
  email: z.string().email().trim(),
});

export type RequestCodePayload = z.infer<typeof RequestCodeBodyValidator>;
