import { Inject, Service } from 'fastify-decorators';

import {
  E_COLLABORATION_PROFILE,
  E_TABLE_PERMISSION,
  E_USER_STATUS,
  type ITable,
  type IUser,
  type ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { GroupResolutionContractService } from '@application/services/group-resolution/group-resolution-contract.service';

import type {
  AccessCheckInput,
  AccessCheckResult,
} from './permission-contract.service';
import { PermissionContractService } from './permission-contract.service';

type TableActionField =
  | 'viewTable'
  | 'updateTable'
  | 'createField'
  | 'updateField'
  | 'removeField'
  | 'viewField'
  | 'createRow'
  | 'updateRow'
  | 'removeRow'
  | 'viewRow';

const ACTION_TO_FIELD: Partial<
  Record<ValueOf<typeof E_TABLE_PERMISSION>, TableActionField>
> = {
  [E_TABLE_PERMISSION.VIEW_TABLE]: 'viewTable',
  [E_TABLE_PERMISSION.UPDATE_TABLE]: 'updateTable',
  [E_TABLE_PERMISSION.CREATE_FIELD]: 'createField',
  [E_TABLE_PERMISSION.UPDATE_FIELD]: 'updateField',
  [E_TABLE_PERMISSION.REMOVE_FIELD]: 'removeField',
  [E_TABLE_PERMISSION.VIEW_FIELD]: 'viewField',
  [E_TABLE_PERMISSION.CREATE_ROW]: 'createRow',
  [E_TABLE_PERMISSION.UPDATE_ROW]: 'updateRow',
  [E_TABLE_PERMISSION.REMOVE_ROW]: 'removeRow',
  [E_TABLE_PERMISSION.VIEW_ROW]: 'viewRow',
};

type CollabRule = 'yes' | 'no' | 'own';

const COLLAB_MATRIX: Record<
  ValueOf<typeof E_COLLABORATION_PROFILE>,
  Partial<Record<TableActionField, CollabRule>>
> = {
  [E_COLLABORATION_PROFILE.OWNER]: {
    viewTable: 'yes',
    updateTable: 'yes',
    createField: 'yes',
    updateField: 'yes',
    removeField: 'yes',
    viewField: 'yes',
    createRow: 'yes',
    updateRow: 'yes',
    removeRow: 'yes',
    viewRow: 'yes',
  },
  [E_COLLABORATION_PROFILE.ADMIN]: {
    viewTable: 'yes',
    updateTable: 'no',
    createField: 'yes',
    updateField: 'yes',
    removeField: 'yes',
    viewField: 'yes',
    createRow: 'yes',
    updateRow: 'yes',
    removeRow: 'yes',
    viewRow: 'yes',
  },
  [E_COLLABORATION_PROFILE.EDITOR]: {
    viewTable: 'yes',
    updateTable: 'no',
    createField: 'no',
    updateField: 'no',
    removeField: 'no',
    viewField: 'yes',
    createRow: 'yes',
    updateRow: 'yes',
    removeRow: 'yes',
    viewRow: 'yes',
  },
  [E_COLLABORATION_PROFILE.CONTRIBUTOR]: {
    viewTable: 'yes',
    updateTable: 'no',
    createField: 'no',
    updateField: 'no',
    removeField: 'no',
    viewField: 'yes',
    createRow: 'yes',
    updateRow: 'own',
    removeRow: 'own',
    viewRow: 'yes',
  },
  [E_COLLABORATION_PROFILE.VIEWER]: {
    viewTable: 'yes',
    updateTable: 'no',
    createField: 'no',
    updateField: 'no',
    removeField: 'no',
    viewField: 'yes',
    createRow: 'yes',
    updateRow: 'yes',
    removeRow: 'yes',
    viewRow: 'yes',
  },
};

function getCollaboratorId(collab: { user: unknown }): string | null {
  if (typeof collab.user === 'string') return collab.user;
  if (!collab.user || typeof collab.user !== 'object') return null;
  if (!('_id' in collab.user)) return null;
  const id = collab.user._id;
  if (id === null || id === undefined) return null;
  return String(id);
}

function resolveOwnerId(table: ITable): string | null {
  const owner = table.owner;
  if (!owner) return null;
  if (typeof owner === 'string') return owner;
  if (typeof owner === 'object' && '_id' in owner && owner._id) {
    return String(owner._id);
  }
  return null;
}

@Service()
export default class PermissionService extends PermissionContractService {
  @Inject(GroupResolutionContractService)
  private readonly groupResolutionService!: GroupResolutionContractService;

  async checkUserHasPermission(
    user: IUser | null,
    permission: ValueOf<typeof E_TABLE_PERMISSION>,
  ): Promise<void> {
    const permissionSlug = E_TABLE_PERMISSION[permission];

    if (!user) {
      throw HTTPException.Forbidden('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    if (user.status !== E_USER_STATUS.ACTIVE) {
      throw HTTPException.Forbidden(
        'Usuário não está ativo',
        'USER_NOT_ACTIVE',
      );
    }

    const groups = this.groupResolutionService.resolveUserGroups(user);
    const allPermissions = groups.flatMap((g) => g.permissions ?? []);
    const hasPermission = allPermissions.some((p) => p.slug === permissionSlug);

    if (!hasPermission) {
      throw HTTPException.Forbidden(
        `Permissão negada. Necessário: ${permission}`,
        'INSUFFICIENT_PERMISSIONS',
      );
    }
  }

  async checkUserIsActive(user: IUser | null): Promise<void> {
    if (!user || user.status !== E_USER_STATUS.ACTIVE) {
      throw HTTPException.Forbidden(
        'Usuário não está ativo',
        'USER_NOT_ACTIVE',
      );
    }
  }

  isPublicAccess(input: AccessCheckInput): boolean {
    const { table, requiredPermission } = input;
    if (!table) return false;

    const field = ACTION_TO_FIELD[requiredPermission];
    if (!field) return false;

    return table[field] === 'PUBLIC';
  }

  async checkTableAccess(input: AccessCheckInput): Promise<AccessCheckResult> {
    const { table, userId, user, requiredPermission } = input;

    if (this.isPublicAccess(input)) {
      return { allowed: true };
    }

    if (!userId) {
      throw HTTPException.Unauthorized(
        'Usuário não autenticado',
        'USER_NOT_AUTHENTICATED',
      );
    }

    await this.checkUserIsActive(user ?? null);

    if (user && this.groupResolutionService.isMasterUser(user)) {
      return { allowed: true };
    }

    if (requiredPermission === E_TABLE_PERMISSION.CREATE_TABLE) {
      await this.checkUserHasPermission(user ?? null, requiredPermission);
      return { allowed: true };
    }

    if (!table) {
      throw HTTPException.BadRequest(
        'Tabela é obrigatória para esta ação',
        'TABLE_REQUIRED',
      );
    }

    const field = ACTION_TO_FIELD[requiredPermission];
    if (!field) {
      throw HTTPException.BadRequest(
        `Ação desconhecida: ${requiredPermission}`,
        'UNKNOWN_ACTION',
      );
    }

    const ownerId = resolveOwnerId(table);
    const isOwner = ownerId !== null && ownerId === userId;

    const collaborator = table.collaborators?.find(
      (c) => getCollaboratorId(c) === userId,
    );

    const profile = this.resolveUserProfile(isOwner, collaborator);
    const ownership = {
      isOwner,
      isAdministrator: profile === E_COLLABORATION_PROFILE.ADMIN,
    };

    if (profile) {
      const rule = COLLAB_MATRIX[profile]?.[field];
      if (rule === 'no') {
        throw HTTPException.Forbidden(
          `Perfil ${profile} não pode executar ${requiredPermission}`,
          'COLLAB_PROFILE_DENIED',
        );
      }
      if (rule === 'own') {
        return { allowed: true, ownership, profile, ownOnly: true };
      }
      if (rule === 'yes') {
        return { allowed: true, ownership, profile };
      }
    }

    this.checkTableActionBySystemGroup({
      table,
      user: user ?? null,
      field,
    });

    return { allowed: true, ownership };
  }

  private resolveUserProfile(
    isOwner: boolean,
    collaborator:
      | { profile: ValueOf<typeof E_COLLABORATION_PROFILE> }
      | undefined,
  ): ValueOf<typeof E_COLLABORATION_PROFILE> | undefined {
    if (isOwner) return E_COLLABORATION_PROFILE.OWNER;
    if (collaborator) return collaborator.profile;
    return undefined;
  }

  private checkTableActionBySystemGroup(args: {
    table: ITable;
    user: IUser | null;
    field: TableActionField;
  }): void {
    const { table, user, field } = args;
    const actionValue = table[field];

    if (actionValue === 'NOBODY') {
      throw HTTPException.Forbidden(
        `Ação bloqueada (NOBODY) para ${field}`,
        'ACTION_NOBODY',
      );
    }

    if (actionValue === 'PUBLIC') {
      return;
    }

    if (!user) {
      throw HTTPException.Unauthorized(
        'Usuário não autenticado',
        'USER_NOT_AUTHENTICATED',
      );
    }

    const effectiveGroupIds =
      this.groupResolutionService.resolveUserGroupIds(user);
    if (!effectiveGroupIds.includes(String(actionValue))) {
      throw HTTPException.Forbidden(
        'Grupo do usuário não autorizado para esta ação',
        'ACTION_GROUP_DENIED',
      );
    }
  }
}
