/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import { type IField, type IRow } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import {
  hashPasswordFields,
  maskPasswordFields,
} from '@application/core/row-password-helper.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { executeScript } from '@application/core/table/handler';
import type { FieldDefinition } from '@application/core/table/types';
import { buildPopulate, buildTable } from '@application/core/util.core';
import { User } from '@application/model/user.model';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

type Response = Either<HTTPException, IRow>;

// type Payload = TableRowCreatePayload;

type Payload = {
  [x: string]: any;
};

@Service()
export default class TableRowCreateUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const errors = validateRowPayload(payload, table.fields, table.groups);

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      await hashPasswordFields(payload, table.fields as IField[]);

      const build = await buildTable(table);

      const populate = await buildPopulate(
        table.fields as IField[],
        table.groups,
      );

      const createData: Record<string, any> = {
        ...payload,
        creator: payload.creator ?? null,
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

        const userFieldSlugs = fields
          .filter((f) => f.type === 'USER')
          .map((f) => f.slug);
        const scriptDoc: Record<string, any> = { ...createData };

        if (userFieldSlugs.length > 0) {
          const allUserIds: string[] = [];
          for (const slug of userFieldSlugs) {
            const val = createData[slug];
            if (Array.isArray(val)) {
              allUserIds.push(...val.filter((v: any) => typeof v === 'string'));
            } else if (typeof val === 'string' && val) {
              allUserIds.push(val);
            }
          }

          if (allUserIds.length > 0) {
            const users = await User.find(
              { _id: { $in: allUserIds } },
              { _id: 1, name: 1, email: 1 },
            ).lean();
            const userMap = new Map(
              users.map((u: any) => [u._id.toString(), u]),
            );

            for (const slug of userFieldSlugs) {
              const val = createData[slug];
              if (Array.isArray(val)) {
                scriptDoc[slug] = val.map(
                  (id: any) => userMap.get(String(id)) ?? id,
                );
              } else if (typeof val === 'string' && userMap.has(val)) {
                scriptDoc[slug] = userMap.get(val);
              }
            }
          }
        }

        const result = await executeScript({
          code: beforeSaveCode,
          doc: scriptDoc,
          tableSlug: table.slug,
          fields: fieldDefs,
          context: {
            userAction: 'novo_registro',
            executionMoment: 'antes_salvar',
            userId: payload.creator ?? undefined,
            isNew: true,
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

        const userSlugSet = new Set(userFieldSlugs);
        for (const key of Object.keys(scriptDoc)) {
          if (!userSlugSet.has(key)) {
            createData[key] = scriptDoc[key];
          }
        }
      }

      const created = await build.create(createData);

      const row = await created.populate(populate);

      const rowJson = {
        ...row?.toJSON({
          flattenObjectIds: true,
        }),
        _id: row?._id?.toString(),
      };

      maskPasswordFields(rowJson, table.fields as IField[]);

      return right(rowJson);
    } catch (error) {
      console.error(error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'CREATE_ROW_ERROR',
        ),
      );
    }
  }
}
