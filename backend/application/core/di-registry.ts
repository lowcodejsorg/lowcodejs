import { injectablesHolder } from 'fastify-decorators';

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

  console.log(JSON.stringify(injectablesHolder, null, 2), injectablesHolder);
}
