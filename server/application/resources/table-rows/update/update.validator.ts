import z from 'zod';

export const TableRowUpdateBodyValidator = z.record(
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

export const TableRowUpdateParamValidator = z.object({
  slug: z.string().trim(),
  _id: z.string().trim(),
});
