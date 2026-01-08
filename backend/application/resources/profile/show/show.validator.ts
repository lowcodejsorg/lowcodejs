import z from 'zod';

export const ProfileShowParamsValidator = z.object({
  _id: z.string().trim(),
});

export type ProfileShowPayload = z.infer<typeof ProfileShowParamsValidator>;
