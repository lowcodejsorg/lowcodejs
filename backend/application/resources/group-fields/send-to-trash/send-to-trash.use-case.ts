/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField, IField as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupFieldSendToTrashPayload } from './send-to-trash.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldSendToTrashPayload;

@Service()
export default class GroupFieldSendToTrashUseCase {
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

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );
      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      const field = await this.fieldRepository.findBy({
        _id: payload.fieldId,
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

      // Atualiza o grupo com o campo atualizado
      const updatedGroups = table.groups.map((g) => {
        if (g.slug !== targetGroup.slug) return g;

        const updatedFields = g.fields.map((f) =>
          f._id === field._id ? updatedField : f,
        );
        const groupSchema = buildSchema(updatedFields);

        return {
          ...g,
          fields: updatedFields,
          _schema: groupSchema,
        };
      });

      // Reconstrói o schema da tabela pai com os grupos atualizados
      const parentSchema = buildSchema(table.fields as IField[], updatedGroups);

      await this.tableRepository.update({
        _id: table._id,
        _schema: parentSchema,
        groups: updatedGroups,
        owner: table.owner._id,
        administrators: table.administrators.flatMap((a) => a._id),
      });

      return right(updatedField);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'SEND_GROUP_FIELD_TO_TRASH_ERROR',
        ),
      );
    }
  }
}
