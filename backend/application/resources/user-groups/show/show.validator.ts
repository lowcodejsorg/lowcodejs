import z from 'zod';

export const UserGroupShowParamValidator = z.object({
  _id: z.string(),
});

export type UserGroupShowPayload = z.infer<typeof UserGroupShowParamValidator>;
