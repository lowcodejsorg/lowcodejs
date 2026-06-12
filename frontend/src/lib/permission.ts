import { E_PERMISSION_TARGET } from '@/lib/constant';
import type {
  IField,
  IGroup,
  IPermissionBinding,
  IUser,
} from '@/lib/interfaces';

export type FieldContext = 'list' | 'form' | 'detail';

/**
 * Fecho transitivo dos grupos que o usuário satisfaz: grupo principal + grupos
 * adicionais + todos os englobados (`encompasses`). Espelha o resolver do
 * backend, porém no client (para esconder opções/colunas por grupo).
 */
export function resolveUserGroupIds(
  user: IUser | null,
  allGroups: Array<IGroup>,
): Set<string> {
  const visited = new Set<string>();
  if (!user) return visited;

  const byId = new Map(allGroups.map((group) => [group._id, group]));

  const queue: Array<string> = [];
  if (user.group?._id) queue.push(user.group._id);
  for (const group of user.groups ?? []) {
    if (group?._id) queue.push(group._id);
  }

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) continue;
    if (visited.has(id)) continue;

    visited.add(id);

    const group = byId.get(id);
    if (!group) continue;

    for (const encompassedId of group.encompasses ?? []) {
      if (!visited.has(encompassedId)) queue.push(encompassedId);
    }
  }

  return visited;
}

/**
 * Avalia se o usuário (representado pelo fecho de grupos) satisfaz um binding.
 * Binding ausente = comportamento legado (visível). PUBLIC = todos. NOBODY =
 * ninguém. GROUP = precisa ter o grupo no fecho.
 */
export function userSatisfiesBinding(
  binding: IPermissionBinding | null | undefined,
  userGroupIds: Set<string>,
): boolean {
  if (!binding) return true;
  if (binding.kind === E_PERMISSION_TARGET.PUBLIC) return true;
  if (binding.kind === E_PERMISSION_TARGET.GROUP) {
    return Boolean(binding.group && userGroupIds.has(binding.group));
  }
  return false;
}

// Fallback legado para campos ainda não migrados (binding ausente): usa o
// boolean showIn* do contexto.
function legacyFieldVisible(field: IField, context: FieldContext): boolean {
  if (context === 'list') return field.showInList;
  if (context === 'form') return field.showInForm;
  return field.showInDetail;
}

/**
 * Visibilidade de um campo num contexto (lista/formulário/detalhe) considerando
 * o binding por grupo. NOBODY = oculto para todos. PUBLIC = todos. GROUP =
 * membros do grupo; MASTER/ADMINISTRATOR (isPrivileged) também enxergam.
 * Sem binding, cai no comportamento legado showIn*.
 */
export function isFieldVisibleInContext(
  field: IField,
  context: FieldContext,
  userGroupIds: Set<string>,
  isPrivileged: boolean,
): boolean {
  const binding = field.permissions?.[context];
  if (!binding) return legacyFieldVisible(field, context);

  if (binding.kind === E_PERMISSION_TARGET.NOBODY) return false;
  if (binding.kind === E_PERMISSION_TARGET.PUBLIC) return true;
  if (isPrivileged) return true;
  return Boolean(binding.group && userGroupIds.has(binding.group));
}
