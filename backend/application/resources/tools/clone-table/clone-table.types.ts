import type { Either } from '@application/core/either.core';
import type { ITable } from '@application/core/entity.core';
import type HTTPException from '@application/core/exception.core';
import type { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import type { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { CloneTablePayload } from './clone-table.validator';

export type CloneTableUseCasePayload = CloneTablePayload & {
  ownerId: string;
};

export type CloneTableResponse = Either<
  HTTPException,
  {
    table: ITable;
    fieldIdMap: Record<string, string>;
  }
>;

export type CloneTableDeps = {
  tableRepository: TableContractRepository;
  fieldRepository: FieldContractRepository;
};
