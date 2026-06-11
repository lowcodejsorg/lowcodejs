import z from 'zod';

export const ImportCsvParamsValidator = z.object({
  slug: z.string().trim(),
});

export type ImportCsvParams = z.infer<typeof ImportCsvParamsValidator>;
