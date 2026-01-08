import { useMemo } from 'react';

import { useProfileRead } from './tanstack-query/use-profile-read';

import { E_ROLE, E_TABLE_VISIBILITY } from '@/lib/constant';
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

  const isMaster = profile.data?.group.slug === E_ROLE.MASTER;

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      // MASTER tem acesso total a tudo
      if (isMaster) return true;

      // Dono ou admin da tabela pode fazer tudo
      if (isOwnerOrAdmin) return true;

      // Usuário não logado
      if (!userId) {
        const visibility =
          table?.configuration.visibility || E_TABLE_VISIBILITY.RESTRICTED;
        // Visitante pode ver tabelas públicas
        if (
          visibility === E_TABLE_VISIBILITY.PUBLIC &&
          ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(action)
        ) {
          return true;
        }
        // Visitante pode criar registro em tabelas de formulário
        if (visibility === E_TABLE_VISIBILITY.FORM && action === 'CREATE_ROW') {
          return true;
        }
        return false;
      }

      // Ações que SEMPRE requerem dono/admin (independente da visibilidade)
      const ownerOnlyActions: Array<TableAction> = [
        'CREATE_FIELD',
        'UPDATE_FIELD',
        'REMOVE_FIELD',
        'UPDATE_TABLE',
        'REMOVE_TABLE',
        'UPDATE_ROW',
        'REMOVE_ROW',
      ];

      if (ownerOnlyActions.includes(action)) {
        return false; // Só dono/admin pode fazer isso
      }

      // Aplicar regras de visibilidade
      const visibility =
        table?.configuration.visibility || E_TABLE_VISIBILITY.RESTRICTED;

      switch (visibility) {
        case E_TABLE_VISIBILITY.PRIVATE:
          // PRIVADA: Apenas dono/admin pode fazer tudo
          return false;

        case E_TABLE_VISIBILITY.RESTRICTED:
          // RESTRITA: Usuário logado pode ver, mas não criar
          if (action === 'CREATE_ROW') return false;
          break;

        case E_TABLE_VISIBILITY.OPEN:
          // ABERTA: Usuário logado pode ver e criar
          break;

        case E_TABLE_VISIBILITY.PUBLIC:
          // PÚBLICA: Usuário logado pode ver e criar
          break;

        case E_TABLE_VISIBILITY.FORM:
          // FORMULÁRIO: Usuário logado NÃO pode ver (só criar via visitante)
          if (['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'].includes(action)) {
            return false;
          }
          break;
      }

      // Verifica permissões do grupo do usuário
      const requiredSlug = PERMISSION_SLUG_MAP[action].toLowerCase();
      return permissions.includes(requiredSlug);
    };
  }, [isMaster, isOwnerOrAdmin, permissions, table, userId]);

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

  const permissions = useMemo(() => {
    if (!profile.data) return [];
    return profile.data.group.permissions.map((p) => p.slug.toLowerCase());
  }, [profile.data]);

  const can = useMemo(() => {
    return (action: TableAction): boolean => {
      // MASTER tem acesso total a tudo
      if (isMaster) return true;

      const requiredSlug = PERMISSION_SLUG_MAP[action].toLowerCase();
      return permissions.includes(requiredSlug);
    };
  }, [isMaster, permissions]);

  return {
    can,
    isLoading: profile.status === 'pending',
  };
}
