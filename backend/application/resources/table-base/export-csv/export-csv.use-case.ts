/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import type { Readable } from 'node:stream';

import {
  buildCsvStream,
  EXPORT_CSV_LIMIT,
  ExportLimitExceededError,
  iterateInBatches,
  type CsvField,
} from '@application/core/csv/csv-stream';
import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { ITable, IUser } from '@application/core/entity.core';
import { E_TABLE_TYPE } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { TableContractRepository } from '@application/repositories/table/table-contract.repository';

import type { TableExportCsvPayload } from './export-csv.validator';

type Response = Either<HTTPException, Readable>;

const FIELDS: CsvField[] = [
  { label: 'ID', value: '_id' },
  { label: 'Nome', value: 'name' },
  { label: 'Slug', value: 'slug' },
  { label: 'Tipo', value: 'type' },
  { label: 'Estilo', value: 'style' },
  { label: 'Visibilidade', value: 'visibility' },
  { label: 'Colaboração', value: 'collaboration' },
  { label: 'Proprietário', value: 'owner' },
  { label: 'Lixeira', value: 'trashed' },
  { label: 'Criado em', value: 'createdAt' },
  { label: 'Atualizado em', value: 'updatedAt' },
];

function ownerName(owner: ITable['owner']): string {
  if (!owner) return '';
  if (typeof owner === 'string') return owner;
  return (owner as IUser).name ?? (owner as IUser)._id ?? '';
}

function toCsvRow(table: ITable): Record<string, unknown> {
  return {
    _id: table._id,
    name: table.name ?? '',
    slug: table.slug ?? '',
    type: table.type ?? '',
    style: table.style ?? '',
    visibility: table.visibility ?? '',
    collaboration: table.collaboration ?? '',
    owner: ownerName(table.owner),
    trashed: table.trashed ? 'true' : 'false',
    createdAt: table.createdAt ? new Date(table.createdAt).toISOString() : '',
    updatedAt: table.updatedAt ? new Date(table.updatedAt).toISOString() : '',
  };
}

@Service()
export default class TableExportCsvUseCase {
  constructor(private readonly tableRepository: TableContractRepository) {}

  async execute(payload: TableExportCsvPayload): Promise<Response> {
    try {
      const trashed = payload.trashed === 'true';

      const sort: Record<string, 'asc' | 'desc'> = {};
      if (payload['order-name']) sort.name = payload['order-name'];
      if (payload['order-link']) sort.slug = payload['order-link'];
      if (payload['order-created-at'])
        sort.createdAt = payload['order-created-at'];
      if (payload['order-visibility'])
        sort.visibility = payload['order-visibility'];
      if (payload['order-owner']) sort['owner.name'] = payload['order-owner'];

      const filter = {
        search: payload.search ?? payload.name,
        type: E_TABLE_TYPE.TABLE,
        trashed,
        owner: payload.owner,
        visibility: payload.visibility,
      };

      const total = await this.tableRepository.count(filter);

      if (total > EXPORT_CSV_LIMIT) {
        return left(
          HTTPException.UnprocessableEntity(
            `Resultado excede o limite de ${EXPORT_CSV_LIMIT.toLocaleString('pt-BR')} linhas. Refine os filtros antes de exportar.`,
            'EXPORT_LIMIT_EXCEEDED',
          ),
        );
      }

      console.info(`[table-base > export-csv] count=${total}`);

      const source = iterateInBatches({
        payload: filter,
        fetchBatch: async (p, page, perPage) => {
          const batch = await this.tableRepository.findMany({
            ...p,
            page,
            perPage,
            sort,
          });
          return batch.map(toCsvRow);
        },
      });

      const stream = buildCsvStream({ source, fields: FIELDS });

      return right(stream);
    } catch (error) {
      if (error instanceof ExportLimitExceededError) {
        return left(
          HTTPException.UnprocessableEntity(error.message, error.cause),
        );
      }
      console.error('[table-base > export-csv][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'EXPORT_TABLE_CSV_ERROR',
        ),
      );
    }
  }
}
