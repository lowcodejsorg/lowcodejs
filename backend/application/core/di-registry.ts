import { injectablesHolder } from 'fastify-decorators';

import { EvaluationContractRepository } from '@application/repositories/evaluation/evaluation-contract.repository';
import EvaluationMongooseRepository from '@application/repositories/evaluation/evaluation-mongoose.repository';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import FieldMongooseRepository from '@application/repositories/field/field-mongoose.repository';
import { MenuContractRepository } from '@application/repositories/menu/menu-contract.repository';
import MenuMongooseRepository from '@application/repositories/menu/menu-mongoose.repository';
import { PermissionContractRepository } from '@application/repositories/permission/permission-contract.repository';
import PermissionMongooseRepository from '@application/repositories/permission/permission-mongoose.repository';
import { ReactionContractRepository } from '@application/repositories/reaction/reaction-contract.repository';
import ReactionMongooseRepository from '@application/repositories/reaction/reaction-mongoose.repository';
import { StorageContractRepository } from '@application/repositories/storage/storage-contract.repository';
import StorageMongooseRepository from '@application/repositories/storage/storage-mongoose.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import TableMongooseRepository from '@application/repositories/table/table-mongoose.repository';
import { UserContractRepository } from '@application/repositories/user/user-contract.repository';
import UserMongooseRepository from '@application/repositories/user/user-mongoose.repository';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';
import UserGroupMongooseRepository from '@application/repositories/user-group/user-group-mongoose.repository';
import { ValidationTokenContractRepository } from '@application/repositories/validation-token/validation-token-contract.repository';
import ValidationTokenMongooseRepository from '@application/repositories/validation-token/validation-token-mongoose.repository';

/**
 * Registro explícito de dependências.
 * Quando trocar de ORM, altere apenas os imports e registros aqui.
 */
export function registerDependencies(): void {
  injectablesHolder.injectService(
    EvaluationContractRepository,
    EvaluationMongooseRepository,
  );

  injectablesHolder.injectService(
    FieldContractRepository,
    FieldMongooseRepository,
  );

  injectablesHolder.injectService(
    MenuContractRepository,
    MenuMongooseRepository,
  );

  injectablesHolder.injectService(
    PermissionContractRepository,
    PermissionMongooseRepository,
  );

  injectablesHolder.injectService(
    ReactionContractRepository,
    ReactionMongooseRepository,
  );

  injectablesHolder.injectService(
    StorageContractRepository,
    StorageMongooseRepository,
  );

  injectablesHolder.injectService(
    TableContractRepository,
    TableMongooseRepository,
  );

  injectablesHolder.injectService(
    UserContractRepository,
    UserMongooseRepository,
  );

  injectablesHolder.injectService(
    UserGroupContractRepository,
    UserGroupMongooseRepository,
  );

  injectablesHolder.injectService(
    ValidationTokenContractRepository,
    ValidationTokenMongooseRepository,
  );
}
