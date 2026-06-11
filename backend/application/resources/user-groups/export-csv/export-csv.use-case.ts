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
import type { IGroup } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import { UserGroupContractRepository } from '@application/repositories/user-group/user-group-contract.repository';

import type { UserGroupExportCsvPayload } from './export-csv.validator';

type Response = Either<HTTPException, Readable>;

const FIELDS: CsvField[] = [
  { label: 'ID', value: '_id' },
  { label: 'Nome', value: 'name' },
  { label: 'Slug', value: 'slug' },
  { label: 'Descrição', value: 'description' },
  { label: 'Quantidade de Permissões', value: 'permissionsCount' },
  { label: 'Criado em', value: 'createdAt' },
  { label: 'Atualizado em', value: 'updatedAt' },
];

function toCsvRow(group: IGroup): Record<string, unknown> {
  return {
    _id: group._id,
    name: group.name ?? '',
    slug: group.slug ?? '',
    description: group.description ?? '',
    permissionsCount: Array.isArray(group.permissions)
      ? group.permissions.length
      : 0,
    createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : '',
    updatedAt: group.updatedAt ? new Date(group.updatedAt).toISOString() : '',
  };
}

@Service()
export default class UserGroupExportCsvUseCase {
  constructor(
    private readonly userGroupRepository: UserGroupContractRepository,
  ) {}

  async execute(payload: UserGroupExportCsvPayload): Promise<Response> {
    try {
      const sort: Record<string, 'asc' | 'desc'> = {};
      if (payload['order-name']) sort.name = payload['order-name'];
      if (payload['order-description'])
        sort.description = payload['order-description'];
      if (payload['order-created-at'])
        sort.createdAt = payload['order-created-at'];

      const total = await this.userGroupRepository.count({
        search: payload.search,
        trashed: payload.trashed,
        user: payload.user,
      });

      if (total > EXPORT_CSV_LIMIT) {
        return left(
          HTTPException.UnprocessableEntity(
            `Resultado excede o limite de ${EXPORT_CSV_LIMIT.toLocaleString('pt-BR')} linhas. Refine os filtros antes de exportar.`,
            'EXPORT_LIMIT_EXCEEDED',
          ),
        );
      }

      console.info(
        `[user-groups > export-csv] user=${payload.user?._id ?? 'unknown'} count=${total}`,
      );

      const source = iterateInBatches({
        payload: { ...payload, sort },
        fetchBatch: async (p, page, perPage) => {
          const batch = await this.userGroupRepository.findMany({
            page,
            perPage,
            search: p.search,
            trashed: p.trashed,
            user: p.user,
            sort: p.sort,
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
      console.error('[user-groups > export-csv][error]:', error);
      return left(
        HTTPException.InternalServerError(
          'Erro interno do servidor',
          'EXPORT_USER_GROUP_CSV_ERROR',
        ),
      );
    }
  }
}
