import z from 'zod';

export const MenuReorderBodyValidator = z.object({
  items: z.array(
    z.object({
      _id: z.string({ message: 'O ID é obrigatório' }).min(1),
      order: z.number().int().min(0),
    }),
  ),
});

export type MenuReorderPayload = z.infer<typeof MenuReorderBodyValidator>;
