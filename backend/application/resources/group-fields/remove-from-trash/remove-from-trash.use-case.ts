/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField, IField as Entity } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildSchema } from '@application/core/util.core';
import { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupFieldRemoveFromTrashPayload } from './remove-from-trash.validator';

type Response = Either<HTTPException, Entity>;
type Payload = GroupFieldRemoveFromTrashPayload;

@Service()
export default class GroupFieldRemoveFromTrashUseCase {
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
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const targetGroup = table.groups?.find(
        (g) => g.slug === payload.groupSlug,
      );
      if (!targetGroup) {
        return left(
          HTTPException.NotFound('Grupo não encontrado', 'GROUP_NOT_FOUND'),
        );
      }

      const field = await this.fieldRepository.findBy({
        _id: payload.fieldId,
        exact: true,
      });

      if (!field)
        return left(
          HTTPException.NotFound('Campo não encontrado', 'FIELD_NOT_FOUND'),
        );

      if (!field.trashed)
        return left(
          HTTPException.Conflict(
            'Campo não está na lixeira',
            'NOT_TRASHED',
          ),
        );

      const updatedField = await this.fieldRepository.update({
        _id: field._id,
        showInList: true,
        showInForm: true,
        showInDetail: true,
        showInFilter: true,
        required: false,
        trashed: false,
        trashedAt: null,
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
          'Erro interno do servidor',
          'REMOVE_GROUP_FIELD_FROM_TRASH_ERROR',
        ),
      );
    }
  }
}
