import { injectablesHolder } from 'fastify-decorators';

import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';
import MenuMongooseRepository from '@application/repositories/menu/menu-mongoose.repository';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';
import UserGroupMongooseRepository from '@application/repositories/user-group/user-group-mongoose.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import UserMongooseRepository from '@application/repositories/user/user-mongoose.repository';

/**
 * Registro explícito de dependências.
 * Quando trocar de ORM, altere apenas os imports e registros aqui.
 */
export function registerDependencies(): void {
  console.log('CHAMOU AQUI! DI-REGISTRY');
  injectablesHolder.injectService(
    UserContractRepository,
    UserMongooseRepository,
  );

  injectablesHolder.injectService(
    MenuContractRepository,
    MenuMongooseRepository,
  );

  injectablesHolder.injectService(
    UserGroupContractRepository,
    UserGroupMongooseRepository,
  );

  console.log(JSON.stringify(injectablesHolder, null, 2), injectablesHolder);
}
