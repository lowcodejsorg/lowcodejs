import { Service } from 'fastify-decorators';

import type { FindOptions, ILogger } from '@application/core/entity.core';
import { normalize } from '@application/core/util.core';
import { Logger as Model } from '@application/model/logger.model';

import {
  LoggerContractRepository,
  LoggerCreatePayload,
  LoggerQueryPayload,
  LoggerUpdatePayload,
} from './logger-contract.repository';

@Service()
export default class LoggerMongooseRepository implements LoggerContractRepository {
  private readonly populateOptions = [{ path: 'user' }];

  private buildWhereClause(
    payload?: LoggerQueryPayload,
  ): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (payload?.trashed !== undefined) {
      where.trashed = payload.trashed;
    } else {
      where.trashed = false;
    }

    if (payload?.search) {
      where.$or = [
        { action: { $regex: normalize(payload.search), $options: 'i' } },
        { object: { $regex: normalize(payload.search), $options: 'i' } },
      ];
    }

    return where;
  }

  private transform(entity: InstanceType<typeof Model>): ILogger {
    return {
      ...entity.toJSON({ flattenObjectIds: true }),
      _id: entity._id.toString(),
    };
  }

  async create(payload: LoggerCreatePayload): Promise<ILogger> {
    const created = await Model.create(payload);
    const populated = await created.populate(this.populateOptions);
    return this.transform(populated);
  }

  async findById(_id: string, options?: FindOptions): Promise<ILogger | null> {
    const where: Record<string, unknown> = { _id };

    if (options?.trashed !== undefined) {
      where.trashed = options.trashed;
    }

    const logger = await Model.findOne(where).populate(this.populateOptions);

    if (!logger) return null;

    return this.transform(logger);
  }

  async findMany(payload?: LoggerQueryPayload): Promise<ILogger[]> {
    const where = this.buildWhereClause(payload);

    let skip: number | undefined;
    let take: number | undefined;

    if (payload?.page && payload?.perPage) {
      skip = (payload.page - 1) * payload.perPage;
      take = payload.perPage;
    }

    const loggers = await Model.find(where)
      .populate(this.populateOptions)
      // .sort(sortOption)
      .skip(skip ?? 0)
      .limit(take ?? 0);

    return loggers.map(this.transform);
  }

  async update({ _id, ...payload }: LoggerUpdatePayload): Promise<ILogger> {
    const logger = await Model.findOne({ _id });

    if (!logger) throw new Error('logger not found');

    logger.set(payload);

    await logger.save();

    const populated = await logger.populate(this.populateOptions);

    return this.transform(populated);
  }

  async count(payload?: LoggerQueryPayload): Promise<number> {
    const where = this.buildWhereClause(payload);
    return Model.countDocuments(where);
  }
}
