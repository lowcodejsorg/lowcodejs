import z from 'zod';

import { UserBaseValidator } from '../user-base.validator';

export const UserCreateBodyValidator = UserBaseValidator.extend({
  password: z.string().trim(),
});
