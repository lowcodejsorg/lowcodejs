import z from 'zod';

const BaseSchema = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  group: z.string().trim(),
});

export const GetUserByIdSchema = z.object({
  _id: z.string().trim(),
});

export const CreateUserSchema = BaseSchema.extend({
  password: z.string().trim(),
});

export const UpdateUserSchema = BaseSchema.extend({
  password: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']),
});

export const ListUserPaginatedSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
  sub: z.string().trim().optional(),
});

export const UpdateUserProfileSchema = z.object({
  name: z.string().trim(),
  email: z.email().trim(),
  group: z.string().trim(),

  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().optional(),
  allowPasswordChange: z.coerce.boolean().default(false),
});
