import { useMemo } from 'react';

import { useProfileRead } from './tanstack-query/use-profile-read';

import type { IGroup, ITable } from '@/lib/interfaces';
import { useAuthStore } from '@/stores/authentication';

export type TableAction =
  | 'VIEW_TABLE'
  | 'UPDATE_TABLE'
  | 'REMOVE_TABLE'
  | 'CREATE_TABLE'
  | 'CREATE_FIELD'
  | 'UPDATE_FIELD'
  | 'REMOVE_FIELD'
  | 'VIEW_FIELD'
  | 'CREATE_ROW'
  | 'UPDATE_ROW'
  | 'REMOVE_ROW'
  | 'VIEW_ROW';

const ACTION_FIELD_MAP = {
  VIEW_TABLE: 'viewTable',
  UPDATE_TABLE: 'updateTable',
  REMOVE_TABLE: 'updateTable',
  CREATE_TABLE: 'updateTable',
  CREATE_FIELD: 'createField',
  UPDATE_FIELD: 'updateField',
  REMOVE_FIELD: 'removeField',
  VIEW_FIELD: 'viewField',
  CREATE_ROW: 'createRow',
  UPDATE_ROW: 'updateRow',
  REMOVE_ROW: 'removeRow',
  VIEW_ROW: 'viewRow',
} as const;

/**
 * Resolve todos os IDs de grupo do usuario, incluindo via encompasses (recursivo)
 */
export function resolveUserGroupIds(groups: Array<IGroup>): Array<string> {
  const visited = new Set<string>();

  const walk = (grps: Array<IGroup>): void => {
    for (const group of grps) {
      const id = group._id?.toString();
      if (!id || visited.has(id)) continue;
      visited.add(id);
      if (group.encompasses && Array.isArray(group.encompasses)) {
        walk(group.encompasses);
      }
    }
  };

  walk(groups);
  return Array.from(visited);
}

/**
 * Resolve todos os objetos IGroup do usuario, incluindo via encompasses (recursivo)
 */
export function resolveUserGroups(groups: Array<IGroup>): Array<IGroup> {
  const visited = new Set<string>();
  const result: Array<IGroup> = [];

  const walk = (grps: Array<IGroup>): void => {
    for (const group of grps) {
      const id = group._id?.toString();
      if (!id || visited.has(id)) continue;
      visited.add(id);
      result.push(group);
      if (group.encompasses && Array.isArray(group.encompasses)) {
        walk(group.encompasses);
      }
    }
  };

  walk(groups);
  return result;
}

/**
 * Resolve as systemPermissions unificadas de todos os grupos do usuario
 */
export function resolveUserSystemPermissions(
  groups: Array<IGroup>,
): Record<string, boolean> {
  const allGroups = resolveUserGroups(groups);
  const permissions: Record<string, boolean> = {};

  for (const group of allGroups) {
    if (!group.systemPermissions) continue;
    for (const [key, value] of Object.entries(group.systemPermissions)) {
      if (value === true) {
        permissions[key] = true;
      }
    }
  }

  return permissions;
}

interface UseTablePermissionResult {
  isOwner: boolean;
  can: (action: TableAction) => boolean;
  isLoading: boolean;
}

/**
 * Hook para verificar permissoes de tabela
 *
 * Logica:
 * 1. Se nao ha usuario -> verifica se a acao e PUBLIC na tabela
 * 2. Se usuario e MASTER -> acesso total
 * 3. Se usuario e dono da tabela -> acesso total
 * 4. Para cada acao -> verifica o valor do campo na tabela (PUBLIC, NOBODY, ou group ID)
 */
export function useTablePermission(
  table: ITable | undefined,
): UseTablePermissionResult {
  const auth = useAuthStore();
  const profile = useProfileRead();

  const user = auth.user;
  const userId = user?._id;

  const isOwner = useMemo(() => {
    if (!table || !userId) return false;
    const ownerId =
      typeof table.owner === 'string' ? table.owner : table.owner._id;
    return ownerId === userId;
  }, [table, userId]);

  const resolvedGroupIds = useMemo(() => {
    if (!profile.data?.groups) return [];
    return resolveUserGroupIds(profile.data.groups);
  }, [profile.data]);

  const resolvedGroups = useMemo(() => {
    if (!profile.data?.groups) return [];
    return resolveUserGroups(profile.data.groups);
  }, [profile.data]);

  const isMaster = useMemo(() => {
    return resolvedGroups.some((g) => g.slug === 'MASTER');
  }, [resolvedGroups]);

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      if (isMaster) return true;
      if (isOwner) return true;

      const fieldKey = ACTION_FIELD_MAP[action];
      const value = (table as Record<string, unknown> | undefined)?.[fieldKey];

      if (!user) {
        if (value === 'PUBLIC') return true;
        return false;
      }

      if (typeof value === 'string') {
        if (value === 'PUBLIC') return true;
        if (value === 'NOBODY') return false;
        return resolvedGroupIds.includes(value);
      }

      return false;
    };
  }, [isMaster, isOwner, table, user, resolvedGroupIds]);

  return {
    isOwner,
    can,
    isLoading: profile.status === 'pending',
  };
}

/**
 * Hook para verificar permissoes do sistema (systemPermissions dos grupos)
 * Verifica uniao de permissoes de todos os grupos do usuario
 */
export function usePermission(): {
  can: (permission: string) => boolean;
  isLoading: boolean;
} {
  const profile = useProfileRead();

  const resolvedGroups = useMemo(() => {
    if (!profile.data?.groups) return [];
    return resolveUserGroups(profile.data.groups);
  }, [profile.data]);

  const isMaster = useMemo(() => {
    return resolvedGroups.some((g) => g.slug === 'MASTER');
  }, [resolvedGroups]);

  const can = useMemo(() => {
    return (permission: string): boolean => {
      if (!profile.data) return false;
      if (isMaster) return true;
      return resolvedGroups.some(
        (g) => g.systemPermissions?.[permission] === true,
      );
    };
  }, [profile.data, isMaster, resolvedGroups]);

  return {
    can,
    isLoading: profile.status === 'pending',
  };
}
