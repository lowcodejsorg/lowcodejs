/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  hashPasswordFields,
  maskPasswordFields,
  stripMaskedPasswordFields,
} from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
// import TableFieldRowValidation from '@application/core/table-field-row-validation.exception';
import { executeScript } from '@application/core/table/handler';
import type { FieldDefinition } from '@application/core/table/types';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<
  HTTPException,
  import('@application/core/entity.core').IRow
>;

// type Payload = TableRowUpdatePayload;
type Payload = {
  [x: string]: any;
};

@Service()
export default class TableRowUpdateUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const errors = validateRowPayload(payload, table.fields, table.groups, {
        skipMissing: true,
      });

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      stripMaskedPasswordFields(payload, table.fields as IField[]);
      await hashPasswordFields(payload, table.fields as IField[]);

      const build = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const row = await build.findOne({ _id: payload._id }).populate(populate);

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const populatedJson = row.toJSON({ flattenObjectIds: true });

      const mergedData: Record<string, any> = {
        ...populatedJson,
        ...payload,
      };

      const beforeSaveCode = table.methods?.beforeSave?.code;
      if (beforeSaveCode) {
        const fields = table.fields as IField[];
        const fieldDefs: FieldDefinition[] = fields.map((f) => ({
          slug: f.slug,
          type: f.type,
          name: f.name,
          dropdown: f.dropdown ?? undefined,
        }));

        const userFieldSlugs = new Set(
          fields.filter((f) => f.type === 'USER').map((f) => f.slug),
        );
        const scriptDoc: Record<string, any> = { ...mergedData };
        for (const slug of userFieldSlugs) {
          if (slug in payload) {
            scriptDoc[slug] = populatedJson[slug];
          }
        }

        const result = await executeScript({
          code: beforeSaveCode,
          doc: scriptDoc,
          tableSlug: table.slug,
          fields: fieldDefs,
          context: {
            userAction: 'editar_registro',
            executionMoment: 'antes_salvar',
            userId: payload.creator ?? undefined,
            isNew: false,
            tableInfo: {
              _id: table._id?.toString() ?? '',
              name: table.name,
              slug: table.slug,
            },
          },
        });

        if (result.logs.length > 0) {
          console.log(
            `[beforeSave][${table.slug}] logs:`,
            result.logs.join('\n'),
          );
        }

        if (!result.success) {
          console.error(
            `[beforeSave][${table.slug}] error:`,
            result.error?.message,
          );
        }

        for (const key of Object.keys(scriptDoc)) {
          if (!userFieldSlugs.has(key)) {
            mergedData[key] = scriptDoc[key];
          }
        }
      }

      await row.set(mergedData).save();

      await row.populate(populate);

      const rowJson = {
        ...row.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      };

      maskPasswordFields(rowJson, table.fields as IField[]);

      // @ts-ignore
      return right(rowJson);
    } catch (error) {
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
