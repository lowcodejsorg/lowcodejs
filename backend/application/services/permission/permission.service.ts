import { Service } from 'fastify-decorators';

import {
  E_ROLE,
  E_TABLE_PERMISSION,
  E_TABLE_VISIBILITY,
  E_USER_STATUS,
  type IUser,
  type ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';

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

    if (!user.group?.permissions || !Array.isArray(user.group.permissions)) {
      throw HTTPException.Forbidden(
        'Grupo ou permissões do usuário não encontrados',
        'PERMISSIONS_NOT_FOUND',
      );
    }

    const hasPermission = user.group.permissions.some(
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
    const { table, userId, userRole, user, requiredPermission } = input;

    if (!userId || !userRole) {
      throw HTTPException.Unauthorized(
        'Usuário não autenticado',
        'USER_NOT_AUTHENTICATED',
      );
    }

    // MASTER tem acesso total
    if (userRole === E_ROLE.MASTER) {
      return { allowed: true };
    }

    // ADMINISTRATOR tem acesso total (se ativo)
    if (userRole === E_ROLE.ADMINISTRATOR) {
      await this.checkUserIsActive(user ?? null);
      return { allowed: true };
    }

    // CREATE_TABLE: apenas verificar permissao do grupo
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

    // Verificar ownership
    const isOwner = userId === table.owner?.toString();
    const isTableAdmin = table.administrators?.some(
      (a) => a?.toString() === userId,
    );
    const ownership = { isOwner, isAdministrator: !!isTableAdmin };

    // Dono/admin da tabela -> acesso total (se ativo)
    if (isOwner || isTableAdmin) {
      await this.checkUserIsActive(user ?? null);
      return { allowed: true, ownership };
    }

    // Nao e dono/admin -> aplicar regras de visibilidade
    if (OWNER_ONLY_ACTIONS.includes(requiredPermission)) {
      throw HTTPException.Forbidden(
        'Apenas o proprietário ou administradores podem realizar esta ação',
        'OWNER_OR_ADMIN_REQUIRED',
      );
    }

    const visibility = table.visibility || E_TABLE_VISIBILITY.RESTRICTED;
    this.checkVisibilityRules(visibility, requiredPermission);

    // Verificar permissao no grupo
    await this.checkUserHasPermission(user ?? null, requiredPermission);

    return { allowed: true, ownership };
  }

  private checkVisibilityRules(
    visibility: string,
    requiredPermission: string,
  ): void {
    switch (visibility) {
      case E_TABLE_VISIBILITY.PRIVATE:
        throw HTTPException.Forbidden('Esta tabela é privada', 'TABLE_PRIVATE');

      case E_TABLE_VISIBILITY.RESTRICTED:
        if (requiredPermission === 'CREATE_ROW') {
          throw HTTPException.Forbidden(
            'Apenas proprietário/administradores podem criar registros em tabelas restritas',
            'RESTRICTED_CREATE',
          );
        }
        break;

      case E_TABLE_VISIBILITY.FORM:
        if (VIEW_PERMISSIONS.includes(requiredPermission)) {
          throw HTTPException.Forbidden(
            'Apenas proprietário/administradores podem visualizar tabelas de formulário',
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
