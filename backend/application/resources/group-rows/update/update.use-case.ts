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
  stripMaskedPasswordFields,
} from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<HTTPException, Record<string, any>>;
type Payload = { [x: string]: any };

@Service()
export default class GroupRowUpdateUseCase {
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

      const group = table.groups?.find((g) => g.slug === payload.groupSlug);

      if (!group) {
        return left(
          HTTPException.NotFound('Grupo não encontrado', 'GROUP_NOT_FOUND'),
        );
      }

      // Valida os campos do item contra os campos do grupo (skipMissing)
      const groupFields = group.fields || [];

      const errors = validateRowPayload(
        payload,
        groupFields as IField[],
        table.groups,
        { skipMissing: true },
      );

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      // Remove campos PASSWORD mascarados/vazios e hash dos novos
      stripMaskedPasswordFields(payload, groupFields as IField[]);
      await hashPasswordFields(payload, groupFields as IField[]);

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

      // Atualiza o subdocumento com os dados do payload
      const { slug, rowId, groupSlug, itemId, ...itemData } = payload;
      subdoc.set(itemData);

      await row.save();

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      await row.populate(populate);

      const rowJson = row.toJSON({ flattenObjectIds: true });

      // Retorna o item atualizado
      const items = rowJson[groupField.slug] || [];
      const updatedItem = items.find(
        (i: any) => i._id?.toString() === payload.itemId,
      );

      if (updatedItem) {
        maskPasswordFields(updatedItem, groupFields as IField[]);
      }

      return right(updatedItem || rowJson);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_GROUP_ROW_ERROR',
        ),
      );
    }
  }
}
