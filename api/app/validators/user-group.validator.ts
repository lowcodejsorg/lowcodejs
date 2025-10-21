import z from 'zod';

export const GetUserGroupByIdSchema = z.object({
  _id: z.string(),
});

export const CreateUserGroupSchema = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});

export const UpdateUserGroupSchema = z.object({
  description: z.string().trim().nullable(),
  permissions: z.array(z.string().trim()).default([]),
});

export const ListUserGroupPaginatedSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
});
