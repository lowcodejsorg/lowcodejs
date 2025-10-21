import z from 'zod';

export const CreateRowCollectionSchema = z.record(
  z.string(),
  z.union([
    z.string().trim(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.string().trim()),
    z.array(z.number()),
    z.array(
      z
        .object({
          _id: z.string().trim().optional(),
        })
        .loose(),
    ),
    z.object({}).loose(),
  ]),
);

export const UpdateRowCollectionSchema = CreateRowCollectionSchema.clone();

export const GetRowCollectionByIdSchema = z.object({
  _id: z.string().trim(),
});

export const GetRowCollectionSlugSchema = z.object({
  slug: z.string().trim(),
});

export const GetRowCollectionQuerySchema = z
  .object({
    trashed: z.enum(['true', 'false']).default('false').optional(),
    public: z.enum(['true', 'false']).default('false'),
  })
  .loose();

export const ListRowCollectionPaginatedSchema = z
  .object({
    page: z.coerce.number().default(1),
    perPage: z.coerce.number().default(50),
    search: z.string().trim().optional(),
  })
  .loose();

export const ReactionRowCollectionSchema = z.object({
  type: z.enum(['like', 'unlike']),
  field: z.string().trim(),
  user: z.string().trim().optional(),
});

export const EvaluationRowCollectionSchema = z.object({
  value: z.number(),
  field: z.string().trim(),
  user: z.string().trim().optional(),
});
