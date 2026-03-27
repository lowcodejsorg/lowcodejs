/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { ITable, ValueOf } from '@application/core/entity.core';
import type { E_TABLE_PERMISSION } from '@application/core/entity.core';

export type AccessCheckResult = {
  allowed: boolean;
  ownership?: { isOwner: boolean; isAdministrator: boolean };
};

export type AccessCheckInput = {
  table?: ITable;
  userId?: string;
  userRole?: string;
  requiredPermission: ValueOf<typeof E_TABLE_PERMISSION>;
  httpMethod: string;
};

@Service()
export abstract class PermissionContractService {
  /**
   * Verifica se o usuario tem a permissao necessaria no seu grupo
   */
  abstract checkUserHasPermission(
    userId: string,
    permission: ValueOf<typeof E_TABLE_PERMISSION>,
  ): Promise<void>;

  /**
   * Verifica se o usuario esta ativo
   */
  abstract checkUserIsActive(userId: string): Promise<void>;

  /**
   * Verifica se o acesso a tabela e publico (visitante sem auth)
   */
  abstract isPublicAccess(input: AccessCheckInput): boolean;

  /**
   * Verifica permissoes de acesso completas para usuario autenticado
   * Lanca HTTPException se nao autorizado
   */
  abstract checkTableAccess(
    input: AccessCheckInput,
  ): Promise<AccessCheckResult>;
}
