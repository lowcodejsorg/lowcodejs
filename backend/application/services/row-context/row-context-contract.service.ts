/* eslint-disable no-unused-vars */
import type { IField, IRow } from '@application/core/entity.core';

export abstract class RowContextContractService {
  abstract transform(row: IRow, fields: IField[], userId?: string): IRow;
}
