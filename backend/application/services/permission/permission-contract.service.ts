/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type {
  E_COLLABORATION_PROFILE,
  E_TABLE_PERMISSION,
  ITable,
  IUser,
  ValueOf,
} from '@application/core/entity.core';

export type AccessCheckResult = {
  allowed: boolean;
  ownership?: { isOwner: boolean; isAdministrator: boolean };
  profile?: ValueOf<typeof E_COLLABORATION_PROFILE>;
  ownOnly?: boolean;
};

export type AccessCheckInput = {
  table?: ITable;
  userId?: string;
  user?: IUser | null;
  requiredPermission: ValueOf<typeof E_TABLE_PERMISSION>;
  httpMethod: string;
};

@Service()
export abstract class PermissionContractService {
  /**
   * Verifica se o usuario tem a permissao necessaria no seu grupo
   */
  abstract checkUserHasPermission(
    user: IUser | null,
    permission: ValueOf<typeof E_TABLE_PERMISSION>,
  ): Promise<void>;

  /**
   * Verifica se o usuario esta ativo
   */
  abstract checkUserIsActive(user: IUser | null): Promise<void>;

  /**
   * Verifica se o acesso a tabela e publico (visitante sem auth)
   */
  abstract isPublicAccess(input: AccessCheckInput): boolean;

  /**
   * Verifica permissoes de acesso completas para usuario autenticado.
   * Lanca HTTPException se nao autorizado. Retorna ownOnly=true quando o
   * perfil do colaborador exigir row-level security (contributor).
   */
  abstract checkTableAccess(
    input: AccessCheckInput,
  ): Promise<AccessCheckResult>;
}
