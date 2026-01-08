/* eslint-disable no-unused-vars */
import type { IEvaluation, Merge } from '@application/core/entity.core';

export type EvaluationCreatePayload = Merge<
  Pick<IEvaluation, 'value'>,
  { user: string }
>;

export type EvaluationUpdatePayload = Merge<
  Pick<IEvaluation, '_id'>,
  Partial<EvaluationCreatePayload>
>;

export type EvaluationFindByPayload = Merge<
  Partial<Pick<IEvaluation, '_id'>>,
  { user?: string; exact: boolean }
>;

export type EvaluationQueryPayload = {
  page?: number;
  perPage?: number;
  user?: string;
};

export abstract class EvaluationContractRepository {
  abstract create(payload: EvaluationCreatePayload): Promise<IEvaluation>;
  abstract findBy(
    payload: EvaluationFindByPayload,
  ): Promise<IEvaluation | null>;
  abstract findMany(payload?: EvaluationQueryPayload): Promise<IEvaluation[]>;
  abstract update(payload: EvaluationUpdatePayload): Promise<IEvaluation>;
  abstract delete(_id: string): Promise<void>;
  abstract count(payload?: EvaluationQueryPayload): Promise<number>;
}
