import { useMemo } from 'react';

import { useGroupReadList } from './tanstack-query/use-group-read-list';
import { useProfileRead } from './tanstack-query/use-profile-read';

import { E_ROLE, E_TABLE_PROFILE } from '@/lib/constant';
import type { ITable } from '@/lib/interfaces';
import { resolveUserGroupIds, userSatisfiesBinding } from '@/lib/permission';
import { useAuthStore } from '@/stores/authentication';

export type TableAction =
  | 'VIEW_TABLE'
  | 'UPDATE_TABLE'
  | 'REMOVE_TABLE'
  | 'CREATE_TABLE'
  | 'VIEW_FIELD'
  | 'CREATE_FIELD'
  | 'UPDATE_FIELD'
  | 'REMOVE_FIELD'
  | 'VIEW_ROW'
  | 'CREATE_ROW'
  | 'UPDATE_ROW'
  | 'REMOVE_ROW';

const PERMISSION_SLUG_MAP: Record<TableAction, string> = {
  CREATE_TABLE: 'create-table',
  UPDATE_TABLE: 'update-table',
  REMOVE_TABLE: 'remove-table',
  VIEW_TABLE: 'view-table',
  CREATE_FIELD: 'create-field',
  UPDATE_FIELD: 'update-field',
  REMOVE_FIELD: 'remove-field',
  VIEW_FIELD: 'view-field',
  CREATE_ROW: 'create-row',
  UPDATE_ROW: 'update-row',
  REMOVE_ROW: 'remove-row',
  VIEW_ROW: 'view-row',
};

interface UseTablePermissionResult {
  isOwner: boolean;
  isAdmin: boolean;
  isOwnerOrAdmin: boolean;
  can: (action: TableAction) => boolean;
  isLoading: boolean;
}

/**
 * Hook para verificar permissões de tabela (gating de UX no client).
 *
 * O backend é a fonte de verdade e enforça tudo (inclusive "apenas as próprias
 * rows" para contributor). Aqui fazemos um gating coarse:
 * 1. Privilegiado (MASTER/ADMINISTRATOR, dono, ou membro ADMIN/OWNER) -> tudo.
 * 2. Caso contrário -> avalia o binding da ação contra o fecho de grupos do
 *    usuário (`table.permissions[action]`: PUBLIC libera, GROUP exige o grupo no
 *    fecho, NOBODY/ausente nega).
 */
export function useTablePermission(
  table: ITable | undefined,
): UseTablePermissionResult {
  const auth = useAuthStore();
  const profile = useProfileRead();
  const groups = useGroupReadList();

  const userId = auth.user?._id;

  const isOwner = useMemo(() => {
    if (!table || !userId) return false;
    const ownerId =
      typeof table.owner === 'string' ? table.owner : table.owner._id;
    if (ownerId === userId) return true;
    return Boolean(
      table.members?.some(
        (member) =>
          member.user === userId && member.profile === E_TABLE_PROFILE.OWNER,
      ),
    );
  }, [table, userId]);

  const isAdmin = useMemo(() => {
    if (!table || !userId) return false;
    return Boolean(
      table.members?.some(
        (member) =>
          member.user === userId && member.profile === E_TABLE_PROFILE.ADMIN,
      ),
    );
  }, [table, userId]);

  const isOwnerOrAdmin = isOwner || isAdmin;

  const userGroupIds = useMemo(() => {
    return resolveUserGroupIds(profile.data ?? null, groups.data ?? []);
  }, [profile.data, groups.data]);

  const isMaster = profile.data?.group.slug === E_ROLE.MASTER;
  const isAdministrator = profile.data?.group.slug === E_ROLE.ADMINISTRATOR;

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      // Privilegiados têm acesso total no client (backend reconfirma).
      if (isMaster || isAdministrator || isOwnerOrAdmin) return true;

      // Sem o mapa de permissões (tabela ainda não backfillada): só privilegiado.
      if (!table?.permissions) return false;

      const binding = table.permissions[action];
      // Ausente => negado (espelha o backend, que nega ação sem binding).
      if (!binding) return false;

      return userSatisfiesBinding(binding, userGroupIds);
    };
  }, [isMaster, isAdministrator, isOwnerOrAdmin, table, userGroupIds]);

  return {
    isOwner,
    isAdmin,
    isOwnerOrAdmin,
    can,
    isLoading: profile.status === 'pending',
  };
}

/**
 * Hook para verificar permissões sem tabela específica (ex: CREATE_TABLE)
 * Usa apenas permissões do grupo do usuário
 */
export function usePermission(): {
  can: (action: TableAction) => boolean;
  isLoading: boolean;
} {
  const profile = useProfileRead();

  const isMaster = profile.data?.group.slug === E_ROLE.MASTER;
  const isAdministrator = profile.data?.group.slug === E_ROLE.ADMINISTRATOR;

  const permissions = useMemo(() => {
    if (!profile.data) return [];
    return profile.data.group.permissions.map((p) => p.slug.toLowerCase());
  }, [profile.data]);

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      // MASTER tem acesso total a tudo
      if (isMaster) return true;

      // ADMINISTRATOR tem acesso total a tabelas
      if (isAdministrator) return true;

      const requiredSlug = PERMISSION_SLUG_MAP[action].toLowerCase();
      return permissions.includes(requiredSlug);
    };
  }, [isMaster, isAdministrator, permissions]);

  return {
    can,
    isLoading: profile.status === 'pending',
  };
}
