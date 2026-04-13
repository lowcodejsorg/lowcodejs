import z from 'zod';

import { Merge } from '@application/core/entity.core';

export const UserGroupUpdateParamsValidator = z.object({
  _id: z
    .string({ message: 'O ID é obrigatório' })
    .trim()
    .min(1, 'O ID é obrigatório'),
});

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

export const UserGroupUpdateBodyValidator = z.object({
  name: z
    .string({ message: 'O nome deve ser um texto' })
    .trim()
    .min(1, 'O nome é obrigatório')
    .optional(),
  description: z
    .string({ message: 'A descrição deve ser um texto' })
    .trim()
    .nullable()
    .optional(),
  permissions: z
    .array(z.string({ message: 'Cada permissão deve ser um texto' }))
    .optional(),
  encompasses: z
    .array(z.string({ message: 'Cada grupo deve ser um texto' }))
    .optional(),
  systemPermissions: SystemPermissionsValidator.optional(),
});

export type UserGroupUpdatePayload = Merge<
  z.infer<typeof UserGroupUpdateParamsValidator>,
  z.infer<typeof UserGroupUpdateBodyValidator>
>;
