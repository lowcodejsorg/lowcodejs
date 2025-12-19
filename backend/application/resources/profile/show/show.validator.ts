import z from 'zod';

export const ProfileShowParamValidator = z.object({
  _id: z.string().trim(),
});
