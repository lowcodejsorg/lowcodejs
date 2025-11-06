import z from 'zod';

export const UserGroupShowParamValidator = z.object({
  _id: z.string(),
});
