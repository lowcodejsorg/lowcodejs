import z from 'zod';

export const ImportTableValidator = z.object({
  name: z
    .string()
    .trim()
    .max(40, 'Nome deve ter no maximo 40 caracteres')
    .optional()
    .nullable(),
  /**
   * Renomeação por tabela (`slug` original → novo `name`). O slug final é
   * derivado do nome no backend. Tabelas ausentes mantêm nome/slug originais.
   */
  tables: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        name: z
          .string()
          .trim()
          .min(1, 'Nome e obrigatorio')
          .max(40, 'Nome deve ter no maximo 40 caracteres'),
      }),
    )
    .optional(),
  /**
   * Renomeação por item de menu (`slug` original → novo `name`). Aplica-se
   * apenas aos itens em conflito; menus-pai já existentes são reaproveitados
   * e nunca são renomeados.
   */
  menus: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        name: z
          .string()
          .trim()
          .min(1, 'Nome e obrigatorio')
          .max(120, 'Nome deve ter no maximo 120 caracteres'),
      }),
    )
    .optional(),
  fileContent: z.object({}).loose(),
});

export type ImportTablePayload = z.infer<typeof ImportTableValidator>;
