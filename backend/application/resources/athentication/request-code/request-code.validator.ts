import z from 'zod';

export const RequestCodeBodyValidator = z.object({
  email: z.email().trim(),
});
