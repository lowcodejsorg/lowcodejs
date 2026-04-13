import { Inject, Service } from 'fastify-decorators';

import {
  E_ROLE,
  E_TABLE_PERMISSION,
  E_TABLE_VISIBILITY,
  E_USER_STATUS,
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

const VIEW_PERMISSIONS = ['VIEW_TABLE', 'VIEW_FIELD', 'VIEW_ROW'];

const OWNER_ONLY_ACTIONS = [
  E_TABLE_PERMISSION.CREATE_FIELD,
  E_TABLE_PERMISSION.UPDATE_FIELD,
  E_TABLE_PERMISSION.REMOVE_FIELD,
  E_TABLE_PERMISSION.UPDATE_TABLE,
  E_TABLE_PERMISSION.REMOVE_TABLE,
  E_TABLE_PERMISSION.UPDATE_ROW,
  E_TABLE_PERMISSION.REMOVE_ROW,
].map((p) => p.toString());

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
    const hasPermission = allPermissions.some(
      (p) => p.slug === permissionSlug,
    );

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
    const { table, requiredPermission, httpMethod } = input;
    if (!table) return false;

    if (
      table.visibility === E_TABLE_VISIBILITY.PUBLIC &&
      httpMethod === 'GET' &&
      VIEW_PERMISSIONS.includes(requiredPermission)
    ) {
      return true;
    }

    if (
      table.visibility === E_TABLE_VISIBILITY.FORM &&
      httpMethod === 'POST' &&
      requiredPermission === 'CREATE_ROW'
    ) {
      return true;
    }

    return false;
  }

  async checkTableAccess(input: AccessCheckInput): Promise<AccessCheckResult> {
    const { table, userId, user, requiredPermission } = input;

    if (!userId) {
      throw HTTPException.Unauthorized(
        'Usuário não autenticado',
        'USER_NOT_AUTHENTICATED',
      );
    }

    if (user && this.groupResolutionService.isMasterUser(user)) {
      return { allowed: true };
    }

    const isAdminRole =
      user?.groups?.some((g) => g.slug === E_ROLE.ADMINISTRATOR) ?? false;

    if (isAdminRole) {
      await this.checkUserIsActive(user ?? null);
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

    const isOwner = userId === table.owner?.toString();
    const isTableAdmin = table.collaborators?.some((c) => {
      const collaboratorId =
        typeof c.user === 'string' ? c.user : c.user?._id?.toString();
      return collaboratorId === userId && c.profile === 'ADMIN';
    });
    const ownership = { isOwner, isAdministrator: !!isTableAdmin };

    if (isOwner || isTableAdmin) {
      await this.checkUserIsActive(user ?? null);
      return { allowed: true, ownership };
    }

    if (OWNER_ONLY_ACTIONS.includes(requiredPermission)) {
      throw HTTPException.Forbidden(
        'Apenas o proprietário ou administradores podem realizar esta ação',
        'OWNER_OR_ADMIN_REQUIRED',
      );
    }

    const visibility = table.visibility || E_TABLE_VISIBILITY.RESTRICTED;
    this.checkVisibilityRules(visibility, requiredPermission);

    await this.checkUserHasPermission(user ?? null, requiredPermission);

    return { allowed: true, ownership };
  }

  private checkVisibilityRules(
    visibility: string,
    requiredPermission: string,
  ): void {
    const rules: Record<string, (() => void) | undefined> = {
      [E_TABLE_VISIBILITY.PRIVATE]: () => {
        throw HTTPException.Forbidden('Esta tabela é privada', 'TABLE_PRIVATE');
      },
      [E_TABLE_VISIBILITY.RESTRICTED]: () => {
        if (requiredPermission === 'CREATE_ROW') {
          throw HTTPException.Forbidden(
            'Apenas proprietário/administradores podem criar registros em tabelas restritas',
            'RESTRICTED_CREATE',
          );
        }
      },
      [E_TABLE_VISIBILITY.FORM]: () => {
        if (VIEW_PERMISSIONS.includes(requiredPermission)) {
          throw HTTPException.Forbidden(
            'Apenas proprietário/administradores podem visualizar tabelas de formulário',
            'FORM_VIEW_RESTRICTED',
          );
        }
      },
    };

    const rule = rules[visibility];
    if (rule) {
      rule();
    }
  }
}
