import z from 'zod';

export const UserGroupPaginatedQueryValidator = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
});

export type UserGroupPaginatedPayload = z.infer<typeof UserGroupPaginatedQueryValidator>;
