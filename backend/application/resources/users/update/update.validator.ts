import z from 'zod';

import { UserBaseValidator } from '../user-base.validator';

export const UserUpdateBodyValidator = UserBaseValidator.extend({
  password: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
});

export const UserUpdateParamValidator = z.object({
  _id: z.string().trim(),
});
