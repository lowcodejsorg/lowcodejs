/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { maskPasswordFields } from '@application/core/row-password-helper.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { GroupRowListPayload } from './list.validator';

type Response = Either<HTTPException, Record<string, any>[]>;
type Payload = GroupRowListPayload;

@Service()
export default class GroupRowListUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

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

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await build
        .findOne({ _id: payload.rowId })
        .populate(populate);

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const rowJson = row.toJSON({ flattenObjectIds: true });

      const items = rowJson[groupField.slug] || [];

      const group = table.groups?.find((g) => g.slug === payload.groupSlug);
      const groupFields = group?.fields || [];
      for (const item of items) {
        maskPasswordFields(item, groupFields as IField[]);
      }

      return right(items);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'LIST_GROUP_ROWS_ERROR',
        ),
      );
    }
  }
}
