import type { Either } from '@application/core/either.core';
import type HTTPException from '@application/core/exception.core';

import type { ImportTablePayload } from './import-table.validator';

export type ImportTableUseCasePayload = ImportTablePayload & {
  ownerId: string;
};

export type ImportTableResult = {
  tableId: string;
  slug: string;
  importedFields: number;
  importedRows: number;
};

export type ImportTableResponse = Either<HTTPException, ImportTableResult>;
