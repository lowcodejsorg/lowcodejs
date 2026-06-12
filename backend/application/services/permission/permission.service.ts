/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import {
  E_PERMISSION_TARGET,
  E_PROFILE_ACCESS,
  E_ROLE,
  E_TABLE_PERMISSION,
  E_TABLE_PROFILE,
  E_TABLE_VISIBILITY,
  E_USER_STATUS,
  TABLE_PROFILE_MATRIX,
  type ITable,
  type IUser,
  type ValueOf,
} from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { GroupResolverContractService } from '@application/services/group-resolver/group-resolver-contract.service';

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
export default class PermissionService implements PermissionContractService {
  constructor(private readonly groupResolver: GroupResolverContractService) {}

  async checkUserHasPermission(
    user: IUser | null,
    permission: ValueOf<typeof E_TABLE_PERMISSION>,
  ): Promise<void> {
    if (!user) {
      throw HTTPException.Forbidden('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    if (user.status !== E_USER_STATUS.ACTIVE) {
      throw HTTPException.Forbidden(
        'Usuário não está ativo',
        'USER_NOT_ACTIVE',
      );
    }

    // Considera o fecho de grupos (grupo principal + adicionais + englobados),
    // nao apenas o grupo direto. Um Manager satisfaz permissoes de Registered.
    const capabilities = await this.groupResolver.resolveCapabilities(user);

    if (!capabilities.has(permission)) {
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

    // Novo modelo: a acao e publica quando seu binding aponta para PUBLIC.
    if (table.permissions) {
      const binding = table.permissions[requiredPermission];
      return binding?.kind === E_PERMISSION_TARGET.PUBLIC;
    }

    // Modelo legado (tabela ainda nao migrada): visibilidade PUBLIC/FORM.
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
    const { table, userId, userRole, user, requiredPermission } = input;

    if (!userId || !userRole) {
      // Log diagnostico: ajuda a entender 401 em URL amigavel via SSR (request
      // sem cookie -> visitante -> tabela nao publica nega aqui).
      console.warn(
        '[permission][401]',
        'table:',
        table?.slug,
        'visibility:',
        table?.visibility,
        'requiredPermission:',
        requiredPermission,
        'hasUser:',
        Boolean(userId),
      );
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

    // Dono da tabela: acesso total. O dono pode vir do campo `owner` (legado) ou
    // de um membro com perfil OWNER.
    const member = table.members?.find((m) => m.user?.toString() === userId);
    const isOwner =
      userId === table.owner?.toString() ||
      member?.profile === E_TABLE_PROFILE.OWNER;

    if (isOwner) {
      await this.checkUserIsActive(user ?? null);
      return {
        allowed: true,
        ownership: { isOwner: true, isAdministrator: false },
      };
    }

    // Tabela legada (sem o novo mapa de permissoes): aplica o modelo antigo de
    // administradores + visibilidade, garantindo que nada quebre antes da
    // migracao.
    if (!table.permissions) {
      return this.checkLegacyAccess(
        table,
        userId,
        user ?? null,
        requiredPermission,
      );
    }

    // Novo modelo: exige usuario ativo para qualquer acao alem das publicas.
    await this.checkUserIsActive(user ?? null);

    const ownership = {
      isOwner: false,
      isAdministrator: member?.profile === E_TABLE_PROFILE.ADMIN,
    };

    // 1. O perfil de convidado concede a acao?
    if (member) {
      const access = TABLE_PROFILE_MATRIX[member.profile][requiredPermission];
      if (access === E_PROFILE_ACCESS.ALLOW) {
        return { allowed: true, ownership };
      }
      if (access === E_PROFILE_ACCESS.OWN) {
        return { allowed: true, ownership: { ...ownership, ownOnly: true } };
      }
      // DENY: ainda pode ser liberado pelo binding por grupo abaixo.
    }

    // 2. O binding da acao (Grupo|Public|Nobody) libera?
    if (await this.bindingAllows(table, requiredPermission, user ?? null)) {
      return { allowed: true, ownership };
    }

    throw HTTPException.Forbidden(
      `Permissão negada. Necessário: ${requiredPermission}`,
      'INSUFFICIENT_PERMISSIONS',
    );
  }

  /**
   * Caminho legado: tabelas ainda nao migradas para o modelo de bindings. Usa
   * administradores + regras de visibilidade + permissao de grupo.
   */
  private async checkLegacyAccess(
    table: ITable,
    userId: string,
    user: IUser | null,
    requiredPermission: ValueOf<typeof E_TABLE_PERMISSION>,
  ): Promise<AccessCheckResult> {
    const isTableAdmin = table.administrators?.some(
      (a) => a?.toString() === userId,
    );
    const ownership = { isOwner: false, isAdministrator: !!isTableAdmin };

    if (isTableAdmin) {
      await this.checkUserIsActive(user);
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

    await this.checkUserHasPermission(user, requiredPermission);

    return { allowed: true, ownership };
  }

  /**
   * Avalia o binding de uma acao: PUBLIC libera todos; GROUP libera se o grupo
   * estiver no fecho do usuario; NOBODY nega.
   */
  private async bindingAllows(
    table: ITable,
    action: ValueOf<typeof E_TABLE_PERMISSION>,
    user: IUser | null,
  ): Promise<boolean> {
    const binding = table.permissions?.[action];
    if (!binding) return false;

    if (binding.kind === E_PERMISSION_TARGET.PUBLIC) return true;

    if (binding.kind === E_PERMISSION_TARGET.GROUP) {
      if (!binding.group) return false;
      const groupIds = await this.groupResolver.resolveUserGroupIds(user);
      return groupIds.has(binding.group);
    }

    return false;
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
