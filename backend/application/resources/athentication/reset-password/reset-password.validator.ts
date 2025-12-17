import z from 'zod';

export const UpdatePasswordBodyValidator = z.object({
  password: z.string().trim().min(8),
});

export const UpdatePasswordParamValidator = z.object({
  _id: z.string().trim(),
});
