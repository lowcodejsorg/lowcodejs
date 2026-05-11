/* eslint-disable no-unused-vars */
import type {
  FindOptions,
  ILogger,
  Merge,
} from '@application/core/entity.core';

export type LoggerCreatePayload = Merge<
  Pick<
    ILogger,
    'action' | 'content' | 'url' | 'action' | 'object' | 'object_id'
  >,
  { user_id: string }
>;

export type LoggerUpdatePayload = Merge<
  Pick<ILogger, '_id'>,
  Partial<LoggerCreatePayload>
>;

export type LoggerQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  trashed?: boolean;
};

export abstract class LoggerContractRepository {
  abstract create(payload: LoggerCreatePayload): Promise<ILogger>;
  abstract update(payload: LoggerUpdatePayload): Promise<ILogger>;
  abstract findById(
    _id: string,
    options?: FindOptions,
  ): Promise<ILogger | null>;
  abstract findMany(payload?: LoggerQueryPayload): Promise<ILogger[]>;
  abstract count(payload?: LoggerQueryPayload): Promise<number>;
}
