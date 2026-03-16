/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableFieldSendToTrashPayload } from './send-to-trash.validator';

type Response = Either<HTTPException, Entity>;
type Payload = TableFieldSendToTrashPayload;

@Service()
export default class TableFieldSendToTrashUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
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

      const field = await this.fieldRepository.findBy({
        _id: payload._id,
        exact: true,
      });

      if (!field)
        return left(
          HTTPException.NotFound('Field not found', 'FIELD_NOT_FOUND'),
        );

      if (field.native) {
        return left(
          HTTPException.Forbidden(
            'Native fields cannot be trashed',
            'NATIVE_FIELD_CANNOT_BE_TRASHED',
          ),
        );
      }

      if (field.locked) {
        return left(
          HTTPException.Forbidden(
            'Field is locked and cannot be trashed',
            'FIELD_LOCKED',
          ),
        );
      }

      if (field.trashed)
        return left(
          HTTPException.Conflict('Field already in trash', 'ALREADY_TRASHED'),
        );

      const updatedField = await this.fieldRepository.update({
        _id: field._id,
        showInList: false,
        showInForm: false,
        showInDetail: false,
        showInFilter: false,
        required: false,
        trashed: true,
        trashedAt: new Date(),
      });

      const fields = table.fields.map((f) =>
        f._id === field._id ? updatedField : f,
      );

      const _schema = buildSchema(fields);

      await this.tableRepository.update({
        _id: table._id,
        fields: fields.flatMap((f) => f._id),
        _schema,
        owner: table.owner._id,
      });

      return right(updatedField);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SEND_FIELD_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
