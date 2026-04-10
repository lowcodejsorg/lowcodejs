/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IRow } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';
import { RowPasswordContractService } from '@application/services/row-password/row-password-contract.service';
import { ScriptExecutionContractService } from '@application/services/script-execution/script-execution-contract.service';

type Response = Either<HTTPException, IRow>;

type Payload = Record<string, unknown> & {
  slug: string;
  _id: string;
};

@Service()
export default class TableRowUpdateUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
    private readonly rowPasswordService: RowPasswordContractService,
    private readonly scriptExecutionService: ScriptExecutionContractService,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(payload.slug);

      if (!table) {
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );
      }

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

      this.rowPasswordService.stripMasked(payload, table.fields);
      await this.rowPasswordService.hash(payload, table.fields);

      const beforeSaveCode = table.methods?.beforeSave?.code;
      if (beforeSaveCode) {
        const existing = await this.rowRepository.findOne({
          table,
          query: { _id: payload._id },
        });

        if (!existing) {
          return left(
            HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
          );
        }

        const fieldDefs = table.fields.map((f) => ({
          slug: f.slug,
          type: f.type,
          name: f.name,
          dropdown: f.dropdown,
        }));

        const userFieldSlugs = new Set(
          table.fields.filter((f) => f.type === 'USER').map((f) => f.slug),
        );

        const mergedData: Record<string, any> = {
          ...existing,
          ...payload,
        };

        const scriptDoc: Record<string, any> = { ...mergedData };
        for (const slug of userFieldSlugs) {
          if (slug in payload) {
            scriptDoc[slug] = existing[slug];
          }
        }

        const result = await this.scriptExecutionService.execute({
          code: beforeSaveCode,
          doc: scriptDoc,
          tableSlug: table.slug,
          fields: fieldDefs,
          context: {
            userAction: 'editar_registro',
            executionMoment: 'antes_salvar',
            userId:
              typeof payload.creator === 'string' ? payload.creator : undefined,
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
            payload[key] = scriptDoc[key];
          }
        }
      }

      const row = await this.rowRepository.update({
        table,
        _id: payload._id,
        data: payload,
      });

      if (!row) {
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );
      }

      this.rowPasswordService.mask(row, table.fields);

      return right(row);
    } catch (error) {
      console.error('[table-rows > update][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'UPDATE_ROW_TABLE_ERROR',
        ),
      );
    }
  }
}
