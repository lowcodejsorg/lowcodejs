/* eslint-disable no-unused-vars */
import type { IField } from '@application/core/entity.core';

export abstract class RowContextBuilderContractService {
  abstract transform<T extends Record<string, any>>(
    rowJson: T,
    fields: IField[],
    userId?: string,
  ): T;
}
