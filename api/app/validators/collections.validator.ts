import z from 'zod';

const Configuration = z.object({
  style: z.enum(['gallery', 'list']).default('list'),
  visibility: z.enum(['public', 'restricted']).default('public'),
  collaboration: z.enum(['open', 'restricted']).default('open'),
  administrators: z.array(z.string()).default([]),
  fields: z.object({
    orderList: z.array(z.string().trim()).default([]),
    orderForm: z.array(z.string().trim()).default([]),
  }),
});

export const GetCollectionBySlugSchema = z.object({
  slug: z.string().trim(),
});

export const GetCollectionQuerySchema = z.object({
  trashed: z.enum(['true', 'false']).default('false').optional(),
  public: z.enum(['true', 'false']).default('false').optional(),
  name: z.string().trim().optional(),
});

export const ListCollectionPaginatedSchema = z.object({
  page: z.coerce.number().default(1),
  perPage: z.coerce.number().default(50),
  search: z.string().trim().optional(),
});

export const CreateCollectionSchema = z.object({
  name: z.string().trim(),
  owner: z.string().trim().optional(),
});

export const UpdateCollectionSchema = z.object({
  name: z.string().trim(),
  description: z.string().trim().nullable(),
  logo: z.string().trim().nullable(),
  configuration: Configuration,
});
