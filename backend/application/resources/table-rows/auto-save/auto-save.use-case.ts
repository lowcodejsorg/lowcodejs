/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';

import { Either, left, right } from '@application/core/either.core';
import { E_FIELD_TYPE, IField, IRow } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { validateRowPayload } from '@application/core/row-payload-validator.core';
import { RowContractRepository } from '@application/repositories/row/row-contract.repository';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import { TableRowAutoSavePayload } from './auto-save.validator';
type Response = Either<HTTPException, IRow>;

type Payload = TableRowAutoSavePayload;

type Draft = {
  payload: Omit<Payload, 'slug'>;
  fields: IField[];
};

@Service()
export default class TableRowAutoSaveUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly rowRepository: RowContractRepository,
  ) {}

  async execute({ slug, _id: rowId, ...payload }: Payload): Promise<Response> {
    try {
      const table = await this.tableRepository.findBySlug(slug);

      if (!table)
        return left(
          HTTPException.NotFound('Tabela não encontrada', 'TABLE_NOT_FOUND'),
        );

      const isIncomplete = this.isIncomplete({ fields: table.fields, payload });

      const draft = this.drafting({
        payload,
        fields: table.fields,
      });

      const fields = table.fields.filter((field) => {
        return (
          !field.native &&
          !field.trashed &&
          field.required &&
          field.slug in payload
        );
      });

      const errors = validateRowPayload(draft, fields, table.groups);

      if (errors) {
        return left(
          HTTPException.BadRequest(
            'Requisição inválida',
            'INVALID_PAYLOAD_FORMAT',
            errors,
          ),
        );
      }

      let trashed: { trashed: boolean; trashedAt: string | null } = {
        trashed: true,
        trashedAt: new Date().toISOString(),
      };

      if (!isIncomplete)
        trashed = {
          trashed: false,
          trashedAt: null,
        };

      if (!rowId) {
        const created = await this.rowRepository.create({
          data: {
            ...draft,
            ...trashed,
          },
          table,
        });

        return right(created);
      }

      const row = await this.rowRepository.findOne({
        query: { _id: rowId },
        table,
      });

      if (!row)
        return left(
          HTTPException.NotFound('Registro não encontrado', 'ROW_NOT_FOUND'),
        );

      const updated = await this.rowRepository.update({
        _id: rowId.toString(),
        data: {
          ...draft,
          ...trashed,
        },
        table,
      });

      return right(updated);
    } catch (error) {
      console.error('[table-rows > auto-save][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'AUTO_SAVE_ROW_ERROR',
        ),
      );
    }
  }

  private drafting(data: Draft): Draft['payload'] {
    const FIELD_DEFAULT_MAPPER: Record<string, string | string[]> = {
      [E_FIELD_TYPE.TEXT_SHORT]: '-',
      [E_FIELD_TYPE.TEXT_LONG]: '-',
      [E_FIELD_TYPE.DROPDOWN]: [],
      [E_FIELD_TYPE.DATE]: new Date().toISOString(),
      [E_FIELD_TYPE.RELATIONSHIP]: [],
      [E_FIELD_TYPE.FILE]: [],
      // [E_FIELD_TYPE.REACTION]: [],
      // [E_FIELD_TYPE.EVALUATION]: [],
      [E_FIELD_TYPE.CATEGORY]: [],
      [E_FIELD_TYPE.USER]: [],
    };

    return data.fields.reduce(
      (accumulator, field) => {
        if (field.native) return accumulator;
        if (field.trashed) return accumulator;
        if (field.slug in accumulator) return accumulator;

        accumulator[field.slug] = FIELD_DEFAULT_MAPPER[field.type];

        return accumulator;
      },
      { ...data.payload },
    );
  }

  private isIncomplete(data: Draft): boolean {
    return data.fields.some((field) => {
      if (field.native) return false;
      if (field.trashed) return false;
      if (!field.required) return false;

      if (field.slug in data.payload) return false;

      return true;
    });
  }
}
