import { Service } from 'fastify-decorators';

import {
  E_ROLE,
  E_TABLE_PERMISSION,
  E_TABLE_VISIBILITY,
  E_USER_STATUS,
  type IPermission,
  type ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { User as UserModel } from '@application/model/user.model';

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
  async checkUserHasPermission(
    userId: string,
    permission: ValueOf<typeof E_TABLE_PERMISSION>,
  ): Promise<void> {
    const permissionSlug = E_TABLE_PERMISSION[permission];

    const user = await UserModel.findOne({ _id: userId })
      .populate({
        path: 'group',
        populate: { path: 'permissions' },
      })
      .lean();

    if (!user) {
      throw HTTPException.Forbidden('User not found', 'USER_NOT_FOUND');
    }

    if (user.status !== E_USER_STATUS.ACTIVE) {
      throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');
    }

    const group = user.group as { permissions?: IPermission[] } | undefined;

    if (!group?.permissions || !Array.isArray(group.permissions)) {
      throw HTTPException.Forbidden(
        'User group or permissions not found',
        'PERMISSIONS_NOT_FOUND',
      );
    }

    const hasPermission = group.permissions.some(
      (p) => p.slug === permissionSlug,
    );

    if (!hasPermission) {
      throw HTTPException.Forbidden(
        `Permission denied. Required: ${permission}`,
        'INSUFFICIENT_PERMISSIONS',
      );
    }
  }

  async checkUserIsActive(userId: string): Promise<void> {
    const userDoc = await UserModel.findOne({ _id: userId }).lean();
    if (!userDoc || userDoc.status !== E_USER_STATUS.ACTIVE) {
      throw HTTPException.Forbidden('User is not active', 'USER_NOT_ACTIVE');
    }
  }

  isPublicAccess(input: AccessCheckInput): boolean {
    const { table, requiredPermission, httpMethod } = input;
    if (!table) return false;

    // Tabela publica + GET view
    if (
      table.visibility === E_TABLE_VISIBILITY.PUBLIC &&
      httpMethod === 'GET' &&
      VIEW_PERMISSIONS.includes(requiredPermission)
    ) {
      return true;
    }

    // Tabela form + POST CREATE_ROW
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
    const { table, userId, userRole, requiredPermission } = input;

    if (!userId || !userRole) {
      throw HTTPException.Unauthorized(
        'User not authenticated',
        'USER_NOT_AUTHENTICATED',
      );
    }

    // MASTER tem acesso total
    if (userRole === E_ROLE.MASTER) {
      return { allowed: true };
    }

    // ADMINISTRATOR tem acesso total (se ativo)
    if (userRole === E_ROLE.ADMINISTRATOR) {
      await this.checkUserIsActive(userId);
      return { allowed: true };
    }

    // CREATE_TABLE: apenas verificar permissao do grupo
    if (requiredPermission === E_TABLE_PERMISSION.CREATE_TABLE) {
      await this.checkUserHasPermission(userId, requiredPermission);
      return { allowed: true };
    }

    if (!table) {
      throw HTTPException.BadRequest(
        'Table is required for this action',
        'TABLE_REQUIRED',
      );
    }

    // Verificar ownership
    const isOwner = userId === table.owner?.toString();
    const isTableAdmin = table.administrators?.some(
      (a) => a?.toString() === userId,
    );
    const ownership = { isOwner, isAdministrator: !!isTableAdmin };

    // Dono/admin da tabela -> acesso total (se ativo)
    if (isOwner || isTableAdmin) {
      await this.checkUserIsActive(userId);
      return { allowed: true, ownership };
    }

    // Nao e dono/admin -> aplicar regras de visibilidade
    if (OWNER_ONLY_ACTIONS.includes(requiredPermission)) {
      throw HTTPException.Forbidden(
        'Only table owner or administrators can perform this action',
        'OWNER_OR_ADMIN_REQUIRED',
      );
    }

    const visibility = table.visibility || E_TABLE_VISIBILITY.RESTRICTED;
    this.checkVisibilityRules(visibility, requiredPermission);

    // Verificar permissao no grupo
    await this.checkUserHasPermission(userId, requiredPermission);

    return { allowed: true, ownership };
  }

  private checkVisibilityRules(
    visibility: string,
    requiredPermission: string,
  ): void {
    switch (visibility) {
      case E_TABLE_VISIBILITY.PRIVATE:
        throw HTTPException.Forbidden('This table is private', 'TABLE_PRIVATE');

      case E_TABLE_VISIBILITY.RESTRICTED:
        if (requiredPermission === 'CREATE_ROW') {
          throw HTTPException.Forbidden(
            'Only owner/administrators can create records in restricted tables',
            'RESTRICTED_CREATE',
          );
        }
        break;

      case E_TABLE_VISIBILITY.FORM:
        if (VIEW_PERMISSIONS.includes(requiredPermission)) {
          throw HTTPException.Forbidden(
            'Only owner/administrators can view form tables',
            'FORM_VIEW_RESTRICTED',
          );
        }
        break;

      case E_TABLE_VISIBILITY.OPEN:
      case E_TABLE_VISIBILITY.PUBLIC:
        break;
    }
  }
}
