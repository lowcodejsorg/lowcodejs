/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { IUser } from '@application/core/entity.core';

@Service()
export abstract class GroupResolverContractService {
  /**
   * Conjunto de ids de grupos que o usuario satisfaz: o fecho transitivo de
   * `{group} ∪ groups` seguindo `encompasses`. Usado para decidir se um binding
   * de acao (GROUP) e atendido.
   */
  abstract resolveUserGroupIds(user: IUser | null): Promise<Set<string>>;

  /**
   * Uniao das permissoes (slugs) de todos os grupos do fecho do usuario. Usado
   * pelas capacidades de area (MANAGE_USERS, MANAGE_MENU, etc.) e pelas
   * permissoes de tabela herdadas do grupo.
   */
  abstract resolveCapabilities(user: IUser | null): Promise<Set<string>>;
}
