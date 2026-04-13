/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type {
  E_SYSTEM_PERMISSION,
  IGroup,
  IUser,
  ValueOf,
} from '@application/core/entity.core';

@Service()
export abstract class GroupResolutionContractService {
  /**
   * Retorna todos os group IDs do usuario (diretos + engloba recursivo)
   */
  abstract resolveUserGroupIds(user: IUser): string[];

  /**
   * Retorna todos os grupos resolvidos do usuario (diretos + engloba recursivo)
   */
  abstract resolveUserGroups(user: IUser): IGroup[];

  /**
   * Verifica se o usuario pertence a um grupo especifico (incluindo via engloba)
   */
  abstract userBelongsToGroup(
    user: IUser,
    targetGroupId: string,
  ): boolean;

  /**
   * Verifica se o usuario possui uma permissao global do sistema
   * Faz a uniao de systemPermissions de todos os grupos resolvidos
   */
  abstract checkSystemPermission(
    user: IUser,
    permission: ValueOf<typeof E_SYSTEM_PERMISSION>,
  ): boolean;

  /**
   * Verifica se o usuario pertence a algum grupo com slug MASTER
   */
  abstract isMasterUser(user: IUser): boolean;
}
