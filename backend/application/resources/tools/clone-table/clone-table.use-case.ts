/* eslint-disable no-unused-vars */
import { Service } from 'fastify-decorators';
import slugify from 'slugify';

import type { Either } from '@application/core/either.core';
import { left, right } from '@application/core/either.core';
import type { IField, ITable } from '@application/core/entity.core';
import HTTPException from '@application/core/exception.core';
import type { FieldContractRepository } from '@application/repositories/field/field-contract.repository';
import type {
  TableContractRepository,
  TableCreatePayload,
} from '@application/repositories/table/table-contract.repository';

import type { CloneTablePayload } from './clone-table.validator';

export type CloneTableUseCasePayload = CloneTablePayload & {
  ownerId: string;
};

type Response = Either<
  HTTPException,
  {
    table: ITable;
    fieldIdMap: Record<string, string>;
  }
>;

@Service()
export default class CloneTableUseCase {
  constructor(
    private readonly tableRepository: TableContractRepository,
    private readonly fieldRepository: FieldContractRepository,
  ) {}

  async execute(payload: CloneTableUseCasePayload): Promise<Response> {
    try {
      if (!payload.ownerId) {
        return left(
          HTTPException.BadRequest(
            'Owner ID é obrigatório',
            'OWNER_ID_REQUIRED',
          ),
        );
      }

      if (!payload.name || payload.name.trim().length === 0) {
        return left(
          HTTPException.BadRequest(
            'Nome da tabela é obrigatório',
            'NAME_REQUIRED',
          ),
        );
      }

      const baseTable = await this.tableRepository.findBy({
        _id: payload.baseTableId,
        exact: true,
      });

      if (!baseTable) {
        return left(
          HTTPException.NotFound(
            'Tabela base não encontrada',
            'TABLE_NOT_FOUND',
          ),
        );
      }

      const newSlug = slugify(payload.name, {
        lower: true,
        strict: true,
        trim: true,
      });

      const { newFieldIds, fieldIdMap } = await this.cloneFields(
        baseTable.fields,
      );

      const orderList = this.remapFieldIds(
        baseTable.configuration?.fields?.orderList,
        fieldIdMap,
      );

      const orderForm = this.remapFieldIds(
        baseTable.configuration?.fields?.orderForm,
        fieldIdMap,
      );

      const createPayload: TableCreatePayload = {
        name: payload.name,
        slug: newSlug,
        description: baseTable.description ?? null,
        type: baseTable.type,
        logo: baseTable.logo?._id ?? null,
        fields: newFieldIds,
        configuration: {
          style: baseTable.configuration?.style,
          visibility: baseTable.configuration?.visibility,
          collaboration: baseTable.configuration?.collaboration,
          administrators: baseTable.configuration?.administrators.flatMap(
            (a) => a._id,
          ),
          owner: payload.ownerId,
          fields: {
            orderList,
            orderForm,
          },
        },
        methods: baseTable.methods,
      };

      const newTable = await this.tableRepository.create(createPayload);

      return right({
        table: newTable,
        fieldIdMap,
      });
    } catch (_error) {
      return left(
        HTTPException.InternalServerError(
          'Erro ao clonar tabela',
          'CLONE_TABLE_ERROR',
        ),
      );
    }
  }

  private async cloneFields(
    fields: IField[],
  ): Promise<{ newFieldIds: string[]; fieldIdMap: Record<string, string> }> {
    const newFieldIds: string[] = [];
    const fieldIdMap: Record<string, string> = {};

    if (!fields || !Array.isArray(fields)) {
      return { newFieldIds, fieldIdMap };
    }

    for (const field of fields) {
      const createdField = await this.fieldRepository.create({
        name: field.name,
        slug: field.slug,
        type: field.type,
        configuration: field.configuration,
      });

      newFieldIds.push(createdField._id);
      fieldIdMap[field._id] = createdField._id;
    }

    return { newFieldIds, fieldIdMap };
  }

  private remapFieldIds(
    ids: string[] | undefined,
    map: Record<string, string>,
  ): string[] {
    if (!Array.isArray(ids)) return [];

    return ids.map((id) => map[id]).filter(Boolean);
  }
}
