import { useCallback, useMemo } from 'react';

import { useGroupReadList } from '@/hooks/tanstack-query/use-group-read-list';
import { E_ROLE } from '@/lib/constant';
import type { IField } from '@/lib/interfaces';
import type { FieldContext } from '@/lib/permission';
import { isFieldVisibleInContext, resolveUserGroupIds } from '@/lib/permission';
import { useAuthStore } from '@/stores/authentication';

/**
 * Decide se um campo é visível para o usuário atual num contexto (lista,
 * formulário ou detalhe), respeitando o binding por grupo do campo. MASTER e
 * ADMINISTRATOR enxergam campos liberados a grupos; campos NOBODY ficam ocultos
 * para todos. Reutiliza o fecho de grupos resolvido no client.
 */
export function useFieldVisibility(): {
  isFieldVisible: (field: IField, context: FieldContext) => boolean;
} {
  const user = useAuthStore((state) => state.user);
  const { data: groups } = useGroupReadList();

  const userGroupIds = useMemo(
    () => resolveUserGroupIds(user, groups ?? []),
    [user, groups],
  );

  const userRole = user?.group?.slug;
  const isPrivileged =
    userRole === E_ROLE.MASTER || userRole === E_ROLE.ADMINISTRATOR;

  const isFieldVisible = useCallback(
    (field: IField, context: FieldContext): boolean =>
      isFieldVisibleInContext(field, context, userGroupIds, isPrivileged),
    [userGroupIds, isPrivileged],
  );

  return { isFieldVisible };
}
