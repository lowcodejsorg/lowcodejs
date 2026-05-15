import z from 'zod';

const slugSchema = z.string().trim().min(1, 'Slug inválido');

export const ExportTableValidator = z
  .object({
    slug: slugSchema.optional(),
    slugs: z.array(slugSchema).min(1).optional(),
    exportType: z.enum(['structure', 'data', 'full'], {
      message: 'Tipo de exportacao deve ser: structure, data ou full',
    }),
    acknowledgeMissingRelationships: z.boolean().optional().default(false),
  })
  .refine(
    (value) => Boolean(value.slug) || (value.slugs && value.slugs.length > 0),
    {
      message: 'Informe slug ou slugs',
      path: ['slugs'],
    },
  );

export type ExportTablePayload = z.infer<typeof ExportTableValidator>;
