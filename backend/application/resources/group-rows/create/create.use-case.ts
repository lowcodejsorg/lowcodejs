/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import { E_FIELD_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  hashPasswordFields,
  maskPasswordFields,
} from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<HTTPException, Record<string, any>>;
type Payload = { [x: string]: any };

@Service()
export default class GroupRowCreateUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

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

      // Encontra o campo FIELD_GROUP correspondente
      const groupField = table.fields?.find(
        (f) =>
          f.type === E_FIELD_TYPE.FIELD_GROUP &&
          f.group?.slug === payload.groupSlug,
      );

      if (!groupField) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      const group = table.groups?.find((g) => g.slug === payload.groupSlug);

      if (!group) {
        return left(
          HTTPException.NotFound('Group not found', 'GROUP_NOT_FOUND'),
        );
      }

      // Valida os campos do item contra os campos do grupo
      const groupFields = group.fields || [];

      const errors = validateRowPayload(
        payload,
        groupFields as IField[],
        table.groups,
      );

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Invalid request',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      // Hash password fields se necessário
      await hashPasswordFields(payload, groupFields as IField[]);

      const build = await buildTable(table);

      const row = await build.findOne({ _id: payload.rowId });

      if (!row)
        return left(HTTPException.NotFound('Row not found', 'ROW_NOT_FOUND'));

      // Remove _id do payload para que o Mongoose gere um novo
      const { _id, slug, rowId, groupSlug, ...itemData } = payload;

      // Push o novo item no array embedded
      const groupData = (row as any)[groupField.slug] || [];
      groupData.push(itemData);
      row.set(groupField.slug, groupData);

      await row.save();

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      await row.populate(populate);

      const rowJson = {
        ...row.toJSON({ flattenObjectIds: true }),
        _id: row._id?.toString(),
      };

      maskPasswordFields(rowJson, table.fields as IField[]);

      // Retorna o último item adicionado
      const addedItems = (rowJson as any)[groupField.slug];
      const lastItem = addedItems?.[addedItems.length - 1];

      return right(lastItem || rowJson);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Internal server error',
          'CREATE_GROUP_ROW_ERROR',
        ),
      );
    }
  }
}
