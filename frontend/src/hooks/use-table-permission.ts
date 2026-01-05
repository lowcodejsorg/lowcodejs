import { useMemo } from 'react';

import { useProfileRead } from './tanstack-query/use-profile-read';

import type { ITable } from '@/lib/interfaces';
import { useAuthenticationStore } from '@/stores/authentication';

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
 * Hook para verificar permissões de tabela
 *
 * Lógica:
 * 1. Se usuário é dono ou admin da tabela -> acesso total
 * 2. Se não -> verifica permissão do grupo do usuário
 */
export function useTablePermission(
  table: ITable | undefined,
): UseTablePermissionResult {
  const auth = useAuthenticationStore();
  const profile = useProfileRead();

  const userId = auth.authenticated?.sub;

  const isOwner = useMemo(() => {
    if (!table || !userId) return false;
    const ownerId =
      typeof table.configuration.owner === 'string'
        ? table.configuration.owner
        : table.configuration.owner._id;
    return ownerId === userId;
  }, [table, userId]);

  const isAdmin = useMemo(() => {
    if (!table || !userId) return false;
    return table.configuration.administrators.some((admin) => {
      const adminId = typeof admin === 'string' ? admin : admin._id;
      return adminId === userId;
    });
  }, [table, userId]);

  const isOwnerOrAdmin = isOwner || isAdmin;

  const permissions = useMemo(() => {
    if (!profile.data) return [];
    return profile.data.group.permissions.map((p) => p.slug.toLowerCase());
  }, [profile.data]);

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      // Dono ou admin da tabela pode fazer tudo
      if (isOwnerOrAdmin) return true;

      // Verifica permissões do grupo do usuário
      const requiredSlug = PERMISSION_SLUG_MAP[action].toLowerCase();
      return permissions.includes(requiredSlug);
    };
  }, [isOwnerOrAdmin, permissions]);

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

  const permissions = useMemo(() => {
    if (!profile.data) return [];
    return profile.data.group.permissions.map((p) => p.slug.toLowerCase());
  }, [profile.data]);

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      const requiredSlug = PERMISSION_SLUG_MAP[action].toLowerCase();
      return permissions.includes(requiredSlug);
    };
  }, [permissions]);

  return {
    can,
    isLoading: profile.status === 'pending',
  };
}
