/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupRowDeletePayload } from './delete.validator';

type Response = Either<HTTPException, null>;
type Payload = GroupRowDeletePayload;

@Service()
export default class GroupRowDeleteUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

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

      const groupField = table.fields?.find(
        (f) =>
          f.type === E_FIELD_TYPE.FIELD_GROUP &&
          f.group?.slug === payload.groupSlug,
      );

      if (!groupField) {
        return left(
          HTTPException.NotFound('Grupo não encontrado', 'GROUP_NOT_FOUND'),
        );
      }

      const build = await buildTable(table);

      const row = await build.findOne({ _id: payload.rowId });

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      // Encontra o subdocumento pelo itemId
      const subdoc = (row as any)[groupField.slug]?.id(payload.itemId);

      if (!subdoc)
        return left(
          HTTPException.NotFound('Item não encontrado', 'ITEM_NOT_FOUND'),
        );

      // Remove o subdocumento
      subdoc.deleteOne();

      await row.save();

      return right(null);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'DELETE_GROUP_ROW_ERROR',
        ),
      );
    }
  }
}
