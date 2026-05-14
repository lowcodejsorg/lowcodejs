/* eslint-disable no-unused-vars */
import type {
  E_LOGGER_ACTION_TYPE,
  E_LOGGER_OBJECT_TYPE,
  FindOptions,
  ILogger,
  Merge,
  ValueOf,
} from '@application/core/entity.core';

export type LoggerCreatePayload = Merge<
  Pick<ILogger, 'action' | 'content' | 'url' | 'object' | 'object_id'>,
  { user_id: string | null }
>;

export type LoggerUpdatePayload = Merge<
  Pick<ILogger, '_id'>,
  Partial<LoggerCreatePayload>
>;

export type LoggerQueryPayload = {
  page?: number;
  perPage?: number;
  search?: string;
  user_id?: string | null;
  actions?: Array<ValueOf<typeof E_LOGGER_ACTION_TYPE>>;
  objects?: Array<ValueOf<typeof E_LOGGER_OBJECT_TYPE>>;
  dateFrom?: Date;
  dateTo?: Date;
  sort?: Record<string, 'asc' | 'desc'>;
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
