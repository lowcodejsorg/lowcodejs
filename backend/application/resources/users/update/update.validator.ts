import z from 'zod';

import { E_USER_STATUS, Merge } from '@application/core/entity.core';

import { UserBaseValidator } from '../user-base.validator';

export const UserUpdateBodyValidator = UserBaseValidator.partial().extend({
  password: z.string().trim().optional(),
  status: z.enum([E_USER_STATUS.ACTIVE, E_USER_STATUS.INACTIVE]).optional(),
});

export const UserUpdateParamsValidator = z.object({
  _id: z.string().trim(),
});

export type UserUpdatePayload = Merge<
  z.infer<typeof UserUpdateParamsValidator>,
  z.infer<typeof UserUpdateBodyValidator>
>;
