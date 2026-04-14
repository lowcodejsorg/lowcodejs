import z from 'zod';

const SystemPermissionsValidator = z.object({
  VIEW_TABLES: z.boolean().optional(),
  CREATE_TABLES: z.boolean().optional(),
  UPDATE_TABLES: z.boolean().optional(),
  REMOVE_TABLES: z.boolean().optional(),
  USERS: z.boolean().optional(),
  MENU: z.boolean().optional(),
  USER_GROUPS: z.boolean().optional(),
  SETTINGS: z.boolean().optional(),
  TOOLS: z.boolean().optional(),
  PLUGINS: z.boolean().optional(),
});

export const UserGroupCreateBodyValidator = z.object({
  name: z
    .string({ message: 'O nome é obrigatório' })
    .trim()
    .min(1, 'O nome é obrigatório'),
  description: z
    .string({ message: 'A descrição deve ser um texto' })
    .trim()
    .nullable(),
  permissions: z
    .array(z.string({ message: 'Cada permissão deve ser um texto' }))
    .min(1, 'Pelo menos uma permissão é obrigatória'),
  encompasses: z
    .array(z.string({ message: 'Cada grupo deve ser um texto' }))
    .optional(),
  systemPermissions: SystemPermissionsValidator.optional(),
});

export type UserGroupCreatePayload = z.infer<
  typeof UserGroupCreateBodyValidator
>;
