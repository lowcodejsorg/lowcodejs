/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type { ObjectId } from 'mongoose';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  buildPopulate,
  buildTable,
  transformRowContext,
} from '@application/core/util.core';
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
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const c = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await c.findOne({
        _id: payload._id,
      });

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const existingIds: string[] =
        row[payload.field]?.flatMap((r: ObjectId) => r?.toString()) ?? [];

      let oldEvaluationId: string | null = null;

      for (const id of existingIds) {
        const found = await this.evaluationRepository.findBy({
          _id: id,
          user: payload.user,
          exact: true,
        });
        if (found) {
          oldEvaluationId = found._id;
          break;
        }
      }

      const evaluation = await this.evaluationRepository.create({
        value: payload.value,
        user: payload.user,
      });

      const evaluationId = evaluation._id.toString();

      if (oldEvaluationId) {
        const updatedIds = existingIds.map((id) =>
          id === oldEvaluationId ? evaluationId : id,
        );
        await row.set(payload.field, updatedIds).save();
        await this.evaluationRepository.delete(oldEvaluationId);
      } else {
        await row.set(payload.field, [...existingIds, evaluationId]).save();
      }

      const populated = await row?.populate(populate);

      const rowJson = {
        ...populated?.toJSON({
          flattenObjectIds: true,
        }),
        _id: populated?._id?.toString(),
      };

      return right(
        transformRowContext(rowJson, table.fields as IField[], payload.user),
      );
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'EVALUATION_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
