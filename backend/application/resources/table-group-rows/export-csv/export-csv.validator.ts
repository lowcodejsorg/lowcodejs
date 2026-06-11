import z from 'zod';

export const GroupRowExportCsvParamsValidator = z.object({
  slug: z.string().trim(),
  rowId: z.string().trim(),
  groupSlug: z.string().trim(),
});

export type GroupRowExportCsvPayload = z.infer<
  typeof GroupRowExportCsvParamsValidator
>;
