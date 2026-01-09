/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { EvaluationContractRepository } from '@application/repositories/evaluation/evaluation-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableRowEvaluationPayload } from './evaluation.validator';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

type Payload = TableRowEvaluationPayload;

@Service()
export default class TableRowEvaluationUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly evaluationRepository: EvaluationContractRepository,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBy({
        slug: payload.slug,
        exact: true,
      });

      if (!table)
        return left(
          HTTPException.NotFound('Table not found', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable(table);

      const populate = await buildPopulate(table.fields as IField[]);

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      let evaluation = await this.evaluationRepository.findBy({
        user: payload.user,
        exact: true,
      });

      if (!evaluation) {
        evaluation = await this.evaluationRepository.create({
          value: payload.value,
          user: payload.user,
        });
      } else {
        evaluation = await this.evaluationRepository.update({
          _id: evaluation._id,
          value: payload.value,
        });
      }

      const evaluations =
        row[payload.field]?.flatMap((r: ObjectId) => r?.toString()) ?? [];
      const evaluationId = evaluation?._id?.toString();

      if (!evaluations.includes(evaluationId))
        await row.set(payload.field, [...evaluations, evaluationId]).save();

      const populated = await row?.populate(populate);

      return right({
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id?.toString(),
      });
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'EVALUATION_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
